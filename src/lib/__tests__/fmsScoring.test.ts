import { describe, expect, it } from 'vitest';
import { FMS_FOCUS_OPTIONS } from '@/lib/exerciseTaxonomy/constants';
import {
  FMS_CLEARING_TESTS,
  FMS_SIDED_TEST_IDS,
  FMS_SIDE_COLUMNS,
  FMS_SYMMETRIC_TEST_IDS,
  buildFMSAssessmentPayload,
  calculateFMSTotalScore,
  getClearingTestFor,
  getFMSSideScores,
  getPositiveClearingTests,
  hasFMSAsymmetry,
  isClearingTestPositive,
  isSidedFMSTest,
  resolveFMSScores,
  resolveSidedScore,
  resolveSymmetricScore,
} from '@/lib/fmsScoring';
import {
  FMS_MOVEMENT_STEPS,
  calculatePartialTotalScore,
  isStepComplete,
} from '@/lib/fmsAssessmentForm';
import { makeFMSAssessment, makeFMSDraft, makeSidedFMSAssessment } from './fixtures';

describe('FMS teszttaxonómia', () => {
  it('a 7 teszt pontosan az oldalankénti és a szimmetrikus tesztekre bomlik', () => {
    const covered = [...FMS_SIDED_TEST_IDS, ...FMS_SYMMETRIC_TEST_IDS].sort();

    expect(covered).toEqual(FMS_FOCUS_OPTIONS.map(option => option.id).sort());
  });

  it('öt teszt oldalanként pontozódik, kettő szimmetrikusan', () => {
    expect(FMS_SIDED_TEST_IDS).toHaveLength(5);
    expect(FMS_SYMMETRIC_TEST_IDS).toEqual(['deep_squat', 'trunk_stability_pushup']);
    expect(isSidedFMSTest('shoulder_mobility')).toBe(true);
    expect(isSidedFMSTest('deep_squat')).toBe(false);
  });

  it('minden oldalankénti teszthez tartozik _left és _right oszlop', () => {
    FMS_SIDED_TEST_IDS.forEach(testId => {
      expect(FMS_SIDE_COLUMNS[testId].left).toBe(`${testId}_left`);
      expect(FMS_SIDE_COLUMNS[testId].right).toBe(`${testId}_right`);
    });
  });

  it('három clearing teszt van, mind más mozgásmintához kötve', () => {
    expect(FMS_CLEARING_TESTS.map(test => test.id)).toEqual([
      'sm_clearing',
      'tspu_clearing',
      'rs_clearing',
    ]);
    expect(FMS_CLEARING_TESTS.map(test => test.testId)).toEqual([
      'shoulder_mobility',
      'trunk_stability_pushup',
      'rotary_stability',
    ]);
    expect(getClearingTestFor('deep_squat')).toBeNull();
    expect(getClearingTestFor('rotary_stability')?.id).toBe('rs_clearing');
  });
});

describe('resolveSidedScore', () => {
  it('a gyengébb oldal pontját adja', () => {
    expect(resolveSidedScore(3, 2)).toBe(2);
    expect(resolveSidedScore(1, 3)).toBe(1);
    expect(resolveSidedScore(2, 2)).toBe(2);
  });

  it('pozitív clearing teszt esetén 0, akkor is, ha mindkét oldal hibátlan', () => {
    expect(resolveSidedScore(3, 3, true)).toBe(0);
  });
});

describe('resolveSymmetricScore', () => {
  it('változatlanul hagyja a pontot, ha a clearing teszt negatív', () => {
    expect(resolveSymmetricScore(2)).toBe(2);
    expect(resolveSymmetricScore(3, false)).toBe(3);
  });

  it('pozitív clearing teszt esetén 0', () => {
    expect(resolveSymmetricScore(3, true)).toBe(0);
  });
});

