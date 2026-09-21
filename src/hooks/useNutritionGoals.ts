import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useAutoRefresh } from './useAutoRefresh';
import { getLifestyleSettings, type LifestyleSettings } from '../lib/nutritionGoals';

/** A felhasználó kalória-/makrócéljai (`lifestyle_settings`). */
export function useNutritionGoals() {
  const { user, initialized } = useAuth();
  const [settings, setSettings] = useState<LifestyleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getLifestyleSettings(user.id);
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching nutrition goals:', err);
      setError(err instanceof Error ? err : new Error('Nem sikerült betölteni a célokat'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (initialized && !user?.id) {
      setSettings(null);
      setLoading(false);
      return;
    }
    if (user?.id) {
      reload();
    }
  }, [initialized, user?.id, reload]);

  useAutoRefresh(reload, { enabled: Boolean(user?.id), scopes: ['nutrition'] });

  return { settings, loading, error, reload };
}
