import type { FMSFocusId } from '../exerciseTaxonomy/types';
import type { FMSCorrectionGroup } from '../workoutGenerator/fmsCorrections';

/** Az összpontszám alapján feloldott értelmezési sáv. */
export type FMSScoreBandId = 'good' | 'acceptable' | 'poor';

export interface FMSScoreBand {
  id: FMSScoreBandId;
  /** Inkluzív határok az összpontszámra (0–21). */
  min: number;
  max: number;
  label: string;
  /** Egy mondatos magyar összefoglaló a riport tetejére. */
  summary: string;
}

/** Egy teszt sora a riportban. */
export interface FMSReportRow {
  testId: FMSFocusId;
  label: string;
  score: number;
  description: string;
  /** 0 = fájdalom, 1 = nem tudja végrehajtani, 2 = kompenzációval, 3 = tiszta. */
  scoreLabel: string;
}

export interface FMSReportInput {
  assessment: import('../fms').FMSAssessment;
  /** A felmért személy megjelenített neve (a dialógusban felülírható). */
  clientName: string;
  clientEmail: string | null;
  /** Az edző neve a riport láblécébe. */
  trainerName: string | null;
}

export interface FMSReportModel {
  assessmentId: string;
  userId: string;
  clientName: string;
  clientEmail: string | null;
  trainerName: string | null;
  /** ISO dátum (YYYY-MM-DD). */
  assessmentDate: string;
  rows: FMSReportRow[];
  totalScore: number;
  maxScore: number;
  band: FMSScoreBand;
  corrections: FMSCorrectionGroup[];
  /** Bármelyik teszt 0 pont = fájdalom → orvosi kivizsgálás javasolt. */
  hasPainFlag: boolean;
  notes: string | null;
}
