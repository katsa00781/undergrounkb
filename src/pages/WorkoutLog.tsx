import { useState, useEffect } from 'react';
import { Calendar, Clock, Dumbbell, BarChart2, Trash2, Edit2, Plus, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getWorkouts, deleteWorkout, Workout } from '../lib/workouts';
import { getExercises, Exercise } from '../lib/exercises';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const WorkoutLog = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<{ [key: string]: Exercise }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
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
      toast.error('Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await deleteWorkout(id);
      setWorkouts(workouts.filter(workout => workout.id !== id));
      setSelectedWorkout(null);
      toast.success('Workout deleted successfully');
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast.error('Failed to delete workout');
    }
  };

  const filteredWorkouts = dateFilter
    ? workouts.filter(workout => workout.date === dateFilter)
    : workouts;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workout Log</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Track and analyze your training progress</p>
        </div>
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
              Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Workout List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="card cursor-pointer transition-all hover:scale-[1.02]"
                onClick={() => setSelectedWorkout(workout)}
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
                          {format(parseISO(workout.date), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {workout.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit
                      }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-error-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkout(workout.id);
                      }}
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
                                {exerciseDetails?.name || 'Unknown Exercise'}
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
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No workouts found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {dateFilter ? 'Try selecting a different date' : 'Start by adding your first workout'}
              </p>
            </div>
          )}
        </div>

        {/* Stats and Analysis */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <BarChart2 size={20} className="text-primary-600 dark:text-primary-400" />
              Weekly Summary
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Workouts</span>
                <span className="font-semibold text-gray-900 dark:text-white">{workouts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {workouts.reduce((sum, workout) => sum + workout.duration, 0)} min
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Dumbbell size={20} className="text-primary-600 dark:text-primary-400" />
              Most Used Exercises
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
                      {exercises[exerciseId]?.name || 'Unknown Exercise'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {count} sets
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLog;