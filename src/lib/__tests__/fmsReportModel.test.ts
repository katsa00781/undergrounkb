import { describe, expect, it } from 'vitest';
import { buildFMSReportModel, resolveScoreBand } from '@/lib/fmsReport/buildReportModel';
import { FMS_MAX_SCORE, FMS_TEST_ORDER } from '@/lib/fmsReport/constants';
import {
  FMS_CORRECTION_EXERCISES,
  FMS_CORRECTION_MODALITY_ORDER,
} from '@/lib/workoutGenerator/fmsCorrections';
import { makeFMSAssessment } from './fixtures';

function buildModel(overrides: Parameters<typeof makeFMSAssessment>[0] = {}) {
  return buildFMSReportModel({
    assessment: makeFMSAssessment(overrides),
    clientName: 'Teszt Elek',
    clientEmail: 'teszt@example.com',
    trainerName: 'Edző Béla',
  });
}

describe('resolveScoreBand', () => {
  it.each([
    [21, 'good'],
    [14, 'good'],
    [13, 'acceptable'],
    [10, 'acceptable'],
    [9, 'poor'],
    [0, 'poor'],
  ])('a(z) %i pont a(z) "%s" sávba esik', (score, expectedBand) => {
    expect(resolveScoreBand(score).id).toBe(expectedBand);
  });

  it('a sávok hézagmentesen lefedik a teljes 0–21 tartományt', () => {
    for (let score = 0; score <= FMS_MAX_SCORE; score += 1) {
      expect(resolveScoreBand(score)).toBeDefined();
    }
  });
});

describe('buildFMSReportModel', () => {
  it('a sorokat a kanonikus sorrendben, magyar labelekkel adja vissza', () => {
    const model = buildModel();

    expect(model.rows.map(row => row.testId)).toEqual(FMS_TEST_ORDER);
    expect(model.rows[0].label).toBe('Mély guggolás');
    expect(model.rows[5].label).toBe('Törzsstabil fekvőtámasz');
    // Minden sorhoz tartozik magyar tesztleírás.
    expect(model.rows.every(row => row.description.length > 20)).toBe(true);
  });

  it('elfogadja a meglévő total_score-t', () => {
    expect(buildModel({ total_score: 17 }).totalScore).toBe(17);
  });

  it('hiányzó total_score esetén a 7 pontszámból számol', () => {
    const model = buildModel({ total_score: undefined, deep_squat: 1, hurdle_step: 2 });

    // 1 + 2 + 5 × 3 = 18
    expect(model.totalScore).toBe(18);
  });

  it('csak a 2 pont alatti mozgásmintákhoz ad korrekciós javaslatot', () => {
    const model = buildModel({ deep_squat: 1, shoulder_mobility: 0, inline_lunge: 2 });

    expect(model.corrections.map(group => group.testId)).toEqual(['deep_squat', 'shoulder_mobility']);
    // A minta teljes korrekciós blokkja bekerül, nem csak egy véletlenszerű elem.
    expect(model.corrections[0].exercises).toEqual(FMS_CORRECTION_EXERCISES.deep_squat);
  });

  it('a korrekciós javaslatok csak a négy engedett modalitásból jönnek', () => {
    const model = buildModel({ deep_squat: 1, rotary_stability: 0 });
    const modalities = model.corrections.flatMap(group =>
      group.exercises.map(exercise => exercise.modality),
    );

    expect(modalities.length).toBeGreaterThan(0);
    modalities.forEach(modality => {
      expect(FMS_CORRECTION_MODALITY_ORDER).toContain(modality);
    });
  });

  it('hibátlan felmérésnél nincs javaslat', () => {
    expect(buildModel().corrections).toEqual([]);
  });

  it('determinisztikus: két hívás azonos kimenetet ad', () => {
    const overrides = { deep_squat: 1, rotary_stability: 0, hurdle_step: 1 };

    expect(buildModel(overrides)).toEqual(buildModel(overrides));
  });

  it('0 pontos mozgásmintánál fájdalom-jelzőt állít', () => {
    expect(buildModel({ trunk_stability_pushup: 0 }).hasPainFlag).toBe(true);
    expect(buildModel({ trunk_stability_pushup: 1 }).hasPainFlag).toBe(false);
  });

  it('az üres vagy csak whitespace megjegyzést null-ra normalizálja', () => {
    expect(buildModel({ notes: '   ' }).notes).toBeNull();
    expect(buildModel({ notes: undefined }).notes).toBeNull();
    expect(buildModel({ notes: '  Jó haladás.  ' }).notes).toBe('Jó haladás.');
  });

  it('átveszi az alany- és edzőadatokat, valamint a felmérés dátumát', () => {
    const model = buildModel({ date: '2026-03-14' });

    expect(model.clientName).toBe('Teszt Elek');
    expect(model.clientEmail).toBe('teszt@example.com');
    expect(model.trainerName).toBe('Edző Béla');
    expect(model.assessmentDate).toBe('2026-03-14');
    expect(model.maxScore).toBe(FMS_MAX_SCORE);
  });
});
