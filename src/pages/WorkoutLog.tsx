import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Dumbbell, BarChart2, Trash2, Edit2, Filter, Copy, Heart, Flame, Activity, CheckCircle2, Eye, ArrowLeft, TrendingUp, Zap } from 'lucide-react';
import { getWorkoutsWithLogs, deleteWorkout, WorkoutWithLog, computeLogDuration, computeTotalVolume } from '../lib/workouts';
import { getExercises, Exercise } from '../lib/exercises';
import { getCardioSessions, type CardioSession } from '../lib/polarService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { formatWorkoutDate, formatWorkoutDuration } from '../lib/workoutDisplay';

const WorkoutLog = () => {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutWithLog[]>([]);
  const [cardioSessions, setCardioSessions] = useState<CardioSession[]>([]);
  const [exercises, setExercises] = useState<{ [key: string]: Exercise }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: string; workoutTitle: string }>({
    show: false,
    workoutId: '',
    workoutTitle: ''
  });
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithLog | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [workoutsData, exercisesData, cardioData] = await Promise.all([
        getWorkoutsWithLogs(user.id),
        getExercises(),
        getCardioSessions()
      ]);

      // Create a map of exercises for quick lookup
      const exercisesMap = exercisesData.reduce((acc, exercise) => {
        acc[exercise.id] = exercise;
        return acc;
      }, {} as { [key: string]: Exercise });

      setWorkouts(workoutsData);
      setCardioSessions(cardioData);
      setExercises(exercisesMap);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Nem sikerült betölteni az edzéseket');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (initialized && !user) {
      setIsLoading(false);
      return;
    }

    if (user?.id) {
      void loadData();
    }
  }, [initialized, user?.id, loadData, user]);

  useAutoRefresh(loadData, {
    enabled: Boolean(user?.id),
    scopes: ['workouts'],
  });

  const handleDeleteWorkout = async (id: string) => {
    try {
      await deleteWorkout(id);
      setWorkouts(prev => prev.filter(workout => workout.id !== id));
      setDeleteConfirmation({ show: false, workoutId: '', workoutTitle: '' });
      toast.success('Edzés sikeresen törölve');
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast.error('Nem sikerült törölni az edzést');
    }
  };

  const handleViewWorkout = (workout: WorkoutWithLog) => {
    setSelectedWorkout(workout);
  };

  const handleEditWorkout = (workout: WorkoutWithLog) => {
    navigate('/workout-planner', { state: { editWorkout: workout } });
  };

  const handleCopyWorkout = (workout: WorkoutWithLog) => {
    navigate('/workout-planner', { state: { copyWorkout: workout } });
  };

  const showDeleteConfirmation = (workout: WorkoutWithLog) => {
    setDeleteConfirmation({
      show: true,
      workoutId: workout.id,
      workoutTitle: workout.title
    });
  };

  const filteredWorkouts = dateFilter
    ? workouts.filter(workout => workout.date === dateFilter)
    : workouts;

  const filteredCardio = dateFilter
    ? cardioSessions.filter(session => session.start_time?.slice(0, 10) === dateFilter)
    : cardioSessions;

  const formatCardioDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h} ó ${m} p` : `${m} p`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Edzések betöltése...</p>
        </div>
      </div>
    );
  }

  if (selectedWorkout) {
    const log = selectedWorkout.latestLog;
    const logDur = log ? computeLogDuration(log) : null;
    const logSections = log?.sections ?? [];
    const completedExs = logSections.flatMap(s => s.exercises).filter(e => e.completed);
    const volume = logSections.length > 0 ? computeTotalVolume(logSections) : 0;
    const relatedPolar = cardioSessions.filter(
      s => s.start_time?.slice(0, 10) === selectedWorkout.date
    );

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedWorkout(null)}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={16} />
          Vissza az edzésnaplóhoz
        </button>

        {/* Fejléc */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedWorkout.title}</h2>
                {selectedWorkout.isCompleted && log && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
                    <CheckCircle2 size={12} />
                    Teljesítve {formatWorkoutDate(log.date)}
                    {logDur !== null && ` · ${logDur} p`}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Tervezett: {formatWorkoutDate(selectedWorkout.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatWorkoutDuration(selectedWorkout.duration)}
                </span>
                {volume > 0 && (
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    {volume.toLocaleString('hu-HU')} kg összes tömeg
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleEditWorkout(selectedWorkout)}
                className="btn btn-outline text-sm"
              >
                <Edit2 size={14} />
                Szerkesztés
              </button>
              <button
                onClick={() => handleCopyWorkout(selectedWorkout)}
                className="btn btn-outline text-sm"
              >
                <Copy size={14} />
                Másolás
              </button>
            </div>
          </div>
          {selectedWorkout.notes && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic border-t border-gray-100 dark:border-gray-700 pt-3">
              {selectedWorkout.notes}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bal oldal: tervezett edzés + napló */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tervezett edzésterv */}
            <div className="card">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                <Dumbbell size={18} className="text-primary-600 dark:text-primary-400" />
                Tervezett edzésterv
              </h3>
              {selectedWorkout.sections.map((section, si) => (
                <div key={si} className="mb-4 last:mb-0">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                    {section.name}
                  </h4>
                  <div className="space-y-1">
                    {section.exercises.map((ex, ei) => {
                      const exDetails = exercises[ex.exerciseId];
                      return (
                        <div key={ei} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {exDetails?.name || 'Ismeretlen gyakorlat'}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {ex.sets} × {ex.reps}{ex.weight ? ` @ ${ex.weight} kg` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Teljesítési napló (ha van) */}
            {log && (
              <div className="card border-success-200 dark:border-success-700">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                  <CheckCircle2 size={18} className="text-success-600 dark:text-success-400" />
                  Teljesítési napló
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                    (mobilon rögzítve)
                  </span>
                </h3>
                {log.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">{log.notes}</p>
                )}
                {completedExs.length > 0 ? (
                  <div className="space-y-1">
                    {completedExs.map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-success-50 dark:bg-success-900/20 text-sm"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {ex.name ?? 'Gyakorlat'}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {ex.actualSets != null && ex.actualReps != null
                            ? `${ex.actualSets}×${ex.actualReps}${ex.actualWeight ? ` @ ${ex.actualWeight} kg` : ''}`
                            : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    A mobilos napló nem tartalmaz részletes gyakorlatadatokat.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Jobb oldal: Polar adatok */}
          <div className="space-y-4">
            {relatedPolar.length > 0 ? (
              <div className="card">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                  <Activity size={18} className="text-primary-600 dark:text-primary-400" />
                  Polar edzésadatok
                  <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
                    {formatWorkoutDate(selectedWorkout.date)}
                  </span>
                </h3>
                <div className="space-y-3">
                  {relatedPolar.map((session) => (
                    <div key={session.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {session.sport || 'Edzés'}
                        </span>
                        {session.start_time && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(session.start_time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {session.duration_seconds != null && (
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {formatCardioDuration(session.duration_seconds)}
                          </span>
                        )}
                        {session.calories != null && (
                          <span className="flex items-center gap-1">
                            <Flame size={13} />
                            {session.calories} kcal
                          </span>
                        )}
                        {session.hr_avg != null && (
                          <span className="flex items-center gap-1">
                            <Heart size={13} />
                            Átlag {session.hr_avg} bpm
                          </span>
                        )}
                        {session.hr_max != null && (
                          <span className="flex items-center gap-1">
                            <Heart size={13} className="text-error-400" />
                            Max {session.hr_max} bpm
                          </span>
                        )}
                        {session.training_load != null && (
                          <span className="col-span-2 flex items-center gap-1">
                            <Zap size={13} />
                            Edzésterhelés: {Math.round(Number(session.training_load))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-3">
                  <Activity size={18} className="text-gray-400" />
                  Polar edzésadatok
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nincs szinkronizált Polar edzés erre a napra ({formatWorkoutDate(selectedWorkout.date)}).
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  A Polar szinkronizálást a Profiloldalon találod.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkoutSectionHeader
        title="Edzésnapló"
        description="A mentett edzéseidet részletes listában látod, szűrheted dátum szerint, és innen is továbbmehetsz szerkesztésre vagy új napra másolásra."
        actions={(
          <div className="flex gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="btn btn-outline"
            >
              Szűrő törlése
            </button>
          )}
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Workout List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="card transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900">
                      <Dumbbell className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{workout.title}</h3>
                        {workout.isCompleted && workout.latestLog && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
                            <CheckCircle2 size={11} />
                            Teljesítve {formatWorkoutDate(workout.latestLog.date)}
                            {computeLogDuration(workout.latestLog) !== null && ` · ${computeLogDuration(workout.latestLog)} p`}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {formatWorkoutDate(workout.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {formatWorkoutDuration(workout.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full p-2 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-500 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewWorkout(workout);
                      }}
                      title="Edzés megnyitása"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditWorkout(workout);
                      }}
                      title="Edzésterv szerkesztése"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyWorkout(workout);
                      }}
                      title="Edzésterv másolása új napra"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-error-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(workout);
                      }}
                      title="Edzésterv törlése"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                  {workout.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-4 last:mb-0">
                      <h4 className="mb-2 font-medium text-gray-900 dark:text-white">{section.name}</h4>
                      <div className="space-y-2">
                        {section.exercises.map((exercise, exerciseIndex) => {
                          const exerciseDetails = exercises[exercise.exerciseId];
                          return (
                            <div key={exerciseIndex} className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {exerciseDetails?.name || 'Ismeretlen gyakorlat'}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {exercise.sets} × {exercise.reps} {exercise.weight && `@ ${exercise.weight}kg`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {workout.notes && (
                  <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{workout.notes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-12 dark:border-gray-700 dark:bg-gray-800">
              <Filter className="h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nem található edzés</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {dateFilter ? 'Próbálj másik dátumot választani' : 'Kezdd az első edzésed hozzáadásával'}
              </p>
            </div>
          )}
        </div>

        {/* Stats and Analysis */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <BarChart2 size={20} className="text-primary-600 dark:text-primary-400" />
              Heti összegzés
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Edzések</span>
                <span className="font-semibold text-gray-900 dark:text-white">{workouts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Összes idő</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatWorkoutDuration(workouts.reduce((sum, workout) => sum + workout.duration, 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Dumbbell size={20} className="text-primary-600 dark:text-primary-400" />
              Leggyakrabban használt gyakorlatok
            </h3>
            <div className="mt-4 space-y-2">
              {Object.entries(
                workouts.flatMap(w => w.sections.flatMap(s => s.exercises))
                  .reduce((acc, exercise) => {
                    acc[exercise.exerciseId] = (acc[exercise.exerciseId] || 0) + 1;
                    return acc;
                  }, {} as { [key: string]: number })
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([exerciseId, count]) => (
                  <div key={exerciseId} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {exercises[exerciseId]?.name || 'Ismeretlen gyakorlat'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {count} alkalom
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {cardioSessions.length > 0 && (
            <div className="card">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Activity size={20} className="text-primary-600 dark:text-primary-400" />
                Polar edzések
              </h3>
              <div className="mt-4 space-y-3">
                {filteredCardio.length > 0 ? (
                  filteredCardio.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {session.sport || 'Edzés'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {session.start_time
                            ? formatWorkoutDate(session.start_time.slice(0, 10))
                            : ''}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatCardioDuration(session.duration_seconds)}
                        </span>
                        {session.calories != null && (
                          <span className="flex items-center gap-1">
                            <Flame size={14} />
                            {session.calories} kcal
                          </span>
                        )}
                        {session.hr_avg != null && (
                          <span className="flex items-center gap-1">
                            <Heart size={14} />
                            {session.hr_avg}
                            {session.hr_max != null && ` / ${session.hr_max}`} bpm
                          </span>
                        )}
                        {session.training_load != null && (
                          <span className="flex items-center gap-1">
                            <BarChart2 size={14} />
                            Terhelés: {Math.round(Number(session.training_load))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nincs Polar edzés a kiválasztott napon.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edzésterv törlése
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Biztosan törölni szeretnéd a(z) <strong>"{deleteConfirmation.workoutTitle}"</strong> edzéstervet? Ez a művelet nem vonható vissza.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setDeleteConfirmation({ show: false, workoutId: '', workoutTitle: '' })}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Mégse
              </button>
              <button
                onClick={() => handleDeleteWorkout(deleteConfirmation.workoutId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Törlés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLog;