import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import type { WeightMeasurement } from './weights';

const optionalMeasurement = (schema: z.ZodNumber) =>
  z.preprocess(
    (val) => {
      // Handle NaN, empty string, null, undefined
      if (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) {
        return undefined;
      }
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    schema.optional()
  );

export const weightSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weight: z.number().min(20, 'Weight must be at least 20 kg').max(300, 'Weight must be less than 300 kg'),
  bodyfat: optionalMeasurement(
    z.number().min(1, 'Body fat must be at least 1%').max(60, 'Body fat must be less than 60%')
  ),
  muscle: optionalMeasurement(
    z.number().min(10, 'Muscle mass must be at least 10%').max(80, 'Muscle mass must be less than 80%')
  ),
  bmi: optionalMeasurement(
    z.number().min(10, 'BMI must be at least 10').max(60, 'BMI must be less than 60')
  ),
  deep_sleep: optionalMeasurement(
    z.number().min(0, 'Deep sleep cannot be negative').max(600, 'Deep sleep must be less than 10 hours')
  ),
  rest_rating: optionalMeasurement(
    z.number().min(1, 'Rating must be between 1-5').max(5, 'Rating must be between 1-5')
  ),
  notes: z.string().optional(),
});

export type WeightFormData = z.infer<typeof weightSchema>;

export type ChartMetric = 'weight' | 'bodyfat' | 'muscle' | 'bmi' | 'deep_sleep';

export interface ChartMetricConfig {
  id: ChartMetric;
  buttonLabel: string;
  datasetLabel: string;
  titleLabel: string;
  borderColor: string;
  backgroundColor: string;
  activeButtonClass: string;
  beginAtZero: boolean;
  getValue: (measurement: WeightMeasurement) => number | null | undefined;
  formatTick: (value: number | string) => string;
  formatTooltip: (value: number) => string;
}

export const CHART_METRICS: ChartMetricConfig[] = [
  {
    id: 'weight',
    buttonLabel: 'Weight',
    datasetLabel: 'Weight (kg)',
    titleLabel: 'Weight Progress',
    borderColor: 'rgb(59, 130, 246)', // blue
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    activeButtonClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    beginAtZero: false,
    getValue: (m) => m.weight,
    formatTick: (value) => `${value} kg`,
    formatTooltip: (value) => `Weight: ${value} kg`,
  },
  {
    id: 'bodyfat',
    buttonLabel: 'Body Fat',
    datasetLabel: 'Body Fat (%)',
    titleLabel: 'Body Fat Progress',
    borderColor: 'rgb(249, 115, 22)', // orange
    backgroundColor: 'rgba(249, 115, 22, 0.5)',
    activeButtonClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    beginAtZero: false,
    getValue: (m) => m.bodyfat,
    formatTick: (value) => `${value}%`,
    formatTooltip: (value) => `Body Fat: ${value}%`,
  },
  {
    id: 'muscle',
    buttonLabel: 'Muscle Mass',
    datasetLabel: 'Muscle Mass (%)',
    titleLabel: 'Muscle Mass Progress',
    borderColor: 'rgb(16, 185, 129)', // green
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
    activeButtonClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    beginAtZero: false,
    getValue: (m) => m.muscle,
    formatTick: (value) => `${value}%`,
    formatTooltip: (value) => `Muscle: ${value}%`,
  },
  {
    id: 'bmi',
    buttonLabel: 'BMI',
    datasetLabel: 'BMI',
    titleLabel: 'BMI Progress',
    borderColor: 'rgb(139, 92, 246)', // purple
    backgroundColor: 'rgba(139, 92, 246, 0.5)',
    activeButtonClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    beginAtZero: false,
    getValue: (m) => m.bmi,
    formatTick: (value) => `${value}`,
    formatTooltip: (value) => `BMI: ${value}`,
  },
  {
    id: 'deep_sleep',
    buttonLabel: 'Deep Sleep',
    datasetLabel: 'Deep Sleep (min)',
    titleLabel: 'Deep Sleep Progress',
    borderColor: 'rgb(236, 72, 153)', // pink
    backgroundColor: 'rgba(236, 72, 153, 0.5)',
    activeButtonClass: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    beginAtZero: true,
    getValue: (m) => m.deep_sleep,
    formatTick: (value) => `${value} min`,
    formatTooltip: (value) => `Deep Sleep: ${value} min`,
  },
];

export function getChartMetricConfig(metric: ChartMetric): ChartMetricConfig {
  return CHART_METRICS.find((config) => config.id === metric) ?? CHART_METRICS[0];
}

export function getChartLabels(weights: WeightMeasurement[]): string[] {
  return weights.map((w) => {
    const dateToFormat = w.date || (w.created_at && new Date(w.created_at).toISOString().split('T')[0]);
    return dateToFormat ? format(parseISO(dateToFormat), 'MMM d') : 'N/A';
  });
}

export function buildChartData(weights: WeightMeasurement[], metric: ChartMetric) {
  const config = getChartMetricConfig(metric);

  return {
    labels: getChartLabels(weights),
    datasets: [
      {
        label: config.datasetLabel,
        data: weights.map((w) => config.getValue(w)).filter((val) => val !== undefined),
        borderColor: config.borderColor,
        backgroundColor: config.backgroundColor,
        tension: 0.3,
      },
    ],
  };
}

export function buildChartOptions(metric: ChartMetric) {
  const config = getChartMetricConfig(metric);

  return {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number } }) => config.formatTooltip(context.parsed.y),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: config.beginAtZero,
        ticks: {
          callback: (value: number | string) => config.formatTick(value),
        },
      },
    },
  };
}
