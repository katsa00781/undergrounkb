import { supabase } from '../config/supabase';
import { notifyDataChanged } from '../utils/dataRefresh';
import type { Database } from '../types/supabase';
import type { GoalType } from './nutritionTargets';

/**
 * A `lifestyle_settings` tábla a mobil app „Kortalanul” műszak-tervezőjének is
 * otthona (shift_order, eating_windows, stb.) – ide csak a kalória-kalkulátor
 * mezőit vesszük fel, a többit a web nem érinti.
 */
export type LifestyleSettings = Database['public']['Tables']['lifestyle_settings']['Row'];

export async function getLifestyleSettings(userId: string): Promise<LifestyleSettings | null> {
  const { data, error } = await supabase.from('lifestyle_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export type NutritionGoalsPatch = {
  kcal_goal?: number | null;
  carbs_goal_g?: number | null;
  fat_goal_g?: number | null;
  activity_factor?: number;
  goal_type?: GoalType;
};

/** Napi kalória-/makrócél mentése. A sor a felhasználóhoz upsert-elődik. */
export async function upsertNutritionGoals(userId: string, patch: NutritionGoalsPatch): Promise<LifestyleSettings> {
  const payload = {
    user_id: userId,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('lifestyle_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  notifyDataChanged('nutrition');
  return data;
}
