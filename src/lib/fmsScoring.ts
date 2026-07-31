import { FMS_FOCUS_OPTIONS } from './exerciseTaxonomy/constants';
import type { FMSFocusId } from './exerciseTaxonomy/types';
import type { FMSAssessment } from './fms';

/**
 * FMS pontozási szabályok — tiszta logika, se Supabase-, se DOM-függés.
 *
 * Két dolgot köt össze, amit az FMS protokoll megkövetel, de a korábbi
 * implementációból hiányzott:
 *  1. **Oldalankénti mérés**: 5 teszt bal és jobb oldalra külön pontozódik, a
 *     beszámított pont a *gyengébb* oldal. A két oldal eltérése (aszimmetria)
 *     akkor is korrekciós indok, ha a beszámított pont 2 vagy 3.
 *  2. **Clearing (fájdalom) tesztek**: 3 teszthez tartozik egy külön
 *     fájdalomprovokációs teszt; ha az pozitív, az adott teszt pontszáma 0,
 *     függetlenül attól, hogy a mozgást egyébként hibátlanul végrehajtotta.
 */

/** Az oldalanként pontozott (páros) tesztek. */
export const FMS_SIDED_TEST_IDS = [
  'hurdle_step',
  'inline_lunge',
  'shoulder_mobility',
  'active_straight_leg_raise',
  'rotary_stability',
] as const satisfies readonly FMSFocusId[];

export type FMSSidedTestId = (typeof FMS_SIDED_TEST_IDS)[number];

/** A csak egyszer (szimmetrikusan) pontozott tesztek. */
export const FMS_SYMMETRIC_TEST_IDS = [
  'deep_squat',
  'trunk_stability_pushup',
] as const satisfies readonly FMSFocusId[];

export type FMSSymmetricTestId = (typeof FMS_SYMMETRIC_TEST_IDS)[number];

export function isSidedFMSTest(testId: FMSFocusId): testId is FMSSidedTestId {
  return (FMS_SIDED_TEST_IDS as readonly FMSFocusId[]).includes(testId);
}

/** A `_left` / `_right` DB-oszlopnevek tesztenként. */
export type FMSSideColumn<TId extends FMSSidedTestId = FMSSidedTestId> = {
  left: `${TId}_left`;
  right: `${TId}_right`;
};

export const FMS_SIDE_COLUMNS: { [TId in FMSSidedTestId]: FMSSideColumn<TId> } = {
  hurdle_step: { left: 'hurdle_step_left', right: 'hurdle_step_right' },
  inline_lunge: { left: 'inline_lunge_left', right: 'inline_lunge_right' },
  shoulder_mobility: { left: 'shoulder_mobility_left', right: 'shoulder_mobility_right' },
  active_straight_leg_raise: {
    left: 'active_straight_leg_raise_left',
    right: 'active_straight_leg_raise_right',
  },
  rotary_stability: { left: 'rotary_stability_left', right: 'rotary_stability_right' },
};

export type FMSClearingTestId = 'sm_clearing' | 'tspu_clearing' | 'rs_clearing';

export interface FMSClearingTest {
  /** A DB oszlop neve; egyben az azonosító. */
  id: FMSClearingTestId;
  /** Melyik teszt pontszámát nullázza, ha fájdalmas. */
  testId: FMSFocusId;
  label: string;
  /** A teszt végrehajtása — ez jelenik meg a felvevő űrlapon. */
  instruction: string;
}

/**
 * A 3 clearing teszt. Ezek nem kapnak 0–3 pontot: bináris (fájdalmas / nem
 * fájdalmas) kimenetük van, és pozitív esetben a hozzájuk tartozó teszt
 * pontszáma 0 lesz.
 */
export const FMS_CLEARING_TESTS: FMSClearingTest[] = [
  {
    id: 'sm_clearing',
    testId: 'shoulder_mobility',
    label: 'Váll impingement clearing teszt',
    instruction:
      'Tenyér az ellenoldali vállon, majd a könyököt a lehető legmagasabbra emelve. '
      + 'Mindkét oldalon elvégzendő — bármelyik oldalon jelentkező fájdalom pozitív eredmény.',
  },
  {
    id: 'tspu_clearing',
    testId: 'trunk_stability_pushup',
    label: 'Gerinc-extenziós clearing teszt',
    instruction:
      'Hason fekvésből, a kezek váll alatt, tolja fel a felsőtestet nyújtott karra (press-up), '
      + 'a csípő a talajon marad. Hátfájdalom esetén pozitív.',
  },
  {
    id: 'rs_clearing',
    testId: 'rotary_stability',
    label: 'Gerinc-flexiós clearing teszt',
    instruction:
      'Négykézláb helyzetből üljön hátra a sarkára, a mellkast a combhoz, a homlokot a talajhoz '
      + 'közelítve (posterior rocking). Hátfájdalom esetén pozitív.',
  },
];

const CLEARING_TEST_BY_TEST_ID = new Map<FMSFocusId, FMSClearingTest>(
  FMS_CLEARING_TESTS.map(test => [test.testId, test]),
);

