// Kalória- és makrócél számítás – tiszta függvények, Supabase nélkül.
// A bemenet a profilból (magasság, születési dátum, nem) és a legutóbbi
// testsúlymérésből jön.

import type { Food } from './foods';
import type { FoodLogEntry } from './foodLog';

export type Gender = 'male' | 'female';

export type GoalType = 'cut' | 'maintain' | 'bulk';

export const GOAL_TYPES: { key: GoalType; label: string; hint: string; factor: number }[] = [
  { key: 'cut', label: 'Fogyás', hint: '−15%', factor: 0.85 },
  { key: 'maintain', label: 'Fenntartás', hint: '±0%', factor: 1 },
  { key: 'bulk', label: 'Tömeg', hint: '+10%', factor: 1.1 },
];

export const ACTIVITY_LEVELS: { factor: number; label: string; hint: string }[] = [
  { factor: 1.2, label: 'Ülőmunka', hint: 'alig mozgás, nincs edzés' },
  { factor: 1.375, label: 'Enyhén aktív', hint: 'heti 1–3 edzés' },
  { factor: 1.55, label: 'Közepesen aktív', hint: 'heti 3–5 edzés' },
  { factor: 1.725, label: 'Nagyon aktív', hint: 'heti 6–7 edzés' },
];

/** A profilban tárolt szabad szöveges nem normalizálása. */
export function parseGender(raw: string | null | undefined): Gender | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (['male', 'ferfi', 'férfi', 'm', 'man'].includes(v)) return 'male';
  if (['female', 'no', 'nő', 'noi', 'női', 'f', 'woman'].includes(v)) return 'female';
  return null;
}

/** Betöltött életkor az ISO születési dátumból. */
export function ageFromBirthdate(birthdate: string | null | undefined, now = new Date()): number | null {
  if (!birthdate) return null;
  const born = new Date(birthdate);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export type BmrInput = {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: Gender | null;
};

/**
 * Alapanyagcsere Mifflin–St Jeor szerint (kcal/nap).
 * Hiányzó bemenetnél `null` – szándékosan nem tippelünk.
 */
export function mifflinStJeor({ weightKg, heightCm, age, gender }: BmrInput): number | null {
  if (!weightKg || !heightCm || age == null || !gender) return null;
  if (weightKg <= 0 || heightCm <= 0) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/** Melyik bemenet hiányzik a BMR-hez – az oldal ezt mutatja meg a felhasználónak. */
export function missingBmrInputs(input: BmrInput): string[] {
  const missing: string[] = [];
  if (!input.weightKg) missing.push('testsúly');
  if (!input.heightCm) missing.push('magasság');
  if (input.age == null) missing.push('születési dátum');
  if (!input.gender) missing.push('nem');
  return missing;
}

/** Teljes napi energiafelhasználás aktivitási szorzóval. */
export function tdeeFromActivity(bmr: number, activityFactor: number): number {
  return Math.round(bmr * activityFactor);
}

/** TDEE mért aktív kalóriából: alapanyagcsere + a ténylegesen mért aktív kalória. */
export function tdeeFromActiveEnergy(bmr: number, avgActiveKcal: number): number {
  return Math.round(bmr + avgActiveKcal);
}

/** A cél (fogyás / fenntartás / tömeg) alkalmazása a TDEE-re. */
export function applyGoal(tdee: number, goal: GoalType): number {
  const entry = GOAL_TYPES.find((g) => g.key === goal) ?? GOAL_TYPES[1];
  return Math.round(tdee * entry.factor);
}

export type MacroTargets = { protein: number; fat: number; carbs: number };

/**
 * Makrócélok a kalóriakeretből.
 * A fehérje a `lifestyle_settings`-ben beállított sávból jön, a zsír minimum
 * 0,8 g/ttkg, a szénhidrát a maradék.
 */
export function macroTargets(
  kcalGoal: number,
  weightKg: number,
  proteinGoalMin: number,
  proteinGoalMax: number,
): MacroTargets {
  const protein = Math.round((proteinGoalMin + proteinGoalMax) / 2);
  const fat = Math.round(Math.max(0.8 * weightKg, 40));
  const remaining = kcalGoal - protein * 4 - fat * 9;
  const carbs = Math.max(0, Math.round(remaining / 4));
  return { protein, fat, carbs };
}

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

export const EMPTY_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** Egy élelmiszer tápértéke adott grammra vetítve. */
export function scaleFood(food: Food, grams: number): Macros {
  const k = grams / 100;
  return {
    kcal: round1(food.kcal_100 * k),
    protein: round1(food.protein_100 * k),
    carbs: round1(food.carbs_100 * k),
    fat: round1(food.fat_100 * k),
  };
}

/** Makrók arányos átskálázása – recept-adagra és naplósor-módosításra. */
export function scaleMacros(macros: Macros, factor: number): Macros {
  return {
    kcal: round1(macros.kcal * factor),
    protein: round1(macros.protein * factor),
    carbs: round1(macros.carbs * factor),
    fat: round1(macros.fat * factor),
  };
}

/** Makrók összeadása – recept hozzávalóinak összesítéséhez. */
export function sumMacros(list: Macros[]): Macros {
  return list.reduce<Macros>(
    (sum, m) => ({
      kcal: round1(sum.kcal + m.kcal),
      protein: round1(sum.protein + m.protein),
      carbs: round1(sum.carbs + m.carbs),
      fat: round1(sum.fat + m.fat),
    }),
    { ...EMPTY_MACROS },
  );
}

/** Napló-bejegyzések összegzése. */
export function entryTotals(entries: FoodLogEntry[]): Macros {
  return entries.reduce<Macros>(
    (sum, e) => ({
      kcal: sum.kcal + e.kcal,
      protein: sum.protein + e.protein,
      carbs: sum.carbs + e.carbs,
      fat: sum.fat + e.fat,
    }),
    { ...EMPTY_MACROS },
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
