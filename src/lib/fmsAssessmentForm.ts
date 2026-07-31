import { z } from 'zod';
import { FMS_FOCUS_OPTIONS } from './exerciseTaxonomy/constants';
import { getFMSFocusLabel } from './exerciseTaxonomy/metadata';
import type { FMSFocusId } from './exerciseTaxonomy/types';
import { FMS_TEST_DESCRIPTIONS } from './fmsReport/constants';
import {
  FMS_SIDE_COLUMNS,
  getClearingTestFor,
  isSidedFMSTest,
  type FMSAssessmentDraft,
  type FMSClearingTest,
} from './fmsScoring';

/**
 * Az FMS felvevő űrlap tiszta rétege: lépésdefiníciók, séma és a nyers
 * draft-tá alakítás. A React oldal (`pages/FMSAssessment.tsx`) csak megjeleníti.
 */

/** A pontszám-mezők neve a nyers draftban (a `_left`/`_right` oszlopokkal együtt). */
export type FMSScoreField = keyof Omit<
  FMSAssessmentDraft,
  'sm_clearing' | 'tspu_clearing' | 'rs_clearing'
>;

export interface FMSMovementStep {
  testId: FMSFocusId;
  label: string;
  description: string;
  instructions: string[];
  /**
   * Oldalanként pontozott teszt esetén a bal/jobb mezők, egyébként az egyetlen
   * pontszámmező. A UI ebből tudja, hány pontszámválasztót kell kirajzolnia.
   */
  scoreFields: { side: 'left' | 'right' | 'both'; field: FMSScoreField }[];
  /** A teszthez tartozó clearing (fájdalom) teszt, ha van. */
  clearingTest: FMSClearingTest | null;
}

/** Magyar végrehajtási instrukciók tesztenként. */
const FMS_MOVEMENT_INSTRUCTIONS: Record<FMSFocusId, string[]> = {
  deep_squat: [
    'Állj vállszélességű terpeszbe, lábfejek előre néznek.',
    'A botot tartsd széles fogással a fej fölött, nyújtott karral.',
    'Guggolj olyan mélyre, amennyire tudsz, a sarkak maradjanak a talajon.',
    'A törzs maradjon egyenes, a bot a fej vonala fölött.',
  ],
  hurdle_step: [
    'A bot a vállakon, a lábfejek a léc alatti vonalnál.',
    'Lépj át a lécen az egyik lábbal, a sarok érintse a talajt, majd térj vissza.',
    'A csípő maradjon vízszintes, a törzs függőleges.',
    'Mindkét oldalt külön pontozd — az átlépő láb oldala számít.',
  ],
  inline_lunge: [
    'A lábak egy vonalban a mérőléc mentén, a bot a hát mögött három ponton.',
    'Ereszd le a hátsó térdet a lécig, majd told vissza magad.',
    'A törzs maradjon függőleges, a bot végig érintse a hátat.',
    'Mindkét oldalt külön pontozd — az elöl lévő láb oldala számít.',
  ],
  shoulder_mobility: [
    'Mindkét kézen zárt ököl, a hüvelykujj az ujjakon belül.',
    'Az egyik ököl felülről a tarkó mögé, a másik alulról a hát mögé.',
    'Egyetlen, folyamatos mozdulattal, lendítés nélkül.',
    'Mérd meg az öklök távolságát, és mindkét oldalt külön pontozd.',
  ],
  active_straight_leg_raise: [
    'Hanyatt fekvés, nyújtott lábak, a karok a test mellett.',
    'Emeld az egyik lábat nyújtva, ameddig tudod.',
    'A másik láb és a medence maradjon a talajon.',
    'Mindkét oldalt külön pontozd — az emelt láb oldala számít.',
  ],
  trunk_stability_pushup: [
    'Hason fekvés, a kezek a protokoll szerinti magasságban.',
    'Told fel magad egyetlen egységként, a test ne törjön meg.',
    'A derék ne essen be, a csípő ne emelkedjen meg előbb.',
    'Ez a teszt nem oldalanként pontozódik.',
  ],
  rotary_stability: [
    'Négykézláb helyzet, a kezek a váll, a térdek a csípő alatt.',
    'Nyújtsd ki az azonos oldali kart és lábat, majd húzd össze a könyököt a térddel.',
    'A törzs maradjon stabil, a medence ne forduljon el.',
    'Mindkét oldalt külön pontozd.',
  ],
};

/** A felvevő űrlap lépései, a kanonikus tesztsorrendben. */
export const FMS_MOVEMENT_STEPS: FMSMovementStep[] = FMS_FOCUS_OPTIONS.map(option => {
  const testId = option.id;

  const scoreFields: FMSMovementStep['scoreFields'] = isSidedFMSTest(testId)
    ? [
        { side: 'left', field: FMS_SIDE_COLUMNS[testId].left },
        { side: 'right', field: FMS_SIDE_COLUMNS[testId].right },
      ]
    : [{ side: 'both', field: testId as FMSScoreField }];

  return {
    testId,
    label: getFMSFocusLabel(testId) ?? testId,
    description: FMS_TEST_DESCRIPTIONS[testId],
    instructions: FMS_MOVEMENT_INSTRUCTIONS[testId],
    scoreFields,
    clearingTest: getClearingTestFor(testId),
  };
});

