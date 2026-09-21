import { supabase } from '../config/supabase';
import { notifyDataChanged } from '../utils/dataRefresh';
import { EMPTY_MACROS, sumMacros, type Macros } from './nutritionTargets';
import type { Database } from '../types/supabase';

export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeItem = Database['public']['Tables']['recipe_items']['Row'];

/**
 * Egy modell, két típus:
 *   'recipe' – nagyobb adagban készült étel, több adagra osztva (pl. 4 adag bolognai)
 *   'meal'   – étkezés-sablon, mindig 1 adag (pl. „Reggeli: 3 tojás + 60 g sonka”)
 */
export type RecipeKind = 'recipe' | 'meal';

export const RECIPE_KINDS: { key: RecipeKind; label: string; hint: string }[] = [
  { key: 'recipe', label: 'Recept', hint: 'több adagra főzve' },
  { key: 'meal', label: 'Étkezés', hint: 'egy adag, egy kattintás' },
];

export function recipeKind(raw: string): RecipeKind {
  return raw === 'recipe' ? 'recipe' : 'meal';
}

export function recipeKindLabel(raw: string): string {
  return recipeKind(raw) === 'recipe' ? 'Recept' : 'Étkezés';
}

export type RecipeWithItems = Recipe & {
  items: RecipeItem[];
  /** A teljes hozzávaló-lista makrói (NEM egy adagé). */
  totals: Macros;
  /** A teljes hozzávaló-lista tömege grammban. */
  totalGrams: number;
};

function withTotals(recipe: Recipe, items: RecipeItem[]): RecipeWithItems {
  return {
    ...recipe,
    items,
    totals: items.length > 0 ? sumMacros(items) : { ...EMPTY_MACROS },
    totalGrams: items.reduce((sum, i) => sum + i.grams, 0),
  };
}

/** Egy adag makrói – ebből számol a naplózás és a lista előnézete. */
export function macrosPerServing(recipe: RecipeWithItems): Macros {
  const servings = recipe.servings > 0 ? recipe.servings : 1;
  return {
    kcal: round1(recipe.totals.kcal / servings),
    protein: round1(recipe.totals.protein / servings),
    carbs: round1(recipe.totals.carbs / servings),
    fat: round1(recipe.totals.fat / servings),
  };
}

/** Egy adag tömege grammban. */
export function gramsPerServing(recipe: RecipeWithItems): number {
  const servings = recipe.servings > 0 ? recipe.servings : 1;
  return round1(recipe.totalGrams / servings);
}

/**
 * A felhasználó receptjei és étkezés-sablonjai, hozzávalókkal.
 * Két lekérdezés beágyazott join helyett: a `recipes` → `recipe_items`
 * kapcsolat nincs felvéve a típusokba (ugyanaz a minta, mint a `getRecentFoods`-nál).
 */
export async function getRecipes(userId: string): Promise<RecipeWithItems[]> {
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw error;
  if (!recipes || recipes.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from('recipe_items')
    .select('*')
    .in(
      'recipe_id',
      recipes.map((r) => r.id),
    )
    .order('position', { ascending: true });
  if (itemsError) throw itemsError;

  const byRecipe = new Map<string, RecipeItem[]>();
  for (const item of items ?? []) {
    const list = byRecipe.get(item.recipe_id);
    if (list) list.push(item);
    else byRecipe.set(item.recipe_id, [item]);
  }

  return recipes.map((r) => withTotals(r, byRecipe.get(r.id) ?? []));
}

export async function getRecipe(id: string): Promise<RecipeWithItems | null> {
  const { data: recipe, error } = await supabase.from('recipes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!recipe) return null;

  const { data: items, error: itemsError } = await supabase
    .from('recipe_items')
    .select('*')
    .eq('recipe_id', id)
    .order('position', { ascending: true });
  if (itemsError) throw itemsError;

  return withTotals(recipe, items ?? []);
}

/** Egy hozzávaló a szerkesztőben – a makrók már a megadott grammra vannak skálázva. */
export type RecipeItemInput = {
  foodId: string | null;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type RecipeInput = {
  /** Megadva = szerkesztés, hiányzik = új recept. */
  id?: string;
  kind: RecipeKind;
  name: string;
  servings: number;
  notes: string | null;
  items: RecipeItemInput[];
};

/**
 * Létrehozás vagy mentés. A hozzávalók wipe + rewrite módon frissülnek –
 * a sorrend a listabeli pozíció, külön diff-elés nélkül.
 */
export async function saveRecipe(input: RecipeInput): Promise<RecipeWithItems> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nincs bejelentkezve');

  const row = {
    user_id: user.id,
    kind: input.kind,
    name: input.name,
    servings: input.kind === 'meal' ? 1 : input.servings,
    notes: input.notes,
    updated_at: new Date().toISOString(),
  };

  let recipeId = input.id;
  if (recipeId) {
    const { error } = await supabase.from('recipes').update(row).eq('id', recipeId);
    if (error) throw error;
    const { error: wipeError } = await supabase.from('recipe_items').delete().eq('recipe_id', recipeId);
    if (wipeError) throw wipeError;
  } else {
    const { data, error } = await supabase.from('recipes').insert(row).select().single();
    if (error) throw error;
    recipeId = data.id;
  }

  if (input.items.length > 0) {
    const { error } = await supabase.from('recipe_items').insert(
      input.items.map((item, index) => ({
        recipe_id: recipeId!,
        position: index,
        food_id: item.foodId,
        name: item.name,
        grams: item.grams,
        kcal: item.kcal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
    );
    if (error) throw error;
  }

  const saved = await getRecipe(recipeId!);
  if (!saved) throw new Error('A mentett recept nem olvasható vissza');
  notifyDataChanged('nutrition');
  return saved;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
  notifyDataChanged('nutrition');
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