/** A teszthez tartozó clearing teszt, vagy null, ha nincs ilyen. */
export function getClearingTestFor(testId: FMSFocusId): FMSClearingTest | null {
  return CLEARING_TEST_BY_TEST_ID.get(testId) ?? null;
}

/** A felvevő űrlap nyers adatai — pontosan ezek kerülnek a DB-be. */
export interface FMSAssessmentDraft {
  deep_squat: number;
  hurdle_step_left: number;
  hurdle_step_right: number;
  inline_lunge_left: number;
  inline_lunge_right: number;
  shoulder_mobility_left: number;
  shoulder_mobility_right: number;
  active_straight_leg_raise_left: number;
  active_straight_leg_raise_right: number;
  trunk_stability_pushup: number;
  rotary_stability_left: number;
  rotary_stability_right: number;
  sm_clearing: boolean;
  tspu_clearing: boolean;
  rs_clearing: boolean;
}

/** A 7 beszámított pontszám (a DB meglévő oszlopai). */
export type FMSResolvedScores = Record<FMSFocusId, number>;

/**
 * Egy oldalanként pontozott teszt beszámított pontja: a gyengébb oldal.
 * Pozitív clearing teszt esetén 0.
 */
export function resolveSidedScore(left: number, right: number, clearingPain = false): number {
  if (clearingPain) return 0;
  return Math.min(left, right);
}

/** Szimmetrikus teszt beszámított pontja — pozitív clearing teszt esetén 0. */
export function resolveSymmetricScore(score: number, clearingPain = false): number {
  return clearingPain ? 0 : score;
}

/** A nyers űrlapadatokból a 7 beszámított pontszám. */
export function resolveFMSScores(draft: FMSAssessmentDraft): FMSResolvedScores {
  return {
    deep_squat: draft.deep_squat,
    hurdle_step: resolveSidedScore(draft.hurdle_step_left, draft.hurdle_step_right),
    inline_lunge: resolveSidedScore(draft.inline_lunge_left, draft.inline_lunge_right),
    shoulder_mobility: resolveSidedScore(
      draft.shoulder_mobility_left,
      draft.shoulder_mobility_right,
      draft.sm_clearing,
    ),
    active_straight_leg_raise: resolveSidedScore(
      draft.active_straight_leg_raise_left,
      draft.active_straight_leg_raise_right,
    ),
    trunk_stability_pushup: resolveSymmetricScore(draft.trunk_stability_pushup, draft.tspu_clearing),
    rotary_stability: resolveSidedScore(
      draft.rotary_stability_left,
      draft.rotary_stability_right,
      draft.rs_clearing,
    ),
  };
}

/** Az összpontszám (0–21) a nyers űrlapadatokból. */
export function calculateFMSTotalScore(draft: FMSAssessmentDraft): number {
  const scores = resolveFMSScores(draft);
  return FMS_FOCUS_OPTIONS.reduce((sum, option) => sum + scores[option.id], 0);
}

/**
 * A DB-be mentendő sor: a nyers oldalankénti értékek, a clearing tesztek és a
 * belőlük levezetett 7 beszámított pontszám együtt. A `total_score` generált
 * oszlop, azt nem küldjük.
 */
export function buildFMSAssessmentPayload(
  draft: FMSAssessmentDraft,
): FMSAssessmentDraft & FMSResolvedScores {
  return { ...draft, ...resolveFMSScores(draft) };
}

export interface FMSSideScores {
  left: number;
  right: number;
}

/**
 * Egy mentett felmérés oldalankénti pontjai. `null`, ha a teszt nem
 * oldalanként pontozott, vagy ha a felmérés még az oldalankénti mérés
 * bevezetése előtt készült.
 */
export function getFMSSideScores(
  assessment: Pick<FMSAssessment, FMSSideColumn['left'] | FMSSideColumn['right']>,
  testId: FMSFocusId,
): FMSSideScores | null {
  if (!isSidedFMSTest(testId)) return null;

  const columns = FMS_SIDE_COLUMNS[testId];
  const left = assessment[columns.left];
  const right = assessment[columns.right];

  if (typeof left !== 'number' || typeof right !== 'number') return null;

  return { left, right };
}

/** Van-e oldalkülönbség. Oldalankénti adat hiányában false. */
export function hasFMSAsymmetry(sides: FMSSideScores | null): boolean {
  return sides !== null && sides.left !== sides.right;
}

/** Fájdalmas volt-e a teszthez tartozó clearing teszt. */
export function isClearingTestPositive(
  assessment: Pick<FMSAssessment, FMSClearingTestId>,
  testId: FMSFocusId,
): boolean {
  const clearingTest = getClearingTestFor(testId);
  return clearingTest ? assessment[clearingTest.id] === true : false;
}

/** A pozitív (fájdalmas) clearing tesztek listája egy mentett felmérésen. */
export function getPositiveClearingTests(
  assessment: Pick<FMSAssessment, FMSClearingTestId>,
): FMSClearingTest[] {
  return FMS_CLEARING_TESTS.filter(test => assessment[test.id] === true);
}
