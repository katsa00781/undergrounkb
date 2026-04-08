import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Dumbbell, BarChart2, Trash2, Edit2, Filter, Copy } from 'lucide-react';
import { getWorkouts, deleteWorkout, Workout } from '../lib/workouts';
import { getExercises, Exercise } from '../lib/exercises';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { formatWorkoutDate, formatWorkoutDuration } from '../lib/workoutDisplay';

const WorkoutLog = () => {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<{ [key: string]: Exercise }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: string; workoutTitle: string }>({ 
    show: false, 
    workoutId: '', 
    workoutTitle: '' 
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [workoutsData, exercisesData] = await Promise.all([
        getWorkouts(user.id),
        getExercises()
      ]);

      // Create a map of exercises for quick lookup
      const exercisesMap = exercisesData.reduce((acc, exercise) => {
        acc[exercise.id] = exercise;
        return acc;
      }, {} as { [key: string]: Exercise });

      setWorkouts(workoutsData);
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
      setWorkouts(workouts.filter(workout => workout.id !== id));
      setDeleteConfirmation({ show: false, workoutId: '', workoutTitle: '' });
      toast.success('Edzés sikeresen törölve');
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast.error('Nem sikerült törölni az edzést');
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    // Navigate to workout planner with prefilled data
    navigate('/workout-planner', { state: { editWorkout: workout } });
  };

  const handleCopyWorkout = (workout: Workout) => {
    navigate('/workout-planner', { state: { copyWorkout: workout } });
  };

  const showDeleteConfirmation = (workout: Workout) => {
    setDeleteConfirmation({
      show: true,
      workoutId: workout.id,
      workoutTitle: workout.title
    });
  };

  const filteredWorkouts = dateFilter
    ? workouts.filter(workout => workout.date === dateFilter)
    : workouts;

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
                      <h3 className="font-semibold text-gray-900 dark:text-white">{workout.title}</h3>
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