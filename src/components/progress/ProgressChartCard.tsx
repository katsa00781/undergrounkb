import { LineChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { WeightMeasurement } from '../../lib/weights';
import {
  CHART_METRICS,
  buildChartData,
  buildChartOptions,
  getChartMetricConfig,
  type ChartMetric,
} from '../../lib/progressTrackingHelpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressChartCardProps {
  weights: WeightMeasurement[];
  activeChart: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
  onAddFirst: () => void;
}

const ProgressChartCard = ({ weights, activeChart, onMetricChange, onAddFirst }: ProgressChartCardProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getChartMetricConfig(activeChart).titleLabel}
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last 30 days
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CHART_METRICS.map((metric) => (
            <button
              key={metric.id}
              onClick={() => onMetricChange(metric.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeChart === metric.id
                  ? metric.activeButtonClass
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {metric.buttonLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        {weights.length > 0 ? (
          <Line data={buildChartData(weights, activeChart)} options={buildChartOptions(activeChart)} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <LineChart className="mx-auto h-12 w-12" />
              <p className="mt-2">No measurement data available</p>
              <button
                onClick={onAddFirst}
                className="btn btn-primary mt-4"
              >
                Log Your First Measurement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressChartCard;
