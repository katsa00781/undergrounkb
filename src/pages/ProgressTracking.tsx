import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, Plus, X, LineChart, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { WeightMeasurement, createWeightMeasurement, getWeightMeasurements } from '../lib/weights';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const weightSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weight: z.number().min(20, 'Weight must be at least 20 kg').max(300, 'Weight must be less than 300 kg'),
  notes: z.string().optional(),
});

type WeightFormData = z.infer<typeof weightSchema>;

const ProgressTracking = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [weights, setWeights] = useState<WeightMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WeightFormData>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (user?.id) {
      loadWeights();
    }
  }, [user?.id]);

  const loadWeights = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const data = await getWeightMeasurements(user.id);
      setWeights(data);
    } catch (error) {
      console.error('Failed to load weights:', error);
      toast.error('Failed to load weight data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: WeightFormData) => {
    if (!user?.id) return;

    try {
      await createWeightMeasurement({
        user_id: user.id,
        date: data.date,
        weight: data.weight,
        notes: data.notes,
      });
      
      await loadWeights();
      setShowForm(false);
      reset();
      toast.success('Weight logged successfully');
    } catch (error) {
      console.error('Failed to save weight:', error);
      toast.error('Failed to save weight data');
    }
  };

  const chartData = {
    labels: weights.map(w => format(parseISO(w.date), 'MMM d')),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weights.map(w => w.weight),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Weight: ${context.parsed.y} kg`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: number) => `${value} kg`,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Progress Tracking</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Monitor your fitness journey</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          {showForm ? (
            <>
              <X size={20} />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus size={20} />
              <span>Log Weight</span>
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Log Weight</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input mt-1"
                  placeholder="Any notes about your weight measurement..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
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
                  'Save Weight'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weight Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weight Progress</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last 30 days
              </div>
            </div>
            
            <div className="h-[300px]">
              {weights.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <LineChart className="mx-auto h-12 w-12" />
                    <p className="mt-2">No weight data available</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="btn btn-primary mt-4"
                    >
                      Log Your First Weight
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Statistics</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Current Weight</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {weights[weights.length - 1]?.weight.toFixed(1) || '—'} kg
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">30 Day Change</div>
                {weights.length >= 2 && (
                  <div className={`text-2xl font-semibold ${
                    weights[weights.length - 1].weight - weights[0].weight < 0
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-error-600 dark:text-error-400'
                  }`}>
                    {(weights[weights.length - 1].weight - weights[0].weight).toFixed(1)} kg
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Average Weight</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {weights.length > 0
                    ? (weights.reduce((sum, w) => sum + w.weight, 0) / weights.length).toFixed(1)
                    : '—'} kg
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Entries</h3>
            
            <div className="space-y-4">
              {weights.length > 0 ? (
                weights.slice(-5).reverse().map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(entry.date), 'MMM d, yyyy')}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {entry.weight.toFixed(1)} kg
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
        </div>
      </div>
    </div>
  );
};

export default ProgressTracking;