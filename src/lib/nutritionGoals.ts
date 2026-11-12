import { supabase } from '../config/supabase';
import { notifyDataChanged } from '../utils/dataRefresh';
import type { Database } from '../types/supabase';
import { buildNutritionGoalsPayload, type NutritionGoalsPatch } from './lifestyleSettings';

export type { NutritionGoalsPatch } from './lifestyleSettings';

/**
 * A `lifestyle_settings` tábla a mobil app „Kortalanul” műszak-tervezőjének is
 * otthona (shift_order, eating_windows, checklist_items, schedule_entries, stb.) –
 * a web ebből csak a kalória-kalkulátor mezőit írja (whitelist:
 * `NUTRITION_GOAL_FIELDS`), a többit nem érinti.
 */
export type LifestyleSettings = Database['public']['Tables']['lifestyle_settings']['Row'];

export async function getLifestyleSettings(userId: string): Promise<LifestyleSettings | null> {
  const { data, error } = await supabase.from('lifestyle_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Napi kalória-/makrócél mentése. A sor a felhasználóhoz upsert-elődik; a payload
 * csak a whitelistelt kalória-mezőket tartalmazza, így ütközéskor a mobil mezői
 * (`checklist_items`, `schedule_entries`, `custom_schedules`, …) változatlanok.
 */
export async function upsertNutritionGoals(userId: string, patch: NutritionGoalsPatch): Promise<LifestyleSettings> {
  const payload = buildNutritionGoalsPayload(userId, patch);
  const { data, error } = await supabase
    .from('lifestyle_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  notifyDataChanged('nutrition');
  return data;
}
