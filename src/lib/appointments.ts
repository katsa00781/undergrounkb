import { supabase } from '../config/supabase';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  is_cancelled?: boolean;
  // Additional fields used in the application
  status?: 'available' | 'booked' | 'cancelled'; // Not in DB schema but used in app
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

export async function createAppointment(appointment: {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  max_participants: number;
}) {
  // Ellenőrizzük, hogy bejelentkezett-e a felhasználó
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to create appointments');
  }

  try {
    // Közvetlenül hozzáadjuk a szükséges mezőket
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        title: appointment.title,
        description: appointment.description,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        max_participants: appointment.max_participants,
        current_participants: 0,
        created_by: session.user.id, // Bejelentkezett felhasználó ID-ja
        is_cancelled: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
    
    return data as Appointment;
  } catch (error) {
    console.error('Exception in createAppointment:', error);
    throw error;
  }
}

export async function getAvailableAppointments() {
  // First get all non-cancelled future appointments
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('is_cancelled', false)
    .gt('start_time', new Date().toISOString())
    .order('start_time');

  if (error) throw error;
  
  // Then filter locally for available spots
  const availableAppointments = data?.filter(
    appointment => appointment.current_participants < appointment.max_participants
  ) || [];
  
  return availableAppointments as Appointment[];

  if (error) throw error;
  return data as Appointment[];
}

export async function getTrainerAppointments(trainerId: string) {
  // Get all appointments for the trainer
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .eq('created_by', trainerId)
    .order('start_time');

  if (appointmentsError) throw appointmentsError;
  
  // Külön lekérdezéssel kérjük le a foglalásokat minden időponthoz
  const data = await Promise.all(appointmentsData.map(async (appointment) => {
    const { data: bookings, error: bookingsError } = await supabase
      .from('appointment_bookings')
      .select('id, user_id, status')
      .eq('appointment_id', appointment.id);
    
    if (bookingsError) {
      console.warn(`Error fetching bookings for appointment ${appointment.id}:`, bookingsError);
      return { ...appointment, appointment_bookings: [] };
    }
    
    return { ...appointment, appointment_bookings: bookings || [] };
  }));

  // if (error) throw error;

  // Extract all unique user IDs from the bookings
  const userIds = new Set<string>();
  data.forEach(appointment => {
    appointment.appointment_bookings.forEach((booking: Partial<AppointmentBooking>) => {
      if (booking.user_id) userIds.add(booking.user_id);
    });
  });

  // Ha vannak felhasználói azonosítók, kérjük le a részleteket
  const userMap = new Map();
  
  if (userIds.size > 0) {
    // Fetch all user details in a single query
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', Array.from(userIds));

    if (usersError) {
      console.error('Error fetching user details:', usersError);
    } else if (usersData) {
      // Create a map of user IDs to user details for quick lookup
      usersData.forEach(user => {
        userMap.set(user.id, { name: user.name, email: user.email });
      });
    }
  }

  // Add user details to each booking
  const appointmentsWithUserDetails = data.map(appointment => {
    const bookingsWithUsers = appointment.appointment_bookings.map((booking: Partial<AppointmentBooking>) => {
      const userData = userMap.get(booking.user_id);
      return {
        id: booking.id,
        user_id: booking.user_id,
        status: booking.status,
        user_name: userData?.name,
        user_email: userData?.email
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
  try {
    const { data, error } = await supabase
      .from('appointment_bookings')
      .select('*, appointments(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Check if the error is because the appointment_bookings table doesn't exist
      if (error.code === '42P01') {
        console.warn('Appointment bookings table does not exist yet.');
        return []; // Return empty array instead of throwing an error
      }
      throw error;
    }
    return data as (AppointmentBooking & { appointments: Appointment })[];
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    return []; // Return empty array on error to avoid breaking the UI
  }
}

export async function bookAppointment(appointmentId: string, userId: string) {
  try {
    // Start a Supabase transaction
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('current_participants, max_participants')
      .eq('id', appointmentId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check if the appointment is full
    if (appointment.current_participants >= appointment.max_participants) {
      throw new Error('This appointment is already full');
    }

    // Create the booking
    const { data: bookingData, error } = await supabase
      .from('appointment_bookings')
      .insert({
        appointment_id: appointmentId,
        user_id: userId,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) {
      // Check if the error is because the appointment_bookings table doesn't exist
      if (error.code === '42P01') {
        throw new Error('The booking system is currently unavailable. Please contact the administrator.');
      }
      throw error;
    }
    
    // Increment the current_participants count
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        current_participants: appointment.current_participants + 1
      })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    return bookingData as AppointmentBooking;
  } catch (error) {
    console.error('Error in bookAppointment:', error);
    throw error;
  }
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
      // Check if the error is because the appointment_bookings table doesn't exist
      if (fetchError.code === '42P01') {
        throw new Error('The booking system is currently unavailable. Please contact the administrator.');
      }
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

    // Get the current appointment data
    const { data: appointmentData, error: fetchAppointmentError } = await supabase
      .from('appointments')
      .select('current_participants, max_participants')
      .eq('id', booking.appointment_id)
      .single();
    
    if (fetchAppointmentError) {
      throw new Error(`Failed to fetch appointment: ${fetchAppointmentError.message}`);
    }
    
    if (!appointmentData) {
      throw new Error('Appointment not found');
    }
    
    // Calculate new values
    const newParticipants = Math.max(0, appointmentData.current_participants - 1);
    
    // Update the appointment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        current_participants: newParticipants,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.appointment_id);
    
    if (updateError) {
      throw new Error(`Failed to update appointment: ${updateError.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    throw error;
  }
}

export async function deleteAppointment(appointmentId: string) {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteAppointment:', error);
    throw error;
  }
}
