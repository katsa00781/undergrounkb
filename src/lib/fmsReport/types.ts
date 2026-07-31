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

/**
 * A riport tényleges értékelése. Nem azonos a pontsávval: a 0/1 pontos
 * mozgásminták és az oldalkülönbség az összpontszámtól függetlenül rontják.
 */
export type FMSRiskLevelId = 'ready' | 'corrective' | 'restricted';

export interface FMSRiskLevel {
  id: FMSRiskLevelId;
  label: string;
  /** A riport fejlécébe kerülő összegzés. */
  summary: string;
}

export interface FMSRiskAssessment extends FMSRiskLevel {
  /** Miért ez a szint — konkrét, a részletes táblával egyező megállapítások. */
  reasons: string[];
}

/** Egy teszt sora a riportban. */
export interface FMSReportRow {
  testId: FMSFocusId;
  label: string;
  /** A beszámított pont: oldalankénti teszteknél a gyengébb oldal. */
  score: number;
  description: string;
  /** 0 = fájdalom, 1 = nem tudja végrehajtani, 2 = kompenzációval, 3 = tiszta. */
  scoreLabel: string;
  /**
   * A nyers oldalankénti pontok. `null`, ha a teszt nem oldalanként pontozott,
   * vagy ha a felmérés még az oldalankénti mérés bevezetése előtt készült.
   */
  sides: import('../fmsScoring').FMSSideScores | null;
  /** A két oldal eltér — önmagában is korrekciós indok. */
  hasAsymmetry: boolean;
  /** A teszthez tartozó clearing teszt, ha van ilyen. */
  clearingTest: import('../fmsScoring').FMSClearingTest | null;
  /** Fájdalmas volt-e a clearing teszt (ilyenkor a pontszám kötelezően 0). */
  clearingPain: boolean;
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
  /** A puszta pontsáv. Csak numerikus kontextus — az értékelést a `risk` mondja ki. */
  band: FMSScoreBand;
  /** A riport szöveges értékelése (pontsáv + fájdalom + gyenge minta + aszimmetria). */
  risk: FMSRiskAssessment;
  corrections: FMSCorrectionGroup[];
  /** Bármelyik teszt 0 pont = fájdalom → orvosi kivizsgálás javasolt. */
  hasPainFlag: boolean;
  /** A pozitív (fájdalmas) clearing tesztek — a riportban külön kiemelve. */
  positiveClearingTests: import('../fmsScoring').FMSClearingTest[];
  /** Van-e olyan teszt, ahol a két oldal pontszáma eltér. */
  asymmetricRows: FMSReportRow[];
  notes: string | null;
}
