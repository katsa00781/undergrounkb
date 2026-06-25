import { describe, it, expect } from 'vitest';
import {
  getExerciseCategoryLabel,
  getMovementPatternLabel,
  getFMSFocusLabel,
  getExerciseCategories,
  getMovementPatterns,
} from '../exerciseTaxonomy/metadata';

describe('getExerciseCategoryLabel', () => {
  it('ismert kategóriára a magyar címkét adja', () => {
    expect(getExerciseCategoryLabel('kettlebell')).toBe('Kettlebell');
    expect(getExerciseCategoryLabel('strength_training')).toBe('Erőedzés');
  });

  it('null/undefined esetén az "Ismeretlen kategória" szöveget adja', () => {
    expect(getExerciseCategoryLabel(null)).toBe('Ismeretlen kategória');
    expect(getExerciseCategoryLabel(undefined)).toBe('Ismeretlen kategória');
  });

  it('ismeretlen slug esetén ember-olvasható fallbacket képez', () => {
    expect(getExerciseCategoryLabel('foo_bar')).toBe('Foo Bar');
  });
});

describe('getMovementPatternLabel', () => {
  it('null-ra undefined-ot ad', () => {
    expect(getMovementPatternLabel(null)).toBeUndefined();
  });

  it('ismeretlen mintára magát az értéket adja vissza fallbackként', () => {
    expect(getMovementPatternLabel('nincs_ilyen')).toBe('nincs_ilyen');
  });
});

describe('getFMSFocusLabel', () => {
  it('null-ra undefined-ot ad', () => {
    expect(getFMSFocusLabel(null)).toBeUndefined();
  });

  it('ismert fókuszra címkét ad', () => {
    expect(getFMSFocusLabel('deep_squat')).toBeTruthy();
  });
});

describe('option listák', () => {
  it('a kategória- és mozgásminta-opciók nem üresek és egyedi id-kkal rendelkeznek', () => {
    const categories = getExerciseCategories();
    const patterns = getMovementPatterns();
    expect(categories.length).toBeGreaterThan(0);
    expect(patterns.length).toBeGreaterThan(0);
    expect(new Set(categories.map(c => c.id)).size).toBe(categories.length);
    expect(new Set(patterns.map(p => p.id)).size).toBe(patterns.length);
  });
});
