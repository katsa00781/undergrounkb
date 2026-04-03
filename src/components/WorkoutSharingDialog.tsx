import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Share2, 
  User,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { shareWorkoutWithParticipants } from '../lib/workouts';
import { supabase } from '../config/supabase';
import type { FMSAssessment } from '../lib/fms';
import { getExerciseCategoryLabel, getMovementPatternLabel, type Exercise } from '../lib/exerciseService';
import { getExerciseRatingForAssessment, getExerciseRatingMeta } from '../lib/fmsExerciseRatings';

interface WorkoutSectionExercise {
  exerciseId: string;
  sets: number;
  reps: number | string;
}

interface WorkoutSection {
  name: string;
  exercises: WorkoutSectionExercise[];
}

interface WorkoutSharingDialogProps {
  workoutId: string;
  appointmentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AppointmentParticipant {
  id: string;
  user_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  appointment_bookings: AppointmentParticipant[];
}

interface WorkoutPreviewExercise extends Exercise {
  sectionName: string;
  prescribedSets: number;
  prescribedReps: number | string;
}

const WorkoutSharingDialog: React.FC<WorkoutSharingDialogProps> = ({
  workoutId,
  appointmentId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string>(appointmentId || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantAssessments, setParticipantAssessments] = useState<Record<string, FMSAssessment | null>>({});
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutPreviewExercise[]>([]);
  const selectedAppointmentData = appointments.find(a => a.id === selectedAppointment);

  useEffect(() => {
    if (isOpen) {
      loadAppointments();
      loadWorkoutExercises();
      if (appointmentId) {
        setSelectedAppointment(appointmentId);
      }
    }
  }, [isOpen, appointmentId]);

  useEffect(() => {
    if (selectedAppointment) {
      loadParticipants(selectedAppointment);
    } else {
      setSelectedParticipants([]);
    }
  }, [selectedAppointment]);

  useEffect(() => {
    if (!isOpen) {
      setParticipantAssessments({});
      setWorkoutExercises([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedParticipants.length > 0) {
      loadParticipantAssessments(selectedParticipants);
    } else {
      setParticipantAssessments({});
    }
  }, [selectedParticipants]);

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          date,
          time,
          appointment_bookings!inner (
            id,
            user_id,
            profiles!inner (
              id,
              full_name,
              email
            )
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAppointments((data as any) || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Nem sikerült betölteni az időpontokat');
    }
  };

  const loadParticipants = async (appointmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointment_bookings')
        .select(`
          id,
          user_id,
          profiles!inner (
            id,
            full_name,
            email
          )
        `)
        .eq('appointment_id', appointmentId);

      if (error) throw error;

      // Auto-select all participants
      setSelectedParticipants((data || []).map(p => p.user_id));
    } catch (error) {
      console.error('Error loading participants:', error);
      setError('Nem sikerült betölteni a résztvevőket');
    }
  };

  const loadParticipantAssessments = async (userIds: string[]) => {
    if (userIds.length === 0) {
      setParticipantAssessments({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fms_assessments')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const latestByUser: Record<string, FMSAssessment | null> = {};
      userIds.forEach(userId => {
        latestByUser[userId] = null;
      });

      (data || []).forEach((assessment) => {
        if (!latestByUser[assessment.user_id]) {
          latestByUser[assessment.user_id] = assessment as FMSAssessment;
        }
      });

      setParticipantAssessments(latestByUser);
    } catch (error) {
      console.error('Error loading participant FMS assessments:', error);
      setError('Nem sikerült betölteni a résztvevők FMS eredményeit');
    }
  };

  const loadWorkoutExercises = async () => {
    try {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('sections')
        .eq('id', workoutId)
        .single();

      if (workoutError) {
        throw workoutError;
      }

      const parsedSections = (typeof workout.sections === 'string' ? JSON.parse(workout.sections) : workout.sections) as WorkoutSection[];
      const exerciseIds = Array.from(new Set(parsedSections.flatMap(section => section.exercises.map(exercise => exercise.exerciseId)).filter(Boolean)));

      if (exerciseIds.length === 0) {
        setWorkoutExercises([]);
        return;
      }

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .in('id', exerciseIds);

      if (exercisesError) {
        throw exercisesError;
      }

      const exerciseMap = new Map((exercisesData || []).map(exercise => [exercise.id, exercise as Exercise]));
      const resolvedExercises = parsedSections.flatMap(section =>
        section.exercises
          .map(exercise => {
            const details = exerciseMap.get(exercise.exerciseId);
            if (!details) {
              return null;
            }

            return {
              ...details,
              sectionName: section.name,
              prescribedSets: exercise.sets,
              prescribedReps: exercise.reps,
            };
          })
          .filter((exercise): exercise is WorkoutPreviewExercise => Boolean(exercise))
      );

      setWorkoutExercises(resolvedExercises);
    } catch (error) {
      console.error('Error loading workout exercises:', error);
      setError('Nem sikerült betölteni az edzés gyakorlatait');
    }
  };

  const handleShare = async () => {
    if (!selectedAppointment || selectedParticipants.length === 0) {
      setError('Válassz időpontot és résztvevőket');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await shareWorkoutWithParticipants(workoutId, selectedAppointment, selectedParticipants);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error sharing workout:', error);
      setError('Nem sikerült megosztani az edzést');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectedParticipantBookings = selectedAppointmentData?.appointment_bookings.filter(booking => selectedParticipants.includes(booking.user_id)) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edzés megosztása
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Appointment selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Válassz időpontot
            </label>
            <select
              value={selectedAppointment}
              onChange={(e) => setSelectedAppointment(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            >
              <option value="">Válassz időpontot...</option>
              {appointments.map(appointment => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.title} - {new Date(appointment.date).toLocaleDateString('hu-HU')} {appointment.time}
                </option>
              ))}
            </select>
          </div>

          {/* Participants selection */}
          {selectedAppointmentData && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Résztvevők ({selectedParticipants.length}/{selectedAppointmentData.appointment_bookings.length})
              </label>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Csak a kijelölt, ehhez az időponthoz tartozó vendégek kapják meg a személyes edzéstervet. Az FMS jelzés az ő legfrissebb felmérésük alapján jelenik meg.
              </p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedAppointmentData.appointment_bookings.map(booking => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => toggleParticipant(booking.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {booking.profiles.full_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.profiles.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedParticipants.includes(booking.user_id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedParticipants.includes(booking.user_id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedAppointmentData.appointment_bookings.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Nincs résztvevő ehhez az időponthoz
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedAppointment && selectedParticipants.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Megosztás összefoglalója
                </span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300">
                Az edzés meg lesz osztva {selectedParticipants.length} résztvevővel az "{selectedAppointmentData?.title}" időpontból.
              </div>
            </div>
          )}

          {selectedParticipantBookings.length > 0 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">FMS minősítési kulcs</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {(['red', 'yellow', 'green', 'unknown'] as const).map(status => {
                    const meta = getExerciseRatingMeta(status);
                    return (
                      <span key={status} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${meta.className}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClassName}`}></span>
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {selectedParticipantBookings.map(booking => {
                const assessment = participantAssessments[booking.user_id] || null;

                return (
                  <div key={booking.user_id} className="rounded-lg border border-gray-200 p-4 shadow-sm dark:border-gray-700">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{booking.profiles.full_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{booking.profiles.email}</p>
                      </div>
                      {assessment ? (
                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-7">
                          {[
                            ['Mély guggolás', assessment.deep_squat],
                            ['Akadálylépés', assessment.hurdle_step],
                            ['Inline kitörés', assessment.inline_lunge],
                            ['Vállmobilitás', assessment.shoulder_mobility],
                            ['Aktív lábemelés', assessment.active_straight_leg_raise],
                            ['Törzsstabil push-up', assessment.trunk_stability_pushup],
                            ['Rotációs stabilitás', assessment.rotary_stability],
                          ].map(([label, score]) => {
                            const status = Number(score) <= 1 ? 'red' : Number(score) === 2 ? 'yellow' : 'green';
                            const meta = getExerciseRatingMeta(status);
                            return (
                              <div key={label} className={`rounded-md px-2 py-2 ${meta.className}`}>
                                <div className="font-medium">{label}</div>
                                <div className="mt-1">{score}/3</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Nincs elérhető FMS felmérés
                        </div>
                      )}
                    </div>

                    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Gyakorlat</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Mozgásminta</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Minősítés</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Indoklás</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900/20">
                          {workoutExercises.map(exercise => {
                            const rating = getExerciseRatingForAssessment(exercise, assessment);
                            const meta = getExerciseRatingMeta(rating.status);

                            return (
                              <tr key={`${booking.user_id}-${exercise.sectionName}-${exercise.id}`}>
                                <td className="px-3 py-3 align-top text-sm text-gray-900 dark:text-white">
                                  <div className="font-medium">{exercise.name}</div>
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{exercise.sectionName} • {exercise.prescribedSets} × {exercise.prescribedReps}</div>
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{getExerciseCategoryLabel(exercise.category)}</div>
                                </td>
                                <td className="px-3 py-3 align-top text-sm text-gray-700 dark:text-gray-300">
                                  {getMovementPatternLabel(exercise.movement_pattern)}
                                </td>
                                <td className="px-3 py-3 align-top">
                                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${meta.className}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClassName}`}></span>
                                    {rating.label}
                                  </span>
                                </td>
                                <td className="px-3 py-3 align-top text-xs text-gray-600 dark:text-gray-400">
                                  {rating.reasons.length > 0 ? rating.reasons.join(' • ') : 'Nincs külön korlátozás'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Mégse
            </button>
            <button
              onClick={handleShare}
              disabled={loading || !selectedAppointment || selectedParticipants.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Megosztás...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Megosztás
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSharingDialog;
