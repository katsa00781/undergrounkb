import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, Check, X, Dumbbell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [availableAppointments, setAvailableAppointments] = useState<Appointment[]>([]);
  const [userBookings, setUserBookings] = useState<(AppointmentBooking & { appointments: Appointment })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [accessError, setAccessError] = useState<string | null>(null);
  const [bookingEnabled, setBookingEnabled] = useState(true); // Enable booking by default

  // Define loadData using useCallback
  const loadData = useCallback(async () => {
    if (!user) return;

    try {

      setIsLoading(true);

      const availableApptsPromise = getAvailableAppointments();

      const userBookingsPromise = getUserBookings(user.id);

      const [appointments, bookings] = await Promise.all([
        availableApptsPromise,
        userBookingsPromise,
      ]);

      setAvailableAppointments(appointments);
      setUserBookings(bookings);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      console.error('Error details:', JSON.stringify(error));
      toast.error('Időpontok betöltése sikertelen');
      setAccessError('Failed to load appointments data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {

    const checkAccess = async () => {
      try {
        if (!user) {

          setAccessError('Authentication required');
          navigate('/login', { state: { from: location } });
          return false;
        }

        // Check if the appointments_participants table exists 
        const { error } = await supabase
          .from('appointments_participants')
          .select('count')
          .limit(1);

        if (error) {
          console.error('Error accessing appointments_participants table:', error);
          if (error.code === '42P01') {
            // Table doesn't exist, but we can still show available appointments
            setBookingEnabled(false);
            setAccessError('Booking is temporarily disabled. You can view available appointments but cannot book them yet.');
            // Return true to continue loading the page with disabled booking
            return true;
          }
        }

        // Allow access for authenticated users
        return true;
      } catch (err) {
        console.error('Access check error:', err);
        setAccessError('Error checking access');
        return false;
      }
    };

    checkAccess().then(hasAccess => {
      if (hasAccess && user) {
        loadData();
      }
    });
  }, [user, navigate, location, loadData]);

  const handleBook = async (appointmentId: string) => {
    if (!bookingEnabled) {
      toast.error('Foglalás jelenleg nem elérhető');
      return;
    }

    try {
      await bookAppointment(appointmentId, user!.id);
      await loadData();
      toast.success('Időpont sikeresen lefoglalva!');

      // Show notification about assigned workout
      toast((t) => (
        <div className="flex items-start gap-3">
          <Dumbbell className="h-5 w-5 text-primary-500" />
          <div className="flex flex-1 flex-col gap-2">
            <span className="font-semibold">Edzés hozzárendelve!</span>
            <p className="text-sm text-gray-600">Nézd meg az Edzés Naplót, hogy lásd az edzéstervet ehhez az alkalmhoz.</p>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => {
                  navigate('/workout-log');
                  toast.dismiss(t.id);
                }} 
                className="rounded-md bg-primary-600 px-3 py-1 text-xs text-white hover:bg-primary-700"
              >
                Edzés Napló
              </button>
              <button 
                onClick={() => toast.dismiss(t.id)} 
                className="rounded-md px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Bezárás
              </button>
            </div>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
      ), { duration: 8000 });
    } catch (error) {
      console.error('Failed to book appointment:', error);
      if (error instanceof Error && error.message.includes('unavailable')) {
        toast.error(error.message);
      } else {
        toast.error('Időpont foglalása sikertelen');
      }
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      if (!user?.id) {
        toast.error('Felhasználó nincs bejelentkezve');
        return;
      }
      await cancelBooking(appointmentId, user.id);
      await loadData();
      toast.success('Foglalás sikeresen törölve');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Foglalás törlése sikertelen');
    }
  };

  const filteredAppointments = selectedDate
    ? availableAppointments.filter(
        appointment => appointment.start_time.startsWith(selectedDate)
      )
    : availableAppointments;

  // Show loading state
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

  // Show access error if any
  if (accessError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 rounded-full bg-error-100 p-3 text-error-600 dark:bg-error-900/30 dark:text-error-400">
            <X size={24} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Access Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{accessError}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            Return to Dashboard
          </button>
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
                      disabled={!bookingEnabled}
                      title={!bookingEnabled ? "Booking is temporarily unavailable" : ""}
                    >
                      {bookingEnabled ? "Book Now" : "View Only"}
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
                  key={`${booking.appointment_id}-${booking.user_id}`}
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
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">
                        <Check size={14} />
                        <span>Confirmed</span>
                      </span>
                      <button
                        onClick={() => handleCancel(booking.appointment_id)}
                        className="btn btn-outline text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-error-900/30 dark:hover:text-error-300"
                      >
                        Cancel
                      </button>
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
