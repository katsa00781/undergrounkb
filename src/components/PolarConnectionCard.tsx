import { useEffect, useState } from 'react';
import { Activity, RefreshCw, Link2, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPolarAuthUrl,
  getPolarStatus,
  syncPolar,
  disconnectPolar,
  isPolarConfigured,
  type PolarStatus,
} from '../lib/polarService';

// Polar Flow összekötés és szinkron a Profil oldalon.
const PolarConnectionCard = () => {
  const [status, setStatus] = useState<PolarStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    void getPolarStatus()
      .then(setStatus)
      .finally(() => setIsLoading(false));
  }, []);

  const handleConnect = () => {
    window.location.href = getPolarAuthUrl();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const imported = await syncPolar();
      toast.success(
        imported > 0
          ? `${imported} új edzés szinkronizálva.`
          : 'Nincs új edzés.',
      );
      setStatus(await getPolarStatus());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'A szinkron sikertelen.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPolar();
      toast.success('Polar fiók leválasztva.');
      setStatus({ connected: false, connectedAt: null, lastSyncAt: null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'A leválasztás sikertelen.');
    }
  };

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString('hu-HU') : '—';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
        <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        Polar Flow
      </h2>

      {isLoading ? (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
          <span className="ml-2">Állapot betöltése...</span>
        </div>
      ) : !isPolarConfigured() ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          A Polar integráció nincs beállítva (hiányzó <code>VITE_POLAR_CLIENT_ID</code>).
        </p>
      ) : status?.connected ? (
        <div className="space-y-4">
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Összekötve: <span className="font-medium">{formatDate(status.connectedAt)}</span>
            </p>
            <p>
              Utolsó szinkron: <span className="font-medium">{formatDate(status.lastSyncAt)}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="btn btn-primary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Szinkronizálás...' : 'Szinkronizálás most'}
            </button>
            <button
              onClick={handleDisconnect}
              className="btn btn-outline flex items-center gap-2"
            >
              <Unlink className="h-4 w-4" />
              Leválasztás
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kösd össze a Polar Flow fiókodat, hogy a pulzus, kalória, edzésidő és
            edzésterhelési adatok automatikusan megjelenjenek az edzésnaplóban.
          </p>
          <button
            onClick={handleConnect}
            className="btn btn-primary flex items-center gap-2"
          >
            <Link2 className="h-4 w-4" />
            Polar összekötése
          </button>
        </div>
      )}
    </div>
  );
};

export default PolarConnectionCard;
