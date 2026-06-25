import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { WeightMeasurement, createWeightMeasurement, getWeightMeasurements } from '../lib/weights';
import type { ChartMetric, WeightFormData } from '../lib/progressTrackingHelpers';
import MeasurementForm from '../components/progress/MeasurementForm';
import ProgressChartCard from '../components/progress/ProgressChartCard';
import ProgressStatsCard from '../components/progress/ProgressStatsCard';
import RecentEntriesCard from '../components/progress/RecentEntriesCard';

const ProgressTracking = () => {
  const { user, initialized } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [weights, setWeights] = useState<WeightMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<ChartMetric>('weight');

  const loadWeights = useCallback(async () => {
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
  }, [user?.id]);

  useEffect(() => {
    if (initialized && !user?.id) {
      setIsLoading(false);
      return;
    }

    if (user?.id) {
      loadWeights();
    }
  }, [initialized, user?.id, loadWeights]);

  useAutoRefresh(loadWeights, {
    enabled: Boolean(user?.id),
    scopes: ['weights'],
  });

  const handleSubmit = async (data: WeightFormData) => {
    if (!user?.id) return;

    try {
      // Ensure rest_rating is properly converted to a number if it exists
      const rest_rating = data.rest_rating !== undefined ? Number(data.rest_rating) : undefined;

      await createWeightMeasurement({
        user_id: user.id,
        date: data.date,
        weight: data.weight,
        bodyfat: data.bodyfat,
        muscle: data.muscle,
        bmi: data.bmi,
        deep_sleep: data.deep_sleep,
        rest_rating: rest_rating,
        notes: data.notes,
      });

      await loadWeights();
      setShowForm(false);
      toast.success('Measurements logged successfully');
    } catch (error) {
      console.error('Failed to save measurements:', error);
      toast.error('Failed to save measurement data');
      throw error;
    }
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
              <span>Log Measurements</span>
            </>
          )}
        </button>
      </div>

      {showForm && (
        <MeasurementForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weight Chart */}
        <div className="lg:col-span-2">
          <ProgressChartCard
            weights={weights}
            activeChart={activeChart}
            onMetricChange={setActiveChart}
            onAddFirst={() => setShowForm(true)}
          />
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <ProgressStatsCard weights={weights} />
          <RecentEntriesCard weights={weights} />
        </div>
      </div>
    </div>
  );
};

export default ProgressTracking;