describe('resolveFMSScores', () => {
  it('hibátlan felmérésnél mind a 7 pont 3, az összpontszám 21', () => {
    const draft = makeFMSDraft();

    expect(resolveFMSScores(draft)).toEqual({
      deep_squat: 3,
      hurdle_step: 3,
      inline_lunge: 3,
      shoulder_mobility: 3,
      active_straight_leg_raise: 3,
      trunk_stability_pushup: 3,
      rotary_stability: 3,
    });
    expect(calculateFMSTotalScore(draft)).toBe(21);
  });

  it('mind az öt oldalankénti tesztnél a gyengébb oldal számít be', () => {
    const scores = resolveFMSScores(
      makeFMSDraft({
        hurdle_step_left: 1,
        hurdle_step_right: 3,
        inline_lunge_left: 3,
        inline_lunge_right: 2,
        shoulder_mobility_left: 2,
        shoulder_mobility_right: 3,
        active_straight_leg_raise_left: 3,
        active_straight_leg_raise_right: 1,
        rotary_stability_left: 2,
        rotary_stability_right: 2,
      }),
    );

    expect(scores.hurdle_step).toBe(1);
    expect(scores.inline_lunge).toBe(2);
    expect(scores.shoulder_mobility).toBe(2);
    expect(scores.active_straight_leg_raise).toBe(1);
    expect(scores.rotary_stability).toBe(2);
  });

  it('a clearing teszt csak a saját mozgásmintáját nullázza', () => {
    const scores = resolveFMSScores(makeFMSDraft({ sm_clearing: true }));

    expect(scores.shoulder_mobility).toBe(0);
    expect(scores.trunk_stability_pushup).toBe(3);
    expect(scores.rotary_stability).toBe(3);
    expect(calculateFMSTotalScore(makeFMSDraft({ sm_clearing: true }))).toBe(18);
  });

  it('mindhárom clearing teszt nullázza a hozzá tartozó pontszámot', () => {
    const scores = resolveFMSScores(
      makeFMSDraft({ sm_clearing: true, tspu_clearing: true, rs_clearing: true }),
    );

    expect(scores.shoulder_mobility).toBe(0);
    expect(scores.trunk_stability_pushup).toBe(0);
    expect(scores.rotary_stability).toBe(0);
    // A maradék 4 teszt hibátlan.
    expect(calculateFMSTotalScore(makeFMSDraft({
      sm_clearing: true,
      tspu_clearing: true,
      rs_clearing: true,
    }))).toBe(12);
  });
});

describe('buildFMSAssessmentPayload', () => {
  it('a nyers oldalakat és a levezetett pontszámokat együtt adja vissza', () => {
    const payload = buildFMSAssessmentPayload(
      makeFMSDraft({ hurdle_step_left: 1, hurdle_step_right: 3, rs_clearing: true }),
    );

    // Nyers oldalak megmaradnak — ebből látszik az aszimmetria.
    expect(payload.hurdle_step_left).toBe(1);
    expect(payload.hurdle_step_right).toBe(3);
    // Beszámított pont a gyengébb oldal.
    expect(payload.hurdle_step).toBe(1);
    // A clearing teszt jelzője is bekerül a sorba.
    expect(payload.rs_clearing).toBe(true);
    expect(payload.rotary_stability).toBe(0);
  });

  it('a total_score-t nem küldi (generált DB-oszlop)', () => {
    expect(buildFMSAssessmentPayload(makeFMSDraft())).not.toHaveProperty('total_score');
  });
});

describe('getFMSSideScores / hasFMSAsymmetry', () => {
  it('oldalankénti adattal visszaadja a bal/jobb pontot', () => {
    const assessment = makeSidedFMSAssessment(
      makeFMSDraft({ shoulder_mobility_left: 1, shoulder_mobility_right: 3 }),
    );

    expect(getFMSSideScores(assessment, 'shoulder_mobility')).toEqual({ left: 1, right: 3 });
    expect(hasFMSAsymmetry(getFMSSideScores(assessment, 'shoulder_mobility'))).toBe(true);
  });

  it('azonos oldalaknál nincs aszimmetria', () => {
    const assessment = makeSidedFMSAssessment(makeFMSDraft());

    expect(hasFMSAsymmetry(getFMSSideScores(assessment, 'hurdle_step'))).toBe(false);
  });

  it('szimmetrikus teszthez nincs oldalankénti adat', () => {
    const assessment = makeSidedFMSAssessment(makeFMSDraft());

    expect(getFMSSideScores(assessment, 'deep_squat')).toBeNull();
    expect(getFMSSideScores(assessment, 'trunk_stability_pushup')).toBeNull();
  });

  it('a régi, oldal nélkül rögzített felmérésnél null, nem kitalált érték', () => {
    const legacy = makeFMSAssessment({ hurdle_step: 2 });

    expect(getFMSSideScores(legacy, 'hurdle_step')).toBeNull();
    expect(hasFMSAsymmetry(getFMSSideScores(legacy, 'hurdle_step'))).toBe(false);
  });
});

