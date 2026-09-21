import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useAutoRefresh } from './useAutoRefresh';
import { getFoodLog, type FoodLogEntry } from '../lib/foodLog';

/** Egy nap étel-napló bejegyzései – a `date` (YYYY-MM-DD) változásakor újratölt. */
export function useFoodLog(date: string) {
  const { user, initialized } = useAuth();
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getFoodLog(user.id, date);
      setEntries(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching food log:', err);
      setError(err instanceof Error ? err : new Error('Nem sikerült betölteni a napló-bejegyzéseket'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, date]);

  useEffect(() => {
    if (initialized && !user?.id) {
      setEntries([]);
      setLoading(false);
      return;
    }
    if (user?.id) {
      reload();
    }
  }, [initialized, user?.id, reload]);

  useAutoRefresh(reload, { enabled: Boolean(user?.id), scopes: ['nutrition'] });

  return { entries, loading, error, reload };
}