const scoreField = z
  .number({
    required_error: 'Kérlek válassz pontszámot',
    invalid_type_error: 'Kérlek válassz pontszámot',
  })
  .int()
  .min(0, 'A pontszám 0 és 3 közötti lehet')
  .max(3, 'A pontszám 0 és 3 közötti lehet');

export const fmsAssessmentSchema = z.object({
  manualGuestId: z.string().min(1, 'Kérlek válassz egy vendéget'),
  linkedUserId: z.string().min(1, 'Kérlek válassz adatbázisos FMS alanyt'),
  deep_squat: scoreField,
  hurdle_step_left: scoreField,
  hurdle_step_right: scoreField,
  inline_lunge_left: scoreField,
  inline_lunge_right: scoreField,
  shoulder_mobility_left: scoreField,
  shoulder_mobility_right: scoreField,
  active_straight_leg_raise_left: scoreField,
  active_straight_leg_raise_right: scoreField,
  trunk_stability_pushup: scoreField,
  rotary_stability_left: scoreField,
  rotary_stability_right: scoreField,
  sm_clearing: z.boolean(),
  tspu_clearing: z.boolean(),
  rs_clearing: z.boolean(),
  notes: z.string().optional(),
});

export type FMSAssessmentFormValues = z.infer<typeof fmsAssessmentSchema>;

/**
 * Kezdőérték. A pontszámok **szándékosan** üresen (undefined) indulnak: a 0 az
 * FMS-ben „fájdalom", azt véletlenül nem szabad elmenteni. A clearing tesztek
 * viszont alapból negatívak (nincs fájdalom).
 */
export const FMS_EMPTY_FORM_VALUES = {
  manualGuestId: '',
  linkedUserId: '',
  deep_squat: undefined,
  hurdle_step_left: undefined,
  hurdle_step_right: undefined,
  inline_lunge_left: undefined,
  inline_lunge_right: undefined,
  shoulder_mobility_left: undefined,
  shoulder_mobility_right: undefined,
  active_straight_leg_raise_left: undefined,
  active_straight_leg_raise_right: undefined,
  trunk_stability_pushup: undefined,
  rotary_stability_left: undefined,
  rotary_stability_right: undefined,
  sm_clearing: false,
  tspu_clearing: false,
  rs_clearing: false,
  notes: '',
} satisfies Partial<Record<keyof FMSAssessmentFormValues, unknown>>;

/** Az űrlapértékekből a DB-be menő nyers draft (a vendégválasztó mezők nélkül). */
export function toFMSAssessmentDraft(values: FMSAssessmentFormValues): FMSAssessmentDraft {
  return {
    deep_squat: values.deep_squat,
    hurdle_step_left: values.hurdle_step_left,
    hurdle_step_right: values.hurdle_step_right,
    inline_lunge_left: values.inline_lunge_left,
    inline_lunge_right: values.inline_lunge_right,
    shoulder_mobility_left: values.shoulder_mobility_left,
    shoulder_mobility_right: values.shoulder_mobility_right,
    active_straight_leg_raise_left: values.active_straight_leg_raise_left,
    active_straight_leg_raise_right: values.active_straight_leg_raise_right,
    trunk_stability_pushup: values.trunk_stability_pushup,
    rotary_stability_left: values.rotary_stability_left,
    rotary_stability_right: values.rotary_stability_right,
    sm_clearing: values.sm_clearing,
    tspu_clearing: values.tspu_clearing,
    rs_clearing: values.rs_clearing,
  };
}

/**
 * Részlegesen kitöltött űrlapból is számol összpontszámot: a még ki nem
 * töltött teszteket 0-nak veszi, hogy a fejlécben látszódjon a haladás.
 */
export function calculatePartialTotalScore(
  values: Partial<Record<FMSScoreField, number | undefined>> & {
    sm_clearing?: boolean;
    tspu_clearing?: boolean;
    rs_clearing?: boolean;
  },
): number {
  return FMS_MOVEMENT_STEPS.reduce((total, step) => {
    const clearingPain = step.clearingTest ? values[step.clearingTest.id] === true : false;
    if (clearingPain) return total;

    const scores = step.scoreFields.map(({ field }) => values[field]);
    if (scores.some(score => typeof score !== 'number')) return total;

    return total + Math.min(...(scores as number[]));
  }, 0);
}

/** Ki van-e töltve a lépés minden pontszáma. */
export function isStepComplete(
  step: FMSMovementStep,
  values: Partial<Record<FMSScoreField, number | undefined>>,
): boolean {
  return step.scoreFields.every(({ field }) => typeof values[field] === 'number');
}
