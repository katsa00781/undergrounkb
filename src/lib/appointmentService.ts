import { supabase } from '../config/supabase';
import { toast } from '../components/ui/use-toast';
import {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  AppointmentWithParticipants
} from './appointmentTypes';

// Helper function to show toast messages
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  if (typeof window !== 'undefined') {
    toast({
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type === 'success' ? 'default' : 'destructive',
    });
  } else {
    console.log(message);
  }
};

// Create a new appointment
export async function createAppointment(data: CreateAppointmentData): Promise<Appointment | null> {
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([{
        ...data,
        current_participants: 0,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      showToast('Error creating appointment', 'error');
      return null;
    }

    showToast('Appointment created successfully');
    return appointment;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Get all appointments
export async function getAppointments(): Promise<Appointment[]> {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      showToast('Error fetching appointments', 'error');
      return [];
    }

    return appointments;
  } catch (error) {
    console.error('Error in getAppointments:', error);
    showToast('Unexpected error occurred', 'error');
    return [];
  }
}

// Get appointment by ID with participants
export async function getAppointmentWithParticipants(id: string): Promise<AppointmentWithParticipants | null> {
  try {
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (appointmentError) {
      console.error('Error fetching appointment:', appointmentError);
      showToast('Error fetching appointment', 'error');
      return null;
    }

    const { data: participants, error: participantsError } = await supabase
      .from('appointments_participants')
      .select('*')
      .eq('appointment_id', id);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      showToast('Error fetching participants', 'error');
      return null;
    }

    return {
      ...appointment,
      participants: participants || []
    };
  } catch (error) {
    console.error('Error in getAppointmentWithParticipants:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Update an appointment
export async function updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment | null> {
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      showToast('Error updating appointment', 'error');
      return null;
    }

    showToast('Appointment updated successfully');
    return appointment;
  } catch (error) {
    console.error('Error in updateAppointment:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Join an appointment
export async function joinAppointment(appointmentId: string): Promise<boolean> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      showToast('You must be logged in to join an appointment', 'error');
      return false;
    }

    const { error } = await supabase.rpc('join_appointment', {
      p_appointment_id: appointmentId,
      p_user_id: userId
    });

    if (error) {
      console.error('Error joining appointment:', error);
      showToast(error.message || 'Error joining appointment', 'error');
      return false;
    }

    showToast('Successfully joined the appointment');
    return true;
  } catch (error) {
    console.error('Error in joinAppointment:', error);
    showToast('Unexpected error occurred', 'error');
    return false;
  }
}

// Leave an appointment
export async function leaveAppointment(appointmentId: string): Promise<boolean> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      showToast('You must be logged in to leave an appointment', 'error');
      return false;
    }

    const { error } = await supabase.rpc('leave_appointment', {
      p_appointment_id: appointmentId,
      p_user_id: userId
    });

    if (error) {
      console.error('Error leaving appointment:', error);
      showToast(error.message || 'Error leaving appointment', 'error');
      return false;
    }

    showToast('Successfully left the appointment');
    return true;
  } catch (error) {
    console.error('Error in leaveAppointment:', error);
    showToast('Unexpected error occurred', 'error');
    return false;
  }
}

// Cancel an appointment
export async function cancelAppointment(appointmentId: string): Promise<boolean> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      showToast('You must be logged in to cancel an appointment', 'error');
      return false;
    }

    const { error } = await supabase.rpc('cancel_appointment', {
      p_appointment_id: appointmentId,
      p_user_id: userId
    });

    if (error) {
      console.error('Error cancelling appointment:', error);
      showToast(error.message || 'Error cancelling appointment', 'error');
      return false;
    }

    showToast('Successfully cancelled the appointment');
    return true;
  } catch (error) {
    console.error('Error in cancelAppointment:', error);
    showToast('Unexpected error occurred', 'error');
    return false;
  }
}

// Get user's appointments (either created or participating)
export async function getUserAppointments(): Promise<Appointment[]> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      showToast('You must be logged in to view your appointments', 'error');
      return [];
    }

    // Get appointments created by the user
    const { data: createdAppointments, error: createdError } = await supabase
      .from('appointments')
      .select('*')
      .eq('created_by', userId)
      .order('start_time', { ascending: true });

    if (createdError) {
      console.error('Error fetching created appointments:', createdError);
      showToast('Error fetching your created appointments', 'error');
      return [];
    }

    // Get appointments where the user is a participant
    const { data: participatingAppointments, error: participatingError } = await supabase
      .from('appointments')
      .select(`
        *,
        appointments_participants!inner(user_id)
      `)
      .eq('appointments_participants.user_id', userId)
      .order('start_time', { ascending: true });

    if (participatingError) {
      console.error('Error fetching participating appointments:', participatingError);
      showToast('Error fetching your participating appointments', 'error');
      return [];
    }

    // Combine and deduplicate appointments
    const allAppointments = [...(createdAppointments || []), ...(participatingAppointments || [])];
    const uniqueAppointments = Array.from(
      new Map(allAppointments.map(item => [item.id, item])).values()
    );

    return uniqueAppointments;
  } catch (error) {
    console.error('Error in getUserAppointments:', error);
    showToast('Unexpected error occurred', 'error');
    return [];
  }
} 