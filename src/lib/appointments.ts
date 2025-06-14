import { supabase } from '../config/supabase';

export interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  max_participants: number;
  current_participants: number;
  status: 'available' | 'booked' | 'cancelled';
  trainer_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentBooking {
  id: string;
  appointment_id: string;
  user_id: string;
  status: 'confirmed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  user?: {
    name: string | null;
    email: string;
  };
}

export async function createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'current_participants' | 'status'>) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...appointment,
      status: 'available',
      current_participants: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Appointment;
}

export async function getAvailableAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('status', 'available')
    .gt('start_time', new Date().toISOString())
    .order('start_time');

  if (error) throw error;
  return data as Appointment[];
}

export async function getTrainerAppointments(trainerId: string) {
  // Get all appointments with their bookings
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      appointment_bookings (
        id,
        user_id,
        status
      )
    `)
    .eq('trainer_id', trainerId)
    .order('start_time');

  if (error) throw error;

  // Extract all unique user IDs from the bookings
  const userIds = new Set<string>();
  data.forEach(appointment => {
    appointment.appointment_bookings.forEach((booking: Partial<AppointmentBooking>) => {
      if (booking.user_id) userIds.add(booking.user_id);
    });
  });

  // Fetch all user details in a single query
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', Array.from(userIds));

  if (usersError) {
    console.error('Error fetching user details:', usersError);
    // Return appointments without user details rather than failing completely
    return data as (Appointment & { appointment_bookings: AppointmentBooking[] })[];
  }

  // Create a map of user IDs to user details for quick lookup
  const userMap = new Map();
  usersData.forEach(user => {
    userMap.set(user.id, { name: user.name, email: user.email });
  });

  // Add user details to each booking
  const appointmentsWithUserDetails = data.map(appointment => {
    const bookingsWithUsers = appointment.appointment_bookings.map((booking: Partial<AppointmentBooking>) => {
      const userData = userMap.get(booking.user_id);
      return {
        id: booking.id,
        user_id: booking.user_id,
        status: booking.status,
        user: userData ? {
          name: userData.name,
          email: userData.email
        } : undefined
      };
    });

    return {
      ...appointment,
      appointment_bookings: bookingsWithUsers
    };
  });

  return appointmentsWithUserDetails as (Appointment & { appointment_bookings: AppointmentBooking[] })[];
}

export async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from('appointment_bookings')
    .select('*, appointments(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as (AppointmentBooking & { appointments: Appointment })[];
}

export async function bookAppointment(appointmentId: string, userId: string) {
  // Start a Supabase transaction
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('current_participants, max_participants')
    .eq('id', appointmentId)
    .single();

  if (fetchError) throw fetchError;

  // Check if the appointment is full
  if (appointment.current_participants >= appointment.max_participants) {
    throw new Error('This appointment is already full');
  }

  // Create the booking and update the participant count
  const { data, error } = await supabase
    .from('appointment_bookings')
    .insert({
      appointment_id: appointmentId,
      user_id: userId,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) throw error;

  // Increment the current_participants count
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      current_participants: appointment.current_participants + 1,
      status: appointment.current_participants + 1 >= appointment.max_participants ? 'booked' : 'available'
    })
    .eq('id', appointmentId);

  if (updateError) throw updateError;

  return data as AppointmentBooking;
}

export async function cancelBooking(bookingId: string) {
  try {
    // Get the appointment_id first
    const { data: booking, error: fetchError } = await supabase
      .from('appointment_bookings')
      .select('appointment_id')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch booking: ${fetchError.message}`);
    }

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update the booking status
    const { data, error } = await supabase
      .from('appointment_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    // Decrement the current_participants count
    try {
      const { error: rpcError } = await supabase.rpc('decrement_participants', {
        appointment_id: booking.appointment_id
      });

      if (rpcError) {
        // Check for specific error codes
        if (rpcError.code === '42501') {
          throw new Error('You are not authorized to cancel this booking');
        } else if (rpcError.code === 'P0002') {
          throw new Error('The appointment no longer exists');
        } else {
          console.warn('RPC function failed, using manual update:', rpcError);
          
          // Get the current appointment data
          const { data: appointmentData, error: fetchError } = await supabase
            .from('appointments')
            .select('current_participants, max_participants')
            .eq('id', booking.appointment_id)
            .single();
          
          if (fetchError) {
            throw new Error(`Failed to fetch appointment: ${fetchError.message}`);
          }
          
          if (!appointmentData) {
            throw new Error('Appointment not found');
          }
          
          // Calculate new values
          const newParticipants = Math.max(0, appointmentData.current_participants - 1);
          const newStatus = newParticipants < appointmentData.max_participants ? 'available' : 'booked';
          
          // Update the appointment
          const { error: updateError } = await supabase
            .from('appointments')
            .update({
              current_participants: newParticipants,
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.appointment_id);
          
          if (updateError) {
            throw new Error(`Failed to update appointment: ${updateError.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating appointment participants:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    throw error;
  }
}

export async function deleteAppointment(appointmentId: string) {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
}
