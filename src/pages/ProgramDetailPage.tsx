import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarRange, Edit2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { getProgramWithWorkouts, WorkoutProgram } from '../lib/programService';
import { Workout } from '../lib/workouts';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
import { formatWorkoutDate } from '../lib/workoutDisplay';

const MODE_LABELS: Record<string, string> = {
  periodized: 'Ciklus alapú',
  pwron: 'Pwron',
  longevity: 'Longevity',
};

const ProgramDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProgram = useCallback(async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const { program: loadedProgram, workouts: loadedWorkouts } = await getProgramWithWorkouts(id, user.id);
      setProgram(loadedProgram);
      setWorkouts(loadedWorkouts);
    } catch (error) {
      console.error('Error loading program:', error);
      toast.error('Nem sikerült betölteni a programot');
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (initialized && !user) {
      setLoading(false);
      return;
    }
    if (user) {
      void loadProgram();
    }
  }, [initialized, user, loadProgram]);

  useAutoRefresh(loadProgram, { enabled: Boolean(user?.id), scopes: ['workouts'] });

  const weekGroups = useMemo(() => {
    const groups = new Map<number, Workout[]>();
    workouts.forEach((workout) => {
      const week = workout.program_week ?? 0;
      if (!groups.has(week)) groups.set(week, []);
      groups.get(week)!.push(workout);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [workouts]);

  const handleOpenSession = (workout: Workout) => {
    navigate('/workout-planner', { state: { editWorkout: workout } });
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/programs')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Vissza a programokhoz
        </button>
        <p className="text-gray-600 dark:text-gray-400">A program nem található.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/programs')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Vissza a programokhoz
      </button>

      <WorkoutSectionHeader
        title={program.name}
        description={`${MODE_LABELS[program.generator_mode] ?? program.generator_mode} • ${program.week_count} hét • ${workouts.length} edzés • kezdés: ${formatWorkoutDate(program.start_date)}`}
        actions={(
          <button
            onClick={() => navigate('/calendar')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Calendar className="h-4 w-4" />
            Naptár megnyitása
          </button>
        )}
      />

      <div className="space-y-6">
        {weekGroups.map(([week, weekWorkouts]) => (
          <div key={week} className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{week}. hét</h2>
            </div>
            <div className="space-y-2">
              {weekWorkouts.map((workout) => {
                const exerciseCount = workout.sections.reduce(
                  (total, section) => total + section.exercises.length,
                  0,
                );
                return (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700/40"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {workout.program_day_label ?? workout.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatWorkoutDate(workout.date)} • {exerciseCount} gyakorlat
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSession(workout)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Megnyitás / szerkesztés
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgramDetailPage;
