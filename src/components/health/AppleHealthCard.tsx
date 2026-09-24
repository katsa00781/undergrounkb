import { useEffect, useState } from 'react';
import { Footprints, Moon, HeartPulse, Activity, Flame, Gauge } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getLatestDailyHealthLog, formatHealthDuration, type DailyHealthLog } from '../../lib/healthService';
import { formatSleepRested, sleepRestedTone, type SleepRestedTone } from '../../lib/sleepRested';

const RESTED_TONE_CLASSES: Record<SleepRestedTone, string> = {
  low: 'text-error-600 dark:text-error-400',
  mid: 'text-warning-600 dark:text-warning-400',
  high: 'text-success-600 dark:text-success-400',
};

// Apple Health adatok (mobil app HealthKit szinkronjából) a Profil oldalon.
// Nincs "összekötés" gomb: az adat automatikusan érkezik a mobil appból, a web csak megjeleníti.
const AppleHealthCard = () => {
  const { user } = useAuth();
  const [log, setLog] = useState<DailyHealthLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    void getLatestDailyHealthLog(user.id)
      .then(setLog)
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString('hu-HU') : '—';

  const restedText = log ? formatSleepRested(log.sleep_rested) : null;
  const restedTone = log ? sleepRestedTone(log.sleep_rested) : null;

  const metrics: { icon: typeof Moon; label: string; value: string; detail?: string | null; detailClass?: string }[] = log
    ? [
        {
          icon: Footprints,
          label: 'Lépésszám',
          value: log.steps != null ? log.steps.toLocaleString('hu-HU') : '—',
        },
        {
          icon: Moon,
          label: 'Alvás',
          value: formatHealthDuration(log.sleep_minutes),
        },
        {
          icon: Gauge,
          label: 'Alvás-pontszám',
          value: log.sleep_score != null ? `${log.sleep_score}/100` : '—',
          // A kipihentséget a felhasználó adja meg a mobilon; csak akkor jelenik meg, ha ki van töltve.
          detail: restedText,
          detailClass: restedTone ? RESTED_TONE_CLASSES[restedTone] : undefined,
        },
        {
          icon: HeartPulse,
          label: 'Nyugalmi pulzus',
          value: log.resting_heart_rate != null ? `${log.resting_heart_rate} bpm` : '—',
        },
        {
          icon: Activity,
          label: 'HRV (SDNN)',
          value: log.hrv_sdnn != null ? `${Math.round(Number(log.hrv_sdnn))} ms` : '—',
        },
        {
          icon: Flame,
          label: 'Aktív kalória',
          value: log.active_energy_kcal != null ? `${log.active_energy_kcal} kcal` : '—',
        },
      ]
    : [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
        <HeartPulse className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        Apple Health
      </h2>

      {isLoading ? (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
          <span className="ml-2">Adatok betöltése...</span>
        </div>
      ) : !log ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Még nincs szinkronizált Apple Health adat. Az adatok a mobil alkalmazásból, a
          HealthKit szinkronon keresztül érkeznek automatikusan.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Legutóbbi nap: <span className="font-medium">{formatDate(log.date)}</span>
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {metrics.map(({ icon: Icon, label, value, detail, detailClass }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                  {detail && <p className={`text-xs font-medium ${detailClass ?? ''}`}>{detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppleHealthCard;
