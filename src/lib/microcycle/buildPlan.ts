import {
  MICROCYCLE_MAX_WEEK,
  MicrocyclePlan,
  MicrocycleRequest,
  PlannedSession,
  SessionGeneratorOptions,
} from './types';
import type { ProgramType, TrainingFocus } from '../workoutGenerator.fixed';
import type { PwronProgramType, PwronSessionVariant } from '../pwronWorkoutGenerator';
import type { LongevityAgtVariant, LongevityModality } from '../longevityWorkoutGenerator';

/** YYYY-MM-DD + n nap, TZ-független (UTC). */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day);
  const result = new Date(base + days * 24 * 60 * 60 * 1000);
  return result.toISOString().split('T')[0];
}

type DayTemplate = {
  /** Eltolás a hét kezdő hétfőjéhez képest (0 = hétfő). */
  weekdayOffset: number;
  dayLabel: string;
  buildGenerator: (sourceWeek: number) => SessionGeneratorOptions;
};

const PERIODIZED_DAY_COUNT: Record<ProgramType, 2 | 3 | 4> = {
  '2napos': 2,
  '3napos': 3,
  '4napos': 4,
};

// Edzésnap → hétköznap-eltolás programtípusonként.
const PERIODIZED_WEEKDAY_OFFSETS: Record<ProgramType, number[]> = {
  '2napos': [0, 3], // Hétfő, Csütörtök
  '3napos': [0, 2, 4], // Hétfő, Szerda, Péntek
  '4napos': [0, 1, 3, 4], // Hétfő, Kedd, Csütörtök, Péntek
};

const PWRON_VARIANT_OFFSETS: Array<{ variant: PwronSessionVariant; weekdayOffset: number }> = [
  { variant: 'A', weekdayOffset: 0 }, // Hétfő
  { variant: 'B', weekdayOffset: 3 }, // Csütörtök
];

const LONGEVITY_DAYS: Array<{
  modality: LongevityModality;
  weekdayOffset: number;
  dayLabel: string;
}> = [
  { modality: 'STRENGTH', weekdayOffset: 0, dayLabel: 'Hétfő – Erőfejlesztés' },
  { modality: 'STATO_DYNAMIC', weekdayOffset: 2, dayLabel: 'Szerda – Stato-dinamikus' },
  { modality: 'AGT', weekdayOffset: 4, dayLabel: 'Péntek – AGT' },
];

function buildDayTemplates(req: MicrocycleRequest): DayTemplate[] {
  const { params } = req;

  if (params.mode === 'periodized') {
    const programType = params.programType;
    const dayCount = PERIODIZED_DAY_COUNT[programType];
    const offsets = PERIODIZED_WEEKDAY_OFFSETS[programType];
    const trainingFocus: TrainingFocus = params.trainingFocus;

    return Array.from({ length: dayCount }, (_, index) => {
      const day = (index + 1) as 1 | 2 | 3 | 4;
      return {
        weekdayOffset: offsets[index],
        dayLabel: `Nap ${day}`,
        buildGenerator: (sourceWeek: number): SessionGeneratorOptions => ({
          kind: 'periodized',
          day,
          programType,
          cycleWeek: sourceWeek as 1 | 2 | 3 | 4 | 5 | 6,
          trainingFocus,
        }),
      };
    });
  }

  if (params.mode === 'pwron') {
    const programType: PwronProgramType = params.programType;
    return PWRON_VARIANT_OFFSETS.map(({ variant, weekdayOffset }) => ({
      weekdayOffset,
      dayLabel: `${variant} variáns`,
      buildGenerator: (sourceWeek: number): SessionGeneratorOptions => ({
        kind: 'pwron',
        programType,
        weekNumber: sourceWeek as 1 | 2 | 3 | 4 | 5 | 6,
        sessionVariant: variant,
        prescriptionMode: params.prescriptionMode,
        athleteName: params.athleteName,
      }),
    }));
  }

  // longevity
  const agtVariant: LongevityAgtVariant | undefined = params.agtVariant;
  return LONGEVITY_DAYS.map(({ modality, weekdayOffset, dayLabel }) => ({
    weekdayOffset,
    dayLabel,
    buildGenerator: (sourceWeek: number): SessionGeneratorOptions => ({
      kind: 'longevity',
      weekNumber: sourceWeek as 1 | 2 | 3 | 4,
      modality,
      agtVariant,
      athleteName: params.athleteName,
    }),
  }));
}

/**
 * Tiszta tervező-logika: a kérésből kiszámolja az összes session-t
 * (hetek × edzésnapok), dátumozással és a generátor belső heti maximumára
 * történő clamp-pel. DB-t nem érint, így unit-tesztelhető.
 */
export function buildMicrocyclePlan(req: MicrocycleRequest): MicrocyclePlan {
  const warnings: string[] = [];
  const maxWeek = MICROCYCLE_MAX_WEEK[req.params.mode];
  const dayTemplates = buildDayTemplates(req);
  const sessions: PlannedSession[] = [];

  if (req.weekCount > maxWeek) {
    warnings.push(
      `A választott ${req.weekCount} hét meghaladja a(z) ${req.params.mode} generátor ${maxWeek} hetes ` +
        `progresszióját — a ${maxWeek}. hét utáni hetek a ${maxWeek}. hét terhelését ismétlik.`,
    );
  }

  let sequence = 0;
  for (let week = 1; week <= req.weekCount; week += 1) {
    const sourceWeek = Math.min(week, maxWeek);
    for (const template of dayTemplates) {
      const date = addDays(req.startDate, (week - 1) * 7 + template.weekdayOffset);
      sessions.push({
        week,
        sourceWeek,
        dayLabel: template.dayLabel,
        date,
        sequence,
        generator: template.buildGenerator(sourceWeek),
      });
      sequence += 1;
    }
  }

  return { sessions, warnings };
}
