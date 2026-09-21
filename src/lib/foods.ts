import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

export type Food = Database['public']['Tables']['foods']['Row'];
export type FoodInsert = Database['public']['Tables']['foods']['Insert'];

/**
 * Egy Open Food Facts találat, ami MÉG NINCS a katalógusban.
 * Csak akkor íródik be (`saveOffCandidate`), ha a felhasználó rábök – így a
 * keresés nem szemeteli tele a `foods` táblát minden leütésnél.
 */
export type OffCandidate = {
  code: string;
  name: string;
  brand: string | null;
  kcal_100: number;
  protein_100: number;
  carbs_100: number;
  fat_100: number;
  serving_g: number | null;
  serving_label: string | null;
  image_url: string | null;
};

export type FoodSearchResult = {
  local: Food[];
  off: OffCandidate[];
  /** Az OFF kiesett (rate limit / hálózat) – a helyi találatok akkor is jönnek. */
  offError: string | null;
};

type LookupResponse =
  | { status: 'found'; food: Food; cached?: boolean }
  | { status: 'not_found' }
  | { status: 'off_unavailable'; message: string };

async function invokeLookup<T>(body: Record<string, string>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('food-lookup', { body });
  if (error) throw error;
  if (!data) throw new Error('Üres válasz a food-lookup függvénytől');
  return data;
}

/**
 * Keresés: a saját katalógus MINDIG, az Open Food Facts csak akkor, ha kevés a
 * helyi találat. A döntést az Edge Function hozza meg (ott van a cache is).
 */
export async function searchFoodsRemote(query: string): Promise<FoodSearchResult> {
  const q = query.trim();
  if (q.length < 2) return { local: [], off: [], offError: null };
  return invokeLookup<FoodSearchResult>({ q });
}

/** Vonalkód feloldása: katalógus → Open Food Facts → beírás a katalógusba. */
export async function lookupBarcode(barcode: string): Promise<LookupResponse> {
  return invokeLookup<LookupResponse>({ barcode });
}

/** Egy OFF-találat véglegesítése: bekerül a katalógusba és visszajön `Food`-ként. */
export async function saveOffCandidate(code: string): Promise<Food> {
  const result = await invokeLookup<LookupResponse>({ saveOffCode: code });
  if (result.status === 'found') return result.food;
  if (result.status === 'off_unavailable') throw new Error(result.message);
  throw new Error('A termék már nem érhető el az Open Food Factsben');
}

/**
 * Keresés a közös élelmiszer-katalógusban név és márka szerint.
 * A `foods` táblán pg_trgm GIN index van, így az ILIKE '%…%' indexelt.
 * A verifikált és a pontosabb egyezésű találatok kerülnek előrébb.
 */
export async function searchFoods(query: string, limit = 30): Promise<Food[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const pattern = `%${q}%`;
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .or(`name.ilike.${pattern},brand.ilike.${pattern}`)
    .order('verified', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const lower = q.toLowerCase();
  return (data ?? []).sort((a, b) => {
    const ai = a.name.toLowerCase().indexOf(lower);
    const bi = b.name.toLowerCase().indexOf(lower);
    if (ai !== bi) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    return a.name.length - b.name.length;
  });
}

/**
 * A legutóbb naplózott élelmiszerek – gyorsválasztónak a kereső tetején.
 * Két lekérdezés beágyazott join helyett: a `food_log_entries` → `foods`
 * kapcsolat nincs felvéve a típusokba, és a sorrendet úgyis kliensoldalon
 * tartjuk (a legutóbb használt legyen elöl).
 */
export async function getRecentFoods(userId: string, limit = 8): Promise<Food[]> {
  const { data: rows, error } = await supabase
    .from('food_log_entries')
    .select('food_id')
    .eq('user_id', userId)
    .not('food_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;

  const ids: string[] = [];
  for (const row of rows ?? []) {
    if (row.food_id && !ids.includes(row.food_id)) ids.push(row.food_id);
    if (ids.length >= limit) break;
  }
  if (ids.length === 0) return [];

  const { data: foods, error: foodsError } = await supabase.from('foods').select('*').in('id', ids);
  if (foodsError) throw foodsError;

  const byId = new Map((foods ?? []).map((f) => [f.id, f]));
  return ids.map((id) => byId.get(id)).filter((f): f is Food => f != null);
}

/** Egy katalógus-rekord azonosító alapján – a naplósor szerkesztéséhez. */
export async function getFoodById(id: string): Promise<Food | null> {
  const { data, error } = await supabase.from('foods').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export type UserFoodInput = {
  name: string;
  brand?: string | null;
  kcal_100: number;
  protein_100: number;
  carbs_100: number;
  fat_100: number;
  fiber_100?: number | null;
  sugar_100?: number | null;
  salt_100?: number | null;
  barcode?: string | null;
  serving_g?: number | null;
  serving_label?: string | null;
  source?: 'user' | 'vision';
};

/** Saját élelmiszer felvitele a katalógusba (kézi vagy címkefotóból jóváhagyott). */
export async function createUserFood(input: UserFoodInput): Promise<Food> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nincs bejelentkezve');

  const { data, error } = await supabase
    .from('foods')
    .insert({
      ...input,
      source: input.source ?? 'user',
      created_by: user.id,
      verified: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * A `food-label-vision` Edge Function válasza: egy tápértékcímke-fotó
 * 100 g-ra normalizált elemzése, vagy egy olvashatatlan-jelzés.
 * NEM ment automatikusan – a felhasználó jóváhagyja/javítja, mielőtt
 * `createUserFood`-dal (source: 'vision') bekerülne a katalógusba.
 */
export type LabelVisionResult =
  | {
      status: 'ok';
      name: string | null;
      brand: string | null;
      kcal_100: number;
      protein_100: number;
      carbs_100: number;
      fat_100: number;
      fiber_100: number | null;
      sugar_100: number | null;
      salt_100: number | null;
      serving_g: number | null;
      serving_label: string | null;
    }
  | { status: 'unreadable'; reason: string };

/** Tápértékcímke fotó elemzése a `food-label-vision` Edge Functionnel. */
export async function analyzeLabelPhoto(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png',
): Promise<LabelVisionResult> {
  const { data, error } = await supabase.functions.invoke<LabelVisionResult>('food-label-vision', {
    body: { image_base64: imageBase64, media_type: mediaType },
  });
  if (error) throw error;
  if (!data) throw new Error('Üres válasz a food-label-vision függvénytől');
  return data;
}
