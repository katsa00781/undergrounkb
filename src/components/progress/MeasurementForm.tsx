import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, Calendar } from 'lucide-react';
import { weightSchema, type WeightFormData } from '../../lib/progressTrackingHelpers';

interface MeasurementFormProps {
  onSubmit: (data: WeightFormData) => Promise<void>;
  onCancel: () => void;
}

const MeasurementForm = ({ onSubmit, onCancel }: MeasurementFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WeightFormData>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const submit = async (data: WeightFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch {
      // Keep the form populated so the user can retry after a failed save.
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Log Measurements</h2>

      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                {...register('date')}
                className="input pl-10"
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Weight (kg)
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Scale className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.1"
                {...register('weight', { valueAsNumber: true })}
                className="input pl-10"
                placeholder="75.5"
              />
            </div>
            {errors.weight && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.weight.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Body Fat % (Optional)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('bodyfat')}
              className="input mt-1"
              placeholder="20.5"
            />
            {errors.bodyfat && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.bodyfat.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Muscle Mass % (Optional)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('muscle')}
              className="input mt-1"
              placeholder="40.0"
            />
            {errors.muscle && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.muscle.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              BMI (Optional)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('bmi')}
              className="input mt-1"
              placeholder="25.0"
            />
            {errors.bmi && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.bmi.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deep Sleep (minutes) (Optional)
            </label>
            <input
              type="number"
              {...register('deep_sleep')}
              className="input mt-1"
              placeholder="120"
            />
            {errors.deep_sleep && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.deep_sleep.message}</p>
            )}
          </div>

          {/* Rest rating only appears if deep sleep is entered */}
          <div className={watch('deep_sleep') ? "" : "hidden"}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              How Rested Do You Feel? (1-5)
            </label>
            <div className="flex gap-4 mt-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  type="button"
                  key={rating}
                  onClick={() => setValue('rest_rating', rating, { shouldValidate: true })}
                  className={`flex flex-col items-center p-2 rounded-md transition-all ${
                    Number(watch('rest_rating')) === rating
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-300 hover:text-gray-500 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="text-2xl">
                    {rating <= 2 ? '😴' : rating === 3 ? '😐' : '😀'}
                  </span>
                  <span className="text-xs mt-1">{rating}</span>
                </button>
              ))}
            </div>

            {/* Hidden field to store the value in the form */}
            <input type="hidden" {...register('rest_rating')} />

            {errors.rest_rating && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.rest_rating.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input mt-1"
              placeholder="Any notes about your measurements..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              onCancel();
              reset();
            }}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </div>
            ) : (
              'Save Measurements'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeasurementForm;
