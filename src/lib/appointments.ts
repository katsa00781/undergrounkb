import { supabase } from '../config/supabase';
import { notifyDataChanged } from '../utils/dataRefresh';

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

export interface AppointmentParticipant {
  appointment_id: string;
  user_id: string;
  created_at?: string;
  user?: {
    name: string | null;
    email: string;
  };
}

// Backward compatibility type alias
export type AppointmentBooking = AppointmentParticipant & {
  id?: string;
  status?: 'confirmed' | 'cancelled';
  updated_at?: string;
};

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
    
    notifyDataChanged('appointments');
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
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('appointment_bookings')
      .select('appointment_id, user_id, created_at')
      .eq('appointment_id', appointment.id)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.warn(`Error fetching participants for appointment ${appointment.id}:`, bookingsError);
      return { ...appointment, appointment_bookings: [] };
    }

    return { ...appointment, appointment_bookings: bookingsData || [] };
  }));

  // Extract all unique user IDs from the participants
  const userIds = new Set<string>();
  data.forEach(appointment => {
    appointment.appointment_bookings.forEach((participant: Partial<AppointmentParticipant>) => {
      if (participant.user_id) userIds.add(participant.user_id);
    });
  });

  // Ha vannak felhasználói azonosítók, kérjük le a részleteket
  const userMap = new Map();
  
  if (userIds.size > 0) {
    // Fetch all user details in a single query
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(userIds));

    if (usersError) {
      console.error('Error fetching user details:', usersError);
    } else if (usersData) {
      // Create a map of user IDs to user details for quick lookup
      usersData.forEach(user => {
        userMap.set(user.id, { name: user.full_name, email: user.email });
      });
    }
  }

  // Add user details to each participant
  const appointmentsWithUserDetails = data.map(appointment => {
    const participantsWithUsers = appointment.appointment_bookings.map((participant: Partial<AppointmentParticipant>) => {
      const userData = userMap.get(participant.user_id);
      return {
        appointment_id: participant.appointment_id,
        user_id: participant.user_id,
        created_at: participant.created_at,
        user: userData ? { name: userData.name, email: userData.email } : undefined
      };
    });

    return {
      ...appointment,
      appointment_bookings: participantsWithUsers
    };
  });

  return appointmentsWithUserDetails as (Appointment & { appointment_bookings: AppointmentParticipant[] })[];
}

export async function getUserBookings(userId: string) {
  try {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('appointment_bookings')
      .select('id, appointment_id, user_id, status, created_at, updated_at, appointments(*)')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      throw bookingsError;
    }

    return (bookingsData || []) as unknown as (AppointmentParticipant & { appointments: Appointment })[];
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
      .select('*, created_by, start_time')
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

    // Create booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('appointment_bookings')
      .insert({
        appointment_id: appointmentId,
        user_id: userId,
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError) {
      throw bookingError;
    }
    
    // Increment the current_participants count
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        current_participants: appointment.current_participants + 1
      })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    // Import the copyWorkoutToUser function from workouts.ts
    // We need to do this dynamically here to avoid circular imports
    const { copyWorkoutToUser } = await import('./workouts');
    
    // Extract the date part from the appointment start_time (ISO format)
    const appointmentDate = appointment.start_time.split('T')[0];
    const trainerId = appointment.created_by;
    
    if (trainerId) {
      try {
        // Copy the admin's workout to the user
        await copyWorkoutToUser(appointmentDate, trainerId, userId);
      } catch (workoutError) {
        // If copying the workout fails, we still want to consider the booking successful
        // Just log the error and continue
        console.error('Error copying workout to user:', workoutError);
      }
    }

    notifyDataChanged('appointments');
    notifyDataChanged('workouts');
    return bookingData as AppointmentBooking;
  } catch (error) {
    console.error('Error in bookAppointment:', error);
    throw error;
  }
}

export async function cancelBooking(appointmentId: string, userId: string) {
  try {
    // Soft-cancel in appointment_bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('appointment_bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('appointment_id', appointmentId)
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .select()
      .maybeSingle();

    if (bookingsError) {
      throw new Error(`Failed to cancel booking: ${bookingsError.message}`);
    }

    // Get the current appointment data
    const { data: appointmentData, error: fetchAppointmentError } = await supabase
      .from('appointments')
      .select('current_participants, max_participants')
      .eq('id', appointmentId)
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
      .eq('id', appointmentId);
    
    if (updateError) {
      throw new Error(`Failed to update appointment: ${updateError.message}`);
    }

    notifyDataChanged('appointments');
    return bookingsData;
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
    
    notifyDataChanged('appointments');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteAppointment:', error);
    throw error;
  }
}
