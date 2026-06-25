import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Trash2, RefreshCw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { deleteProgram, getPrograms, WorkoutProgram } from '../lib/programService';
import { getWorkouts } from '../lib/workouts';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
import { formatWorkoutDate } from '../lib/workoutDisplay';

const MODE_LABELS: Record<string, string> = {
  periodized: 'Ciklus alapú',
  pwron: 'Pwron',
  longevity: 'Longevity',
};

const ProgramsPage = () => {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadPrograms = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [programList, workouts] = await Promise.all([getPrograms(user.id), getWorkouts(user.id)]);
      const counts: Record<string, number> = {};
      workouts.forEach((workout) => {
        if (workout.program_id) {
          counts[workout.program_id] = (counts[workout.program_id] ?? 0) + 1;
        }
      });
      setPrograms(programList);
      setSessionCounts(counts);
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error('Nem sikerült betölteni a programokat');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (initialized && !user) {
      setLoading(false);
      return;
    }
    if (user) {
      void loadPrograms();
    }
  }, [initialized, user, loadPrograms]);

  useAutoRefresh(loadPrograms, { enabled: Boolean(user?.id), scopes: ['workouts'] });

  const handleDelete = async (program: WorkoutProgram) => {
    const count = sessionCounts[program.id] ?? 0;
    const confirmed = window.confirm(
      `Biztosan törlöd a(z) „${program.name}" programot? Ez a hozzá tartozó ${count} edzést is törli.`,
    );
    if (!confirmed) return;

    try {
      await deleteProgram(program.id);
      toast.success('Program törölve');
      void loadPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Nem sikerült törölni a programot');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkoutSectionHeader
        title="Programok"
        description="A microciklus-generátorral létrehozott többhetes programjaid. Megnyithatod a hét/nap bontást, vagy törölheted a teljes programot a hozzá tartozó edzésekkel együtt."
        actions={(
          <button
            onClick={loadPrograms}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            Frissítés
          </button>
        )}
      />

      {programs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <CalendarRange className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Még nincs program</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Hozz létre egy többhetes programot a Ciklus-, Pwron- vagy Longevity-generátor „Microciklus" kapcsolójával.
          </p>
          <button onClick={() => navigate('/workout-planner/periodized-generator')} className="btn btn-primary">
            Ciklusgenerátor megnyitása
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <div
              key={program.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
            >
              <button
                type="button"
                onClick={() => navigate(`/programs/${program.id}`)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <CalendarRange className="h-8 w-8 shrink-0 text-primary-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{program.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {MODE_LABELS[program.generator_mode] ?? program.generator_mode} • {program.week_count} hét •{' '}
                    {sessionCounts[program.id] ?? 0} edzés • kezdés: {formatWorkoutDate(program.start_date)}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(program)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Törlés
                </button>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;