describe('clearing tesztek visszaolvasása', () => {
  it('a pozitív clearing tesztet a saját mozgásmintájánál jelzi', () => {
    const assessment = makeSidedFMSAssessment(makeFMSDraft({ tspu_clearing: true }));

    expect(isClearingTestPositive(assessment, 'trunk_stability_pushup')).toBe(true);
    expect(isClearingTestPositive(assessment, 'shoulder_mobility')).toBe(false);
    // Clearing teszt nélküli mozgásminta sosem pozitív.
    expect(isClearingTestPositive(assessment, 'deep_squat')).toBe(false);
  });

  it('kigyűjti az összes pozitív clearing tesztet', () => {
    const assessment = makeSidedFMSAssessment(
      makeFMSDraft({ sm_clearing: true, rs_clearing: true }),
    );

    expect(getPositiveClearingTests(assessment).map(test => test.id)).toEqual([
      'sm_clearing',
      'rs_clearing',
    ]);
    expect(getPositiveClearingTests(makeSidedFMSAssessment(makeFMSDraft()))).toEqual([]);
  });
});

describe('FMS_MOVEMENT_STEPS (felvevő űrlap)', () => {
  it('mind a 7 teszthez tartozik lépés, a kanonikus sorrendben', () => {
    expect(FMS_MOVEMENT_STEPS.map(step => step.testId)).toEqual(
      FMS_FOCUS_OPTIONS.map(option => option.id),
    );
  });

  it('az oldalankénti tesztekhez két, a szimmetrikusakhoz egy mező tartozik', () => {
    FMS_MOVEMENT_STEPS.forEach(step => {
      expect(step.scoreFields).toHaveLength(isSidedFMSTest(step.testId) ? 2 : 1);
    });

    const shoulder = FMS_MOVEMENT_STEPS.find(step => step.testId === 'shoulder_mobility')!;
    expect(shoulder.scoreFields.map(field => field.field)).toEqual([
      'shoulder_mobility_left',
      'shoulder_mobility_right',
    ]);
    expect(shoulder.clearingTest?.id).toBe('sm_clearing');
  });

  it('minden lépéshez van magyar label, leírás és végrehajtási instrukció', () => {
    FMS_MOVEMENT_STEPS.forEach(step => {
      expect(step.label.length).toBeGreaterThan(3);
      expect(step.description.length).toBeGreaterThan(20);
      expect(step.instructions.length).toBeGreaterThan(0);
    });
  });
});

describe('isStepComplete / calculatePartialTotalScore', () => {
  const shoulderStep = FMS_MOVEMENT_STEPS.find(step => step.testId === 'shoulder_mobility')!;

  it('egy oldal hiánya még nem teljes lépés', () => {
    expect(isStepComplete(shoulderStep, { shoulder_mobility_left: 3 })).toBe(false);
    expect(isStepComplete(shoulderStep, { shoulder_mobility_left: 3, shoulder_mobility_right: 2 }))
      .toBe(true);
  });

  it('a 0 pont érvényes kitöltés (fájdalom), nem hiányzó érték', () => {
    expect(isStepComplete(shoulderStep, { shoulder_mobility_left: 0, shoulder_mobility_right: 0 }))
      .toBe(true);
  });

  it('a részleges kitöltésből a kész teszteket összegzi', () => {
    expect(
      calculatePartialTotalScore({
        deep_squat: 3,
        hurdle_step_left: 2,
        hurdle_step_right: 1,
        // A többi teszt még üres.
      }),
    ).toBe(4);
  });

  it('a teljesen kitöltött űrlapon ugyanazt adja, mint a végleges számítás', () => {
    const draft = makeFMSDraft({ inline_lunge_left: 1, sm_clearing: true });

    expect(calculatePartialTotalScore(draft)).toBe(calculateFMSTotalScore(draft));
  });
});
