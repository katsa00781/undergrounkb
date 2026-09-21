import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useAutoRefresh } from './useAutoRefresh';
import { getRecipes, type RecipeWithItems } from '../lib/recipes';

/** A felhasználó receptjei és étkezés-sablonjai, hozzávalókkal. */
export function useRecipes() {
  const { user, initialized } = useAuth();
  const [recipes, setRecipes] = useState<RecipeWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getRecipes(user.id);
      setRecipes(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError(err instanceof Error ? err : new Error('Nem sikerült betölteni a recepteket'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (initialized && !user?.id) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    if (user?.id) {
      reload();
    }
  }, [initialized, user?.id, reload]);

  useAutoRefresh(reload, { enabled: Boolean(user?.id), scopes: ['nutrition'] });

  return { recipes, loading, error, reload };
}
