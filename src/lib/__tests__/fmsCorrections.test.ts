import { describe, it, expect } from 'vitest';
import {
  FMS_CORRECTION_EXERCISES,
  FMS_CORRECTION_MODALITY_ORDER,
  FMS_CORRECTION_NAMES,
  getFMSCorrectionsForAssessment,
  identifyFMSCorrections,
} from '../workoutGenerator/fmsCorrections';
import { FMS_TEST_ORDER } from '../fmsReport/constants';
import { makeFMSAssessment } from './fixtures';

describe('FMS_CORRECTION_EXERCISES', () => {
  it('mind a 7 mozgásmintához tartozik korrekciós blokk', () => {
    expect(Object.keys(FMS_CORRECTION_EXERCISES).sort()).toEqual([...FMS_TEST_ORDER].sort());
  });

  it('csak SMR, FMS szalag, saját testsúlyos és kettlebell gyakorlatokat tartalmaz', () => {
    const modalities = FMS_TEST_ORDER.flatMap(testId =>
      FMS_CORRECTION_EXERCISES[testId].map(exercise => exercise.modality),
    );

    expect(new Set(modalities)).toEqual(new Set(FMS_CORRECTION_MODALITY_ORDER));
  });

  it('mintánként pontosan egy gyakorlat modalitásonként, fix sorrendben', () => {
    FMS_TEST_ORDER.forEach(testId => {
      expect(FMS_CORRECTION_EXERCISES[testId].map(exercise => exercise.modality)).toEqual(
        FMS_CORRECTION_MODALITY_ORDER,
      );
    });
  });

  it('minden gyakorlathoz van név, adagolás és végrehajtási instrukció', () => {
    FMS_TEST_ORDER.flatMap(testId => FMS_CORRECTION_EXERCISES[testId]).forEach(exercise => {
      expect(exercise.name.length).toBeGreaterThan(3);
      expect(exercise.dosage.length).toBeGreaterThan(3);
      expect(exercise.cue.length).toBeGreaterThan(20);
    });
  });

  it('a gyakorlatnevek globálisan egyediek — a PDF listája nem ismétel', () => {
    const names = FMS_TEST_ORDER.flatMap(testId => FMS_CORRECTION_NAMES[testId]);

    expect(new Set(names).size).toBe(names.length);
  });
});

describe('identifyFMSCorrections', () => {
  it('null felmérésre üres listát ad', () => {
    expect(identifyFMSCorrections(null)).toEqual([]);
  });

  it('hibátlan (minden pontszám >= 2) felmérésre nincs korrekció', () => {
    expect(identifyFMSCorrections(makeFMSAssessment())).toEqual([]);
  });

  it('2 alatti pontszámra a megfelelő minta korrekciós gyakorlatát ajánlja', () => {
    const corrections = identifyFMSCorrections(makeFMSAssessment({ deep_squat: 1 }));

    expect(corrections).toHaveLength(1);
    expect(FMS_CORRECTION_NAMES.deep_squat).toContain(corrections[0]);
  });

  it('több gyenge minta esetén mintánként egy korrekciót ad', () => {
    const corrections = identifyFMSCorrections(
      makeFMSAssessment({ deep_squat: 1, shoulder_mobility: 0 }),
    );
    expect(corrections).toHaveLength(2);
  });

  it('a meta-mezőket (total_score, notes, id) nem értelmezi pontszámként', () => {
    // total_score 1, de nem szabad korrekciót generálnia
    const corrections = identifyFMSCorrections(makeFMSAssessment({ total_score: 1 }));
    expect(corrections).toEqual([]);
  });
});

describe('getFMSCorrectionsForAssessment', () => {
  it('null felmérésre üres listát ad', () => {
    expect(getFMSCorrectionsForAssessment(null)).toEqual([]);
  });

  it('hibátlan felmérésre nincs javaslat', () => {
    expect(getFMSCorrectionsForAssessment(makeFMSAssessment())).toEqual([]);
  });

  it('bukott tesztenként a minta teljes korrekciós blokkját visszaadja', () => {
    const groups = getFMSCorrectionsForAssessment(makeFMSAssessment({ deep_squat: 1 }));

    expect(groups).toHaveLength(1);
    expect(groups[0].testId).toBe('deep_squat');
    expect(groups[0].label).toBe('Mély guggolás');
    expect(groups[0].score).toBe(1);
    expect(groups[0].exercises).toEqual(FMS_CORRECTION_EXERCISES.deep_squat);
    expect(groups[0].exercises.map(exercise => exercise.modality)).toEqual(
      FMS_CORRECTION_MODALITY_ORDER,
    );
  });

  it('a csoportokat a kanonikus tesztsorrendben adja vissza', () => {
    const groups = getFMSCorrectionsForAssessment(
      makeFMSAssessment({ rotary_stability: 0, deep_squat: 1, shoulder_mobility: 1 }),
    );
    const order = groups.map(group => group.testId);

    expect(order).toEqual([...FMS_TEST_ORDER].filter(id => order.includes(id)));
    expect(order).toEqual(['deep_squat', 'shoulder_mobility', 'rotary_stability']);
  });

  it('determinisztikus — az identifyFMSCorrections véletlenjével szemben', () => {
    const assessment = makeFMSAssessment({ deep_squat: 1, hurdle_step: 0 });

    expect(getFMSCorrectionsForAssessment(assessment)).toEqual(
      getFMSCorrectionsForAssessment(assessment),
    );
  });

  it('a visszaadott gyakorlatlista módosítása nem írja felül a forrásadatot', () => {
    const first = getFMSCorrectionsForAssessment(makeFMSAssessment({ deep_squat: 1 }));
    const originalLength = FMS_CORRECTION_EXERCISES.deep_squat.length;
    first[0].exercises.push({ ...first[0].exercises[0], name: 'Beszúrt elem' });
    first[0].exercises[0].name = 'Felülírt név';

    const second = getFMSCorrectionsForAssessment(makeFMSAssessment({ deep_squat: 1 }));
    expect(second[0].exercises).toHaveLength(originalLength);
    expect(second[0].exercises[0].name).toBe(FMS_CORRECTION_EXERCISES.deep_squat[0].name);
  });
});
