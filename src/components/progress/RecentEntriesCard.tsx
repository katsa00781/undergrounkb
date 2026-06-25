import { format, parseISO } from 'date-fns';
import type { WeightMeasurement } from '../../lib/weights';

interface RecentEntriesCardProps {
  weights: WeightMeasurement[];
}

const RecentEntriesCard = ({ weights }: RecentEntriesCardProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Entries</h3>

      <div className="space-y-4">
        {weights.length > 0 ? (
          weights.slice(-5).reverse().map((entry) => (
            <div key={entry.id} className="space-y-1 border-b border-gray-100 pb-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.date ? format(parseISO(entry.date), 'MMM d, yyyy')
                   : entry.created_at ? format(parseISO(entry.created_at), 'MMM d, yyyy')
                   : 'Unknown date'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500 dark:text-gray-400">
                  Weight: <span className="font-medium text-gray-900 dark:text-white">{entry.weight !== null && entry.weight !== undefined ? entry.weight.toFixed(1) : '0'} kg</span>
                </div>

                {entry.bodyfat !== null && entry.bodyfat !== undefined && (
                  <div className="text-gray-500 dark:text-gray-400">
                    Body Fat: <span className="font-medium text-gray-900 dark:text-white">{entry.bodyfat !== null && entry.bodyfat !== undefined ? entry.bodyfat.toFixed(1) : '0'}%</span>
                  </div>
                )}

                {entry.muscle !== null && entry.muscle !== undefined && (
                  <div className="text-gray-500 dark:text-gray-400">
                    Muscle: <span className="font-medium text-gray-900 dark:text-white">{entry.muscle !== null && entry.muscle !== undefined ? entry.muscle.toFixed(1) : '0'}%</span>
                  </div>
                )}

                {entry.bmi !== null && entry.bmi !== undefined && (
                  <div className="text-gray-500 dark:text-gray-400">
                    BMI: <span className="font-medium text-gray-900 dark:text-white">{entry.bmi !== null && entry.bmi !== undefined ? entry.bmi.toFixed(1) : '0'}</span>
                  </div>
                )}

                {entry.deep_sleep !== undefined && (
                  <div className="text-gray-500 dark:text-gray-400">
                    Deep Sleep: <span className="font-medium text-gray-900 dark:text-white">{entry.deep_sleep} min</span>
                  </div>
                )}

                {entry.rest_rating !== undefined && (
                  <div className="text-gray-500 dark:text-gray-400">
                    Rest Rating: <span className="font-medium text-gray-900 dark:text-white">
                      {entry.rest_rating <= 2 ? '😴' : entry.rest_rating === 3 ? '😐' : '😀'} ({entry.rest_rating}/5)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No entries yet
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentEntriesCard;
