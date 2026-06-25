import type { WeightMeasurement } from '../../lib/weights';

interface ProgressStatsCardProps {
  weights: WeightMeasurement[];
}

const ProgressStatsCard = ({ weights }: ProgressStatsCardProps) => {
  const lastEntry = weights.length > 0 ? weights[weights.length - 1] : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Statistics</h3>

      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Current Weight</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
            {lastEntry?.weight !== null && lastEntry?.weight !== undefined
              ? lastEntry?.weight.toFixed(1)
              : '—'} kg
          </div>
        </div>

        {/* Body Fat */}
        {lastEntry && typeof lastEntry.bodyfat === 'number' && (
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Body Fat</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {lastEntry.bodyfat !== null && lastEntry.bodyfat !== undefined
                ? lastEntry.bodyfat.toFixed(1)
                : '0'}%
            </div>
          </div>
        )}

        {/* Muscle Mass */}
        {lastEntry && typeof lastEntry.muscle === 'number' && (
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Muscle Mass</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {lastEntry.muscle !== null && lastEntry.muscle !== undefined ? lastEntry.muscle.toFixed(1) : '0'}%
            </div>
          </div>
        )}

        {/* BMI */}
        {lastEntry && typeof lastEntry.bmi === 'number' && (
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current BMI</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {lastEntry.bmi !== null && lastEntry.bmi !== undefined ? lastEntry.bmi.toFixed(1) : '0'}
            </div>
          </div>
        )}

        {/* Weight Change */}
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Weight Change</div>
          {weights.length >= 2 && (
            <div className={`text-2xl font-semibold ${
              weights[weights.length - 1].weight - weights[0].weight < 0
                ? 'text-success-600 dark:text-success-400'
                : 'text-error-600 dark:text-error-400'
            }`}>
              {((weights[weights.length - 1].weight !== null && weights[weights.length - 1].weight !== undefined &&
                 weights[0].weight !== null && weights[0].weight !== undefined)
                ? (weights[weights.length - 1].weight - weights[0].weight).toFixed(1)
                : '0')} kg
            </div>
          )}
        </div>

        {/* Sleep Quality */}
        {weights.some(w => w.rest_rating !== undefined) && (
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Last Sleep Quality</div>
            <div className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
              {(() => {
                const entry = weights.slice().reverse().find(w => w.rest_rating !== undefined);
                if (!entry || entry.rest_rating === undefined) return '—';

                const rating = entry.rest_rating;
                const emoji = rating <= 2 ? '😴' : rating === 3 ? '😐' : '😀';
                return `${rating}/5 ${emoji}`;
              })()}
            </div>
          </div>
        )}

        {/* Average Deep Sleep */}
        {weights.some(w => w.deep_sleep !== undefined) && (
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Average Deep Sleep</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {weights.filter(w => w.deep_sleep !== undefined).length > 0
                ? Math.round(weights.reduce((sum, w) => sum + (w.deep_sleep || 0), 0) / weights.filter(w => w.deep_sleep !== undefined).length)
                : '—'} min
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressStatsCard;
