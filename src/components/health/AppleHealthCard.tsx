import { useEffect, useState } from 'react';
import { Footprints, Moon, HeartPulse, Activity, Flame } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getLatestDailyHealthLog, formatHealthDuration, type DailyHealthLog } from '../../lib/healthService';

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

  const metrics = log
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
            {metrics.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{value}</p>
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
