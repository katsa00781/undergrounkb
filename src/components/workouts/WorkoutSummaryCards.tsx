interface WorkoutSummaryCardsProps {
  workoutTitle?: string;
  statusLabel: string;
  sectionsCount: number;
  totalExerciseCount: number;
  totalSetCount: number;
  duration?: number;
  date?: string;
}

const WorkoutSummaryCards = ({
  workoutTitle,
  statusLabel,
  sectionsCount,
  totalExerciseCount,
  totalSetCount,
  duration,
  date,
}: WorkoutSummaryCardsProps) => {
  return (
    <div className="mb-6 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:grid-cols-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Edzés</p>
        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
          {workoutTitle?.trim() || 'Még nincs cím megadva'}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{statusLabel}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Szekciók</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{sectionsCount}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Aktív blokk</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Gyakorlatok</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{totalExerciseCount}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Összesen {totalSetCount} sorozat</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tervezett idő</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{duration || 0} perc</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{date || 'Dátum nélkül'}</p>
      </div>
    </div>
  );
};

export default WorkoutSummaryCards;
