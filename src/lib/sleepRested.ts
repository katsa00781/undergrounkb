// Szubjektív kipihentség (1–5) a `daily_logs.sleep_rested` mezőben — a mobil app
// „Mai nap” képernyőjén a felhasználó adja meg, a HealthKit-szinkron nem írja felül.
// A szabályok a mobil app (Underground KB Mobile) logikáját követik; a web csak olvassa.

export type SleepRestedTone = 'low' | 'mid' | 'high';

/** Rossz éjszaka a kipihentség alapján: ennél nem nagyobb érték (mobil: `RESTED_LOW`). */
export const RESTED_LOW = 2;
/** Rossz éjszaka az alvás-pontszám alapján: ennél kisebb pontszám. */
export const SLEEP_SCORE_LOW = 55;

const RESTED_LABELS: Record<number, string> = {
  1: 'nagyon fáradt',
  2: 'fáradt',
  3: 'közepes',
  4: 'kipihent',
  5: 'teljesen kipihent',
};

const isValidRested = (value: number | null | undefined): value is number =>
  value != null && Number.isInteger(value) && value >= 1 && value <= 5;

/** Szöveges címke, pl. „fáradt”; `null`, ha nincs (érvényes) érték. */
export function sleepRestedLabel(value: number | null | undefined): string | null {
  return isValidRested(value) ? RESTED_LABELS[value] : null;
}

/** Megjelenítési szöveg, pl. „Kipihentség: 2/5 · fáradt”; `null`, ha nincs kitöltve. */
export function formatSleepRested(value: number | null | undefined): string | null {
  return isValidRested(value) ? `Kipihentség: ${value}/5 · ${RESTED_LABELS[value]}` : null;
}

/** Színezési sáv: 1–2 alacsony, 3 közepes, 4–5 magas. */
export function sleepRestedTone(value: number | null | undefined): SleepRestedTone | null {
  if (!isValidRested(value)) return null;
  if (value <= RESTED_LOW) return 'low';
  return value === 3 ? 'mid' : 'high';
}

/** Rossz éjszaka = `sleep_score < 55` VAGY `sleep_rested <= 2` (a mobil mintafelismerésével azonos). */
export function isPoorSleepNight(log: { sleep_score: number | null; sleep_rested: number | null }): boolean {
  const lowScore = log.sleep_score != null && log.sleep_score < SLEEP_SCORE_LOW;
  const lowRested = isValidRested(log.sleep_rested) && log.sleep_rested <= RESTED_LOW;
  return lowScore || lowRested;
}

/** Eltérés: jó pontszám (legalább ennyi) mellett alacsony kipihentség. */
export const SLEEP_SCORE_GOOD = 70;

export type SleepLogLike = { sleep_score: number | null; sleep_rested: number | null };

/** Jó pontszám mellett is fáradt éjszaka: `sleep_score >= 70` ÉS `sleep_rested <= 2`. */
export function isSleepMismatch(log: SleepLogLike): boolean {
  return (
    log.sleep_score != null &&
    log.sleep_score >= SLEEP_SCORE_GOOD &&
    isValidRested(log.sleep_rested) &&
    log.sleep_rested <= RESTED_LOW
  );
}

export type ShiftKey = 'reggeles' | 'delutanos' | 'ejszakas' | 'pihenonap';

/** A mobil `daily_logs.shift_key` értékei megjelenítési sorrendben. */
export const SHIFT_ORDER: readonly ShiftKey[] = ['reggeles', 'delutanos', 'ejszakas', 'pihenonap'];

const SHIFT_LABELS: Record<ShiftKey, string> = {
  reggeles: 'Reggeles',
  delutanos: 'Délutános',
  ejszakas: 'Éjszakás',
  pihenonap: 'Pihenőnap',
};

const isShiftKey = (value: string | null | undefined): value is ShiftKey =>
  value != null && (SHIFT_ORDER as readonly string[]).includes(value);

/** Műszak-címke; ismeretlen vagy hiányzó kulcsra „Nincs megadva”. */
export function shiftLabel(key: string | null | undefined): string {
  return isShiftKey(key) ? SHIFT_LABELS[key] : 'Nincs megadva';
}

const average = (values: number[]): number | null =>
  values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

const roundTo = (value: number | null, decimals: number): number | null =>
  value == null ? null : Math.round(value * 10 ** decimals) / 10 ** decimals;

export interface SleepShiftSummary {
  /** `null` = nincs megadva (vagy ismeretlen) műszak. */
  shiftKey: ShiftKey | null;
  label: string;
  /** Éjszakák száma — csak a kitöltött kipihentségűek. */
  nights: number;
  /** Átlagos kipihentség, 1 tizedesre kerekítve. */
  avgRested: number;
  /** Átlagos alvás-pontszám egészre kerekítve (a pontszámos éjszakákból); `null`, ha egyiknél sincs. */
  avgScore: number | null;
  /** Jó pontszám mellett fáradt éjszakák száma (`isSleepMismatch`). */
  mismatches: number;
}

/**
 * Kipihentség műszakonként (a mobil Fejlődés tabjával azonos): csak a `sleep_rested IS NOT NULL`
 * éjszakák számítanak; az üres csoportok kimaradnak, a sorrend `SHIFT_ORDER`, végül a „Nincs megadva”.
 */
export function summarizeSleepByShift(
  logs: (SleepLogLike & { shift_key: string | null })[],
): SleepShiftSummary[] {
  const groups = new Map<ShiftKey | null, SleepLogLike[]>();
  for (const log of logs) {
    if (!isValidRested(log.sleep_rested)) continue;
    const key = isShiftKey(log.shift_key) ? log.shift_key : null;
    const group = groups.get(key) ?? [];
    group.push(log);
    groups.set(key, group);
  }

  return [...SHIFT_ORDER, null].flatMap((key) => {
    const group = groups.get(key);
    if (!group) return [];
    const scores = group.map((l) => l.sleep_score).filter((s): s is number => s != null);
    return [
      {
        shiftKey: key,
        label: shiftLabel(key),
        nights: group.length,
        avgRested: roundTo(average(group.map((l) => l.sleep_rested as number)), 1) as number,
        avgScore: roundTo(average(scores), 0),
        mismatches: group.filter(isSleepMismatch).length,
      },
    ];
  });
}

export interface SleepTrendSummary {
  /** Éjszakák, amelyeknél van pontszám vagy kipihentség. */
  nights: number;
  /** Rossz éjszakák (`isPoorSleepNight`). */
  poorNights: number;
  avgScore: number | null;
  avgRested: number | null;
}

/** Időszak-összesítés az alvás-trendhez. */
export function summarizeSleepTrend(logs: SleepLogLike[]): SleepTrendSummary {
  const nights = logs.filter((l) => l.sleep_score != null || isValidRested(l.sleep_rested));
  const scores = nights.map((l) => l.sleep_score).filter((s): s is number => s != null);
  const rested = nights.map((l) => l.sleep_rested).filter(isValidRested);
  return {
    nights: nights.length,
    poorNights: nights.filter(isPoorSleepNight).length,
    avgScore: roundTo(average(scores), 0),
    avgRested: roundTo(average(rested), 1),
  };
}
