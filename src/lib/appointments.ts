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
    const { data: participants, error: participantsError } = await supabase
      .from('appointments_participants')
      .select('appointment_id, user_id')
      .eq('appointment_id', appointment.id);
    
    if (participantsError) {
      console.warn(`Error fetching participants for appointment ${appointment.id}:`, participantsError);
      return { ...appointment, appointments_participants: [] };
    }
    
    return { ...appointment, appointments_participants: participants || [] };
  }));

  // if (error) throw error;

  // Extract all unique user IDs from the participants
  const userIds = new Set<string>();
  data.forEach(appointment => {
    appointment.appointments_participants.forEach((participant: Partial<AppointmentParticipant>) => {
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
    const participantsWithUsers = appointment.appointments_participants.map((participant: Partial<AppointmentParticipant>) => {
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
      appointments_participants: participantsWithUsers
    };
  });

  return appointmentsWithUserDetails as (Appointment & { appointments_participants: AppointmentParticipant[] })[];
}

export async function getUserBookings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('appointments_participants')
      .select('*, appointments(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Check if the error is because the appointments_participants table doesn't exist
      if (error.code === '42P01') {
        console.warn('Appointments participants table does not exist yet.');
        return []; // Return empty array instead of throwing an error
      }
      throw error;
    }
    return data as (AppointmentParticipant & { appointments: Appointment })[];
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

    // Create the participant record
    const { data: participantData, error } = await supabase
      .from('appointments_participants')
      .insert({
        appointment_id: appointmentId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // Check if the error is because the appointments_participants table doesn't exist
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

    return participantData as AppointmentBooking;
  } catch (error) {
    console.error('Error in bookAppointment:', error);
    throw error;
  }
}

export async function cancelBooking(appointmentId: string, userId: string) {
  try {
    // Delete the participant record directly
    const { data, error } = await supabase
      .from('appointments_participants')
      .delete()
      .eq('appointment_id', appointmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // Check if the error is because the appointments_participants table doesn't exist
      if (error.code === '42P01') {
        throw new Error('The booking system is currently unavailable. Please contact the administrator.');
      }
      throw new Error(`Failed to cancel booking: ${error.message}`);
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
