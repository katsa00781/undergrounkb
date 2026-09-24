import { supabase } from '../config/supabase';
import { notifyDataChanged } from '../utils/dataRefresh';
import { scaleFood, scaleMacros } from './nutritionTargets';
import type { Database } from '../types/supabase';
import type { Food } from './foods';
import type { RecipeWithItems } from './recipes';

export type FoodLogEntry = Database['public']['Tables']['food_log_entries']['Row'];

/** Az étkezések címkéi. A `meal_index` 1–4: 3 fő étkezés + nassolás. */
export const MEAL_LABELS = ['1. étkezés', '2. étkezés', '3. étkezés', 'Nassolás'];

export function mealLabel(index: number): string {
  return MEAL_LABELS[index - 1] ?? `${index}. étkezés`;
}

export async function getFoodLog(userId: string, date: string): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from('food_log_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('meal_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Étkezésenkénti fehérje-összeg (index → gramm). */
export function proteinByMeal(entries: FoodLogEntry[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const e of entries) {
    map.set(e.meal_index, (map.get(e.meal_index) ?? 0) + e.protein);
  }
  return map;
}

export type FoodEntryInsert = {
  date: string;
  mealIndex: number;
  food: Food;
  grams: number;
  /** Hány adag – csak ha a felhasználó adagban vitte fel (`serving_g` alapján). */
  servings?: number | null;
};

/**
 * Bejegyzés hozzáadása. A makrók a felvitel pillanatában érvényes értékekből
 * számolódnak és be is másolódnak a sorba – így a `foods` rekord későbbi
 * javítása nem írja át visszamenőleg a korábbi napokat.
 */
export async function addFoodEntry(input: FoodEntryInsert): Promise<FoodLogEntry> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nincs bejelentkezve');

  const macros = scaleFood(input.food, input.grams);

  const { data, error } = await supabase
    .from('food_log_entries')
    .insert({
      user_id: user.id,
      date: input.date,
      meal_index: input.mealIndex,
      food_id: input.food.id,
      name: input.food.brand ? `${input.food.name} (${input.food.brand})` : input.food.name,
      grams: input.grams,
      servings: input.servings ?? null,
      ...macros,
    })
    .select()
    .single();
  if (error) throw error;
  notifyDataChanged('nutrition');
  return data;
}

export type RecipeEntryInsert = {
  date: string;
  mealIndex: number;
  recipe: RecipeWithItems;
  /** Hány adagot ettem meg a receptből / étkezés-sablonból. */
  servings: number;
};

/**
 * Egy recept / étkezés-sablon naplózása EGY összevont sorként. A hozzávalók a
 * receptnél maradnak, a naplóban csak az eredmény látszik (pl. „Bolognai · 1 adag”).
 */
export async function addRecipeEntry(input: RecipeEntryInsert): Promise<FoodLogEntry> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nincs bejelentkezve');

  const { recipe } = input;
  const perServing = recipe.servings > 0 ? 1 / recipe.servings : 1;
  const macros = scaleMacros(recipe.totals, perServing * input.servings);
  const grams = (recipe.totalGrams / (recipe.servings || 1)) * input.servings;

  const { data, error } = await supabase
    .from('food_log_entries')
    .insert({
      user_id: user.id,
      date: input.date,
      meal_index: input.mealIndex,
      recipe_id: recipe.id,
      name: recipe.name,
      grams: Math.max(grams, 0.1),
      servings: input.servings,
      ...macros,
    })
    .select()
    .single();
  if (error) throw error;
  notifyDataChanged('nutrition');
  return data;
}

export type FoodEntryUpdate = {
  id: string;
  mealIndex: number;
  grams: number;
  servings: number | null;
  /** Ha a katalógusban még megvan az étel, pontosabb belőle újraszámolni. */
  food?: Food | null;
  /** A módosítás előtti sor – ebből számolunk arányt, ha nincs meg a forrás. */
  previous: FoodLogEntry;
};

/**
 * Meglévő naplósor módosítása: mennyiség és/vagy étkezés.
 * A makrók a katalógus-rekordból (ha megvan) vagy a régi sor arányos
 * átskálázásából jönnek – utóbbi receptnél és törölt ételnél is helyes.
 */
export async function updateFoodEntry(input: FoodEntryUpdate): Promise<FoodLogEntry> {
  const macros = input.food
    ? scaleFood(input.food, input.grams)
    : scaleMacros(input.previous, input.grams / (input.previous.grams || input.grams));

  const { data, error } = await supabase
    .from('food_log_entries')
    .update({
      meal_index: input.mealIndex,
      grams: input.grams,
      servings: input.servings,
      ...macros,
    })
    .eq('id', input.id)
    .select()
    .single();
  if (error) throw error;
  notifyDataChanged('nutrition');
  return data;
}

/**
 * Csak az étkezés-besorolás átállítása. A szinkronizált (`healthkit`) soroknál
 * ez az egyetlen megengedett módosítás – a makrókhoz és a mennyiséghez nem nyúlunk.
 */
export async function updateFoodEntryMeal(id: string, mealIndex: number): Promise<FoodLogEntry> {
  const { data, error } = await supabase
    .from('food_log_entries')
    .update({ meal_index: mealIndex })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  notifyDataChanged('nutrition');
  return data;
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const { error } = await supabase.from('food_log_entries').delete().eq('id', id);
  if (error) throw error;
  notifyDataChanged('nutrition');
}
