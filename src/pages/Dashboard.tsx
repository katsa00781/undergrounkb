import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BarChart2, TrendingUp, Activity, Dumbbell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getWeightMeasurements, WeightMeasurement } from '../lib/weights';
import { getLatestFMSAssessment, FMSAssessment } from '../lib/fms';
import { getUserBookings, AppointmentBooking, Appointment } from '../lib/appointments';
import { format, subDays, parseISO, isFuture } from 'date-fns';
import { hu } from 'date-fns/locale';
import ConnectionTest from '../components/ui/ConnectionTest';
import { connectionManager } from '../config/supabase';

const Dashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [weights, setWeights] = useState<WeightMeasurement[]>([]);
  const [latestFMS, setLatestFMS] = useState<FMSAssessment | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<(AppointmentBooking & { appointments: Appointment })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Jó reggelt';
      if (hour < 18) return 'Jó napot';
      return 'Jó estét';
    };
    
    setGreeting(getGreeting());
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [weightsData, fmsData, bookingsData] = await Promise.all([
        getWeightMeasurements(user.id),
        getLatestFMSAssessment(user.id),
        getUserBookings(user.id)
      ]);
      
      console.log('Weights data loaded:', weightsData); // Debug log
      console.log('FMS data loaded:', fmsData); // Debug log
      console.log('User ID:', user.id); // Debug log
      setWeights(weightsData);
      setLatestFMS(fmsData);
      
      // Csak a jövőbeli foglalásokat jelenítjük meg
      const upcoming = bookingsData
        .filter(booking => 
          !booking.appointments.is_cancelled && 
          isFuture(parseISO(booking.appointments.start_time))
        )
        .sort((a, b) => 
          new Date(a.appointments.start_time).getTime() - new Date(b.appointments.start_time).getTime()
        );
      
      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
    
    // Check connection status
    const checkConnection = async () => {
      await connectionManager.checkConnection();
    };
    
    checkConnection();
  }, [user, loadDashboardData]);

  // Calculate weight progress
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const monthAgoWeight = weights.find(w => 
    w.date && new Date(w.date) <= subDays(new Date(), 30)
  )?.weight;
  
  const weightChange = latestWeight && monthAgoWeight 
    ? latestWeight - monthAgoWeight 
    : null;

  console.log('Dashboard weight data:', { latestWeight, monthAgoWeight, weightChange, weights }); // Debug log

  const getFMSColor = (score: number) => {
    if (score >= 3) return 'text-success-600 dark:text-success-400';
    if (score >= 2) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  };

  const getFMSScoreClass = (score: number) => {
    if (score >= 3) return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
    if (score >= 2) return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
    return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="animate-fade-in text-3xl font-bold text-gray-900 dark:text-white">
            {greeting}, {user?.email || 'Felhasználó'}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Üdvözöljük az edzésnaplóban</p>
        </div>
      </div>
      
      {/* Adatbázis kapcsolat teszt */}
      <ConnectionTest />

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center">
            <div className="rounded-full bg-accent-100 p-3 dark:bg-accent-900">
              <TrendingUp className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Jelenlegi súly</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {latestWeight ? `${latestWeight} kg` : '—'}
              </p>
              {!latestWeight && (
                <Link 
                  to="/progress" 
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Súly hozzáadása →
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="rounded-full bg-success-100 p-3 dark:bg-success-900">
              <Activity className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">30 napos változás</p>
              <p className={`text-2xl font-semibold ${
                weightChange 
                  ? weightChange < 0 
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-error-600 dark:text-error-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '—'}
              </p>
            </div>
          </div>
        </div>

        {latestFMS && (
          <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center">
              <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900">
                <Activity className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Legutóbbi FMS</p>
                <p className={`text-2xl font-semibold ${getFMSColor(latestFMS.total_score || 0)}`}>
                  {latestFMS.total_score || 0}/21
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(latestFMS.created_at || new Date()), 'yyyy.MM.dd')}
                </p>
              </div>
            </div>
          </div>
        )}

        {!latestFMS && !isLoading && (
          <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center">
              <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-700">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">FMS Értékelés</p>
                <p className="text-lg text-gray-400">Nincs adat</p>
                <Link
                  to="/fms-assessment"
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Új értékelés készítése →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FMS Details */}
      {latestFMS && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            FMS Eredmények
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mély guggolás</span>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${getFMSScoreClass(latestFMS.deep_squat)}`}>
                  {latestFMS.deep_squat}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all ${
                    latestFMS.deep_squat >= 3 ? 'bg-success-500' : 
                    latestFMS.deep_squat >= 2 ? 'bg-warning-500' : 
                    'bg-error-500'
                  }`}
                  style={{ width: `${(latestFMS.deep_squat / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gátlépés</span>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${getFMSScoreClass(latestFMS.hurdle_step)}`}>
                  {latestFMS.hurdle_step}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all ${
                    latestFMS.hurdle_step >= 3 ? 'bg-success-500' : 
                    latestFMS.hurdle_step >= 2 ? 'bg-warning-500' : 
                    'bg-error-500'
                  }`}
                  style={{ width: `${(latestFMS.hurdle_step / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Vonalban lépés</span>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${getFMSScoreClass(latestFMS.inline_lunge)}`}>
                  {latestFMS.inline_lunge}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all ${
                    latestFMS.inline_lunge >= 3 ? 'bg-success-500' : 
                    latestFMS.inline_lunge >= 2 ? 'bg-warning-500' : 
                    'bg-error-500'
                  }`}
                  style={{ width: `${(latestFMS.inline_lunge / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Váll mobilitás</span>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${getFMSScoreClass(latestFMS.shoulder_mobility)}`}>
                  {latestFMS.shoulder_mobility}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all ${
                    latestFMS.shoulder_mobility >= 3 ? 'bg-success-500' : 
                    latestFMS.shoulder_mobility >= 2 ? 'bg-warning-500' : 
                    'bg-error-500'
                  }`}
                  style={{ width: `${(latestFMS.shoulder_mobility / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Aktív lábemelés</span>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${getFMSScoreClass(latestFMS.active_straight_leg_raise)}`}>
                  {latestFMS.active_straight_leg_raise}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all ${
                    latestFMS.active_straight_leg_raise >= 3 ? 'bg-success-500' : 
                    latestFMS.active_straight_leg_raise >= 2 ? 'bg-warning-500' : 
                    'bg-error-500'
                  }`}
                  style={{ width: `${(latestFMS.active_straight_leg_raise / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Törzsstabilizációs fekvőtámasz</span>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${getFMSScoreClass(latestFMS.trunk_stability_pushup)}`}>
                  {latestFMS.trunk_stability_pushup}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all ${
                    latestFMS.trunk_stability_pushup >= 3 ? 'bg-success-500' : 
                    latestFMS.trunk_stability_pushup >= 2 ? 'bg-warning-500' : 
                    'bg-error-500'
                  }`}
                  style={{ width: `${(latestFMS.trunk_stability_pushup / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rotációs stabilitás</span>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${getFMSScoreClass(latestFMS.rotary_stability)}`}>
                  {latestFMS.rotary_stability}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all ${
                    latestFMS.rotary_stability >= 3 ? 'bg-success-500' : 
                    latestFMS.rotary_stability >= 2 ? 'bg-warning-500' : 
                    'bg-error-500'
                  }`}
                  style={{ width: `${(latestFMS.rotary_stability / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {latestFMS.notes && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
              <p className="text-sm text-gray-600 dark:text-gray-400">{latestFMS.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Közelgő foglalások */}
      {upcomingBookings.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Közelgő foglalásaid
          </h2>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {booking.appointments.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(parseISO(booking.appointments.start_time), 'yyyy. MMMM d. (EEEE)', { locale: hu })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(parseISO(booking.appointments.start_time), 'HH:mm')} - 
                      {format(parseISO(booking.appointments.end_time), 'HH:mm')}
                    </p>
                    {booking.appointments.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {booking.appointments.description}
                      </p>
                    )}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <Dumbbell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <Link
          to="/appointments"
          className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <Calendar className="mb-2 h-8 w-8 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Időpontfoglalás</h3>
        </Link>
        
        <Link
          to="/progress"
          className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <BarChart2 className="mb-2 h-8 w-8 text-secondary-600 dark:text-secondary-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Haladás követése</h3>
        </Link>
        
        <Link
          to="/profile"
          className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <Activity className="mb-2 h-8 w-8 text-accent-600 dark:text-accent-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Profil</h3>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
