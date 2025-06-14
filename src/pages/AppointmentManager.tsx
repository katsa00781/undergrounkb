import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, Users, Plus, Trash2, X } from 'lucide-react';
import { format, parseISO, addHours } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { Appointment, createAppointment, getTrainerAppointments, deleteAppointment } from '../lib/appointments';
import toast from 'react-hot-toast';

const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_time: z.string().min(1, 'Start time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  max_participants: z.number().min(1, 'Must allow at least 1 participant'),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface BookingDetails {
  id: string;
  user_id: string;
  status: 'confirmed' | 'cancelled';
  user_name?: string;
  user_email?: string;
}

interface AppointmentWithBookings extends Appointment {
  appointment_bookings: BookingDetails[];
}

const AppointmentManager = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithBookings[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithBookings | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      duration: 1,
      max_participants: 1,
    },
  });

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await getTrainerAppointments(user!.id);
      setAppointments(data);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      const startTime = new Date(data.start_time);
      const endTime = addHours(startTime, data.duration);

      await createAppointment({
        title: data.title,
        description: data.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        max_participants: data.max_participants,
        trainer_id: user!.id,
      });

      await loadAppointments();
      setShowForm(false);
      reset();
      toast.success('Appointment created successfully');
    } catch (error) {
      console.error('Failed to create appointment:', error);
      toast.error('Failed to create appointment');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
      await loadAppointments();
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Appointment Manager</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Create and manage available time slots</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          {showForm ? (
            <>
              <X size={20} />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus size={20} />
              <span>Add Time Slot</span>
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Add New Time Slot</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="input mt-1"
                  placeholder="e.g., Personal Training Session"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  {...register('start_time')}
                  className="input mt-1"
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.start_time && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.start_time.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  {...register('duration', { valueAsNumber: true })}
                  className="input mt-1"
                  min="1"
                  step="0.5"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.duration.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Participants
                </label>
                <input
                  type="number"
                  {...register('max_participants', { valueAsNumber: true })}
                  className="input mt-1"
                  min="1"
                />
                {errors.max_participants && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.max_participants.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input mt-1"
                  placeholder="Add any additional details about the session..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Time Slot'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedAppointment && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Bookings for {selectedAppointment.title}
            </h2>
            <button
              onClick={() => setSelectedAppointment(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                {format(parseISO(selectedAppointment.start_time), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {format(parseISO(selectedAppointment.start_time), 'h:mm a')}
              </span>
              <span className="flex items-center gap-1">
                <Users size={16} />
                {selectedAppointment.current_participants} / {selectedAppointment.max_participants}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {selectedAppointment.appointment_bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {booking.user_email}
                  </p>
                  {booking.user_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.user_name}
                    </p>
                  )}
                </div>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  booking.status === 'confirmed'
                    ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                    : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}

            {selectedAppointment.appointment_bookings.length === 0 && (
              <p className="text-center text-gray-600 dark:text-gray-400">
                No bookings yet
              </p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="p-6">
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Title</th>
                  <th scope="col" className="px-6 py-3">Date & Time</th>
                  <th scope="col" className="px-6 py-3">Duration</th>
                  <th scope="col" className="px-6 py-3">Participants</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="cursor-pointer border-b border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {appointment.title}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {format(parseISO(appointment.start_time), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {format(parseISO(appointment.end_time), 'h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {appointment.current_participants} / {appointment.max_participants}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        appointment.status === 'available'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                          : appointment.status === 'booked'
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(appointment.id);
                        }}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-error-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {appointments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  No appointments found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManager;