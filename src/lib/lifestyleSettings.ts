import type { GoalType } from './nutritionTargets';

/**
 * A `lifestyle_settings` sor közös a mobil appal (Underground KB Mobile). A web
 * ebből csak a kalória-kalkulátor mezőit írja; a többi (műszakrend, étkezési
 * ablakok, napi végrehajtás feladatlista, napirend) a mobil tulajdona, és a webes
 * mentés SOHA nem írhatja felül — különben a mobilon szerkesztett feladatlista
 * vagy napirend NULL-ra / `{}`-ra állna vissza.
 */

/** A web által írható mezők — a `upsertNutritionGoals` payloadja csak ezeket viheti. */
export const NUTRITION_GOAL_FIELDS = [
  'kcal_goal',
  'carbs_goal_g',
  'fat_goal_g',
  'activity_factor',
  'goal_type',
] as const;

export type NutritionGoalField = (typeof NUTRITION_GOAL_FIELDS)[number];

export type NutritionGoalsPatch = {
  kcal_goal?: number | null;
  carbs_goal_g?: number | null;
  fat_goal_g?: number | null;
  activity_factor?: number;
  goal_type?: GoalType;
};

/**
 * Upsert-payload a kalóriacél mentéséhez: kizárólag a whitelistelt mezők (és
 * csak a ténylegesen megadottak). A PostgREST upsert ütközéskor csak a payloadban
 * szereplő oszlopokat frissíti, így a mobil mezői érintetlenek maradnak.
 */
export function buildNutritionGoalsPayload(
  userId: string,
  patch: NutritionGoalsPatch,
  now: Date = new Date(),
): { user_id: string; updated_at: string } & NutritionGoalsPatch {
  const payload: { user_id: string; updated_at: string } & NutritionGoalsPatch = {
    user_id: userId,
    updated_at: now.toISOString(),
  };
  const source = patch as Record<string, unknown>;
  const target = payload as Record<string, unknown>;
  for (const field of NUTRITION_GOAL_FIELDS) {
    if (source[field] !== undefined) target[field] = source[field];
  }
  return payload;
}

// --- Mobil által kezelt mezők alakja (csak olvasásra a weben) ---

/** `lifestyle_settings.checklist_items` egy eleme. `icon` = Ionicons név (pl. `walk-outline`). */
export type ChecklistItem = { key: string; label: string; icon: string };

/**
 * Megjelenítendő feladat. Az alap lista ikonjait a mobil a saját kódjában tartja
 * (a DB-ben nincsenek), ezért ott `icon = null`; a web úgysem rendereli az Ionicons-t.
 */
export type ResolvedChecklistItem = { key: string; label: string; icon: string | null };

/** Az alapértelmezett 5 feladat — ez érvényes, ha a `checklist_items` NULL. */
export const DEFAULT_CHECKLIST_ITEMS: readonly ResolvedChecklistItem[] = [
  { key: 'ate_in_window', label: 'Az ablakban ettem', icon: null },
  { key: 'protein_hit', label: 'Megvolt a fehérje (150–170 g)', icon: null },
  { key: 'trained', label: 'Edzettem / mozogtam', icon: null },
  { key: 'walked', label: 'Séta / lépésszám megvolt', icon: null },
  { key: 'slept_well', label: 'Eleget aludtam', icon: null },
];

function isChecklistItem(value: unknown): value is ChecklistItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.key === 'string' && typeof v.label === 'string' && typeof v.icon === 'string';
}

/**
 * A megjelenítendő feladatlista: NULL (vagy nem tömb) → alap lista; tömb → annak
 * érvényes elemei a megadott sorrendben. Az üres tömb szándékosan üres listát jelent.
 * A `daily_logs.checklist` pipái ezekre a `key`-ekre vonatkoznak; a listából törölt
 * feladat régi pipái megmaradnak a naplóban, csak nem jelennek meg.
 */
export function resolveChecklistItems(raw: unknown): ResolvedChecklistItem[] {
  if (!Array.isArray(raw)) return DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item }));
  return raw.filter(isChecklistItem).map(({ key, label, icon }) => ({ key, label, icon }));
}

export type ShiftKey = 'reggeles' | 'delutanos' | 'ejszakas' | 'pihenonap';

/** `lifestyle_settings.schedule_entries[shift]` egy tétele. Az időpontok "HH:MM" formájúak. */
export type ScheduleEntry = {
  id: string;
  activity: string;
  start: string;
  end?: string;
  approx?: boolean;
};

/** `lifestyle_settings.schedule_entries` — csak a sablontól eltérő műszakok kulcsa szerepel. */
export type ScheduleEntries = Partial<Record<ShiftKey, ScheduleEntry[]>>;
