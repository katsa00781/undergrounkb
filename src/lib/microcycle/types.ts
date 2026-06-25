import type { ProgramType, TrainingFocus } from '../workoutGenerator.fixed';
import type {
  PwronProgramType,
  PwronPrescriptionMode,
  PwronSessionVariant,
} from '../pwronWorkoutGenerator';
import type {
  LongevityAgtVariant,
  LongevityModality,
} from '../longevityWorkoutGenerator';

// A microciklus-generálás módjai (a Sablon szándékosan kimarad — nincs heti progressziója).
export type MicrocycleMode = 'periodized' | 'pwron' | 'longevity';

export interface PeriodizedMicrocycleParams {
  mode: 'periodized';
  programType: ProgramType;
  trainingFocus: TrainingFocus;
}

export interface PwronMicrocycleParams {
  mode: 'pwron';
  programType: PwronProgramType;
  prescriptionMode?: PwronPrescriptionMode;
  athleteName?: string;
}

export interface LongevityMicrocycleParams {
  mode: 'longevity';
  agtVariant?: LongevityAgtVariant;
  athleteName?: string;
}

export type MicrocycleParams =
  | PeriodizedMicrocycleParams
  | PwronMicrocycleParams
  | LongevityMicrocycleParams;

export interface MicrocycleRequest {
  userId: string;
  name: string;
  /** A program első edzéshetének kezdő hétfője (YYYY-MM-DD). */
  startDate: string;
  /** Kalendárium-hetek száma (pl. 2, 4, 6). */
  weekCount: number;
  params: MicrocycleParams;
}

// A buildMicrocyclePlan minden session-höz egy kész generátor-hívási leírást ad vissza.
// A diszkriminált union alapján az orchestrátor a megfelelő generátort hívja.
export type SessionGeneratorOptions =
  | {
      kind: 'periodized';
      day: 1 | 2 | 3 | 4;
      programType: ProgramType;
      cycleWeek: 1 | 2 | 3 | 4 | 5 | 6;
      trainingFocus: TrainingFocus;
    }
  | {
      kind: 'pwron';
      programType: PwronProgramType;
      weekNumber: 1 | 2 | 3 | 4 | 5 | 6;
      sessionVariant: PwronSessionVariant;
      prescriptionMode?: PwronPrescriptionMode;
      athleteName?: string;
    }
  | {
      kind: 'longevity';
      weekNumber: 1 | 2 | 3 | 4;
      modality: LongevityModality;
      agtVariant?: LongevityAgtVariant;
      athleteName?: string;
    };

export interface PlannedSession {
  /** Kalendárium-hét sorszáma (1..weekCount). */
  week: number;
  /** A generátor belső hete (clamp után, 1..max). */
  sourceWeek: number;
  /** Emberi olvasható nap/modalitás címke. */
  dayLabel: string;
  /** Konkrét naptári dátum (YYYY-MM-DD). */
  date: string;
  /** Globális sorrend a programon belül (0-tól). */
  sequence: number;
  generator: SessionGeneratorOptions;
}

export interface MicrocyclePlan {
  sessions: PlannedSession[];
  warnings: string[];
}

// A generátorok belső heti maximuma — efölött az utolsó hetet ismételjük.
export const MICROCYCLE_MAX_WEEK: Record<MicrocycleMode, number> = {
  periodized: 6,
  pwron: 6,
  longevity: 4,
};

// Az egyes módoknál felajánlott hétszám-opciók a UI-hoz.
export const MICROCYCLE_WEEK_OPTIONS: Record<MicrocycleMode, number[]> = {
  periodized: [2, 4, 6],
  pwron: [2, 4, 6],
  longevity: [2, 4],
};
