import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import {
  Appointment,
  AppointmentBooking,
  getAvailableAppointments,
  getUserBookings,
  bookAppointment,
  cancelBooking
} from '../lib/appointments';
import toast from 'react-hot-toast';

const AppointmentBookingPage = () => {
  const { user } = useAuth();
  const [availableAppointments, setAvailableAppointments] = useState<Appointment[]>([]);
  const [userBookings, setUserBookings] = useState<(AppointmentBooking & { appointments: Appointment })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [appointments, bookings] = await Promise.all([
        getAvailableAppointments(),
        getUserBookings(user!.id),
      ]);
      setAvailableAppointments(appointments);
      setUserBookings(bookings);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBook = async (appointmentId: string) => {
    try {
      await bookAppointment(appointmentId, user!.id);
      await loadData();
      toast.success('Appointment booked successfully');
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast.error('Failed to book appointment');
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      await loadData();
      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const filteredAppointments = selectedDate
    ? availableAppointments.filter(
        appointment => appointment.start_time.startsWith(selectedDate)
      )
    : availableAppointments;

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book an Appointment</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">View and book available time slots</p>
      </div>

      <div className="flex gap-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input"
          min={new Date().toISOString().split('T')[0]}
        />
        {selectedDate && (
          <button
            onClick={() => setSelectedDate('')}
            className="btn btn-outline"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available Appointments */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Time Slots</h2>
          
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{appointment.title}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {format(parseISO(appointment.start_time), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {format(parseISO(appointment.start_time), 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={16} />
                          {appointment.current_participants} / {appointment.max_participants}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBook(appointment.id)}
                      className="btn btn-primary"
                    >
                      Book Now
                    </button>
                  </div>

                  {appointment.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {appointment.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-12 dark:border-gray-700 dark:bg-gray-800">
              <Calendar className="h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No available appointments</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedDate ? 'Try selecting a different date' : 'Check back later for new openings'}
              </p>
            </div>
          )}
        </div>

        {/* User's Bookings */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Bookings</h2>
          
          {userBookings.length > 0 ? (
            <div className="space-y-4">
              {userBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{booking.appointments.title}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {format(parseISO(booking.appointments.start_time), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {format(parseISO(booking.appointments.start_time), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                          : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                      }`}>
                        {booking.status === 'confirmed' ? (
                          <>
                            <Check size={14} />
                            <span>Confirmed</span>
                          </>
                        ) : (
                          <>
                            <X size={14} />
                            <span>Cancelled</span>
                          </>
                        )}
                      </span>
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="btn btn-outline text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-error-900/30 dark:hover:text-error-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {booking.appointments.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {booking.appointments.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-12 dark:border-gray-700 dark:bg-gray-800">
              <Calendar className="h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No bookings yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Book an available time slot to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingPage;