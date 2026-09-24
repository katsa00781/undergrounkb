import { useEffect, useMemo, useState } from 'react';
import { Moon } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../../hooks/useAuth';
import { getDailyHealthLogs, type DailyHealthLog } from '../../lib/healthService';
import {
  isPoorSleepNight,
  sleepRestedLabel,
  summarizeSleepByShift,
  summarizeSleepTrend,
} from '../../lib/sleepRested';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const TREND_DAYS = 30;

type ThemeColors = { score: string; rested: string; poor: string; grid: string; text: string };

// A Chart.js canvasra rajzol, a Tailwind class-okat nem látja — a szemantikus skálákat
// közvetlenül az index.css CSS-változóiból olvassuk, így követik a Daylight/Volt témát.
const readThemeColors = (): ThemeColors => {
  const style = getComputedStyle(document.documentElement);
  const rgb = (name: string) => `rgb(${style.getPropertyValue(`--color-${name}`).trim()})`;
  return {
    score: rgb('primary-500'),
    rested: rgb('secondary-500'),
    poor: rgb('error-500'),
    // A gray skála statikus (tailwind.config.js): gray-400 / gray-500, mindkét témában olvasható.
    grid: 'rgb(168 176 168 / 0.2)',
    text: 'rgb(124 133 125)',
  };
};

/** Újraolvassa a színeket, amikor a `<html>` `dark` class-a változik (téma-váltás). */
const useThemeColors = (): ThemeColors => {
  const [colors, setColors] = useState<ThemeColors>(readThemeColors);
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readThemeColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return colors;
};

const formatDay = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });

// Alvás-trend az utolsó 30 napra (mobil app `daily_logs`): pontszám + szubjektív kipihentség,
// rossz éjszakák kiemelve (a mobillal azonos szabály), valamint a kipihentség műszakonként.
const SleepTrendCard = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyHealthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colors = useThemeColors();

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    void getDailyHealthLogs(user.id, TREND_DAYS)
      .then(setLogs)
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const sleepLogs = useMemo(
    () => logs.filter((l) => l.sleep_score != null || l.sleep_rested != null),
    [logs],
  );
  const trend = useMemo(() => summarizeSleepTrend(sleepLogs), [sleepLogs]);
  const shifts = useMemo(() => summarizeSleepByShift(sleepLogs), [sleepLogs]);

  const chartData = useMemo<ChartData<'line'>>(() => {
    const poor = sleepLogs.map(isPoorSleepNight);
    return {
      labels: sleepLogs.map((l) => formatDay(l.date)),
      datasets: [
        {
          label: 'Alvás-pontszám',
          data: sleepLogs.map((l) => l.sleep_score),
          borderColor: colors.score,
          backgroundColor: colors.score,
          pointBackgroundColor: poor.map((p) => (p ? colors.poor : colors.score)),
          pointBorderColor: poor.map((p) => (p ? colors.poor : colors.score)),
          pointRadius: poor.map((p) => (p ? 5 : 3)),
          spanGaps: true,
          tension: 0.3,
          yAxisID: 'score',
        },
        {
          label: 'Kipihentség (1–5)',
          data: sleepLogs.map((l) => l.sleep_rested),
          borderColor: colors.rested,
          backgroundColor: colors.rested,
          borderDash: [4, 4],
          pointRadius: 3,
          spanGaps: true,
          tension: 0.3,
          yAxisID: 'rested',
        },
      ],
    };
  }, [sleepLogs, colors]);

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: colors.text, boxWidth: 12 } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.parsed.y == null) return '';
              if (ctx.dataset.yAxisID === 'rested') {
                return `Kipihentség: ${ctx.parsed.y}/5 · ${sleepRestedLabel(ctx.parsed.y) ?? ''}`;
              }
              return `Alvás-pontszám: ${ctx.parsed.y}`;
            },
            footer: (items) => {
              const log = sleepLogs[items[0]?.dataIndex ?? -1];
              return log && isPoorSleepNight(log) ? 'Rossz éjszaka' : '';
            },
          },
        },
      },
      scales: {
        x: { ticks: { color: colors.text, maxRotation: 0, autoSkip: true }, grid: { display: false } },
        score: {
          position: 'left',
          min: 0,
          max: 100,
          ticks: { color: colors.text },
          grid: { color: colors.grid },
        },
        rested: {
          position: 'right',
          min: 1,
          max: 5,
          ticks: { color: colors.text, stepSize: 1 },
          grid: { drawOnChartArea: false },
        },
      },
    }),
    [colors, sleepLogs],
  );

  const stats = [
    { label: 'Átlagos pontszám', value: trend.avgScore != null ? `${trend.avgScore}` : '—' },
    { label: 'Átlagos kipihentség', value: trend.avgRested != null ? `${trend.avgRested.toLocaleString('hu-HU')}/5` : '—' },
    { label: 'Rossz éjszakák', value: `${trend.poorNights} / ${trend.nights}` },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <Moon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          Alvás-trend
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">Utolsó {TREND_DAYS} nap</span>
      </div>

      {isLoading ? (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
          <span className="ml-2">Adatok betöltése...</span>
        </div>
      ) : sleepLogs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Az utolsó {TREND_DAYS} napban nincs alvásadat. Az alvás-pontszám a mobil alkalmazás HealthKit
          szinkronjából, a kipihentség a mobil „Mai nap” képernyőjéről érkezik.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {stats.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="font-medium text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="h-[260px]">
            <Line data={chartData} options={chartOptions} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Rossz éjszaka (kiemelt pont): 55 alatti pontszám vagy legfeljebb 2-es kipihentség.
          </p>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Kipihentség műszakonként</h3>
            {shifts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Még nincs kitöltött kipihentség ebben az időszakban.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="py-1 pr-3 font-medium">Műszak</th>
                      <th className="py-1 pr-3 font-medium">Kipihentség</th>
                      <th className="py-1 pr-3 font-medium">Pontszám</th>
                      <th className="py-1 pr-3 font-medium">Éjszakák</th>
                      <th className="py-1 font-medium" title="70+ pontszám mellett legfeljebb 2-es kipihentség">
                        Eltérés
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-900 dark:divide-gray-700 dark:text-white">
                    {shifts.map((s) => (
                      <tr key={s.shiftKey ?? 'none'}>
                        <td className="py-1.5 pr-3">{s.label}</td>
                        <td className="py-1.5 pr-3">{s.avgRested.toLocaleString('hu-HU', { minimumFractionDigits: 1 })}/5</td>
                        <td className="py-1.5 pr-3">{s.avgScore ?? '—'}</td>
                        <td className="py-1.5 pr-3">{s.nights}</td>
                        <td
                          className={`py-1.5 ${s.mismatches > 0 ? 'font-medium text-warning-600 dark:text-warning-400' : ''}`}
                        >
                          {s.mismatches}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Eltérés: jó (legalább 70-es) alvás-pontszám mellett legfeljebb 2-es kipihentség — pl. korai kelésnél a
              belső óra miatt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepTrendCard;
