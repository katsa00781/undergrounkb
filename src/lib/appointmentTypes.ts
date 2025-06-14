export interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_cancelled: boolean;
}

export interface AppointmentParticipant {
  appointment_id: string;
  user_id: string;
  created_at: string;
}

export interface CreateAppointmentData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  max_participants: number;
}

export interface UpdateAppointmentData {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  max_participants?: number;
}

export type AppointmentWithParticipants = Appointment & {
  participants: AppointmentParticipant[];
}; 