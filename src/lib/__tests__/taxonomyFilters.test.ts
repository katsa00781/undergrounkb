import { describe, it, expect } from 'vitest';
import {
  filterExercisesList,
  getExerciseFMSFocuses,
  exerciseMatchesCategoryFilter,
  exerciseMatchesMovementPatternFilter,
} from '../exerciseTaxonomy/filters';
import type { ExerciseListFilters } from '../exerciseTaxonomy/types';
import { makeExercise } from './fixtures';

const emptyFilters: ExerciseListFilters = {
  searchQuery: '',
  selectedCategory: null,
  selectedMovementPattern: null,
  selectedPatternFamily: null,
  selectedLaterality: null,
  selectedFMSFocus: null,
  selectedDifficulty: null,
  showInactive: true,
};

describe('getExerciseFMSFocuses', () => {
  it('a guggolós térddomináns gyakorlatot a deep_squat fókuszhoz köti', () => {
    const ex = makeExercise({ movement_pattern: 'knee_dominant_bilateral', name: 'Mély guggolás' });
    expect(getExerciseFMSFocuses(ex)).toContain('deep_squat');
  });

  it('a stability_correction mintát a trunk_stability_pushup és rotary_stability fókuszokhoz köti', () => {
    const ex = makeExercise({ movement_pattern: 'stability_correction', name: 'Bird dog' });
    const focuses = getExerciseFMSFocuses(ex);
    expect(focuses).toContain('trunk_stability_pushup');
    expect(focuses).toContain('rotary_stability');
  });

  it('semleges gyakorlatra üres listát ad', () => {
    const ex = makeExercise({ movement_pattern: 'horizontal_push_bilateral', name: 'Fekvőtámasz' });
    expect(getExerciseFMSFocuses(ex)).toEqual([]);
  });
});

describe('exerciseMatchesCategoryFilter / MovementPatternFilter', () => {
  it('üres szűrőre mindig igaz', () => {
    const ex = makeExercise();
    expect(exerciseMatchesCategoryFilter(ex, '')).toBe(true);
    expect(exerciseMatchesMovementPatternFilter(ex, '')).toBe(true);
  });

  it('közvetlen kategória-egyezést felismer', () => {
    const ex = makeExercise({ category: 'kettlebell' });
    expect(exerciseMatchesCategoryFilter(ex, 'kettlebell')).toBe(true);
    expect(exerciseMatchesCategoryFilter(ex, 'cardio')).toBe(false);
  });

  it('közvetlen mozgásminta-egyezést felismer', () => {
    const ex = makeExercise({ movement_pattern: 'hip_dominant_bilateral' });
    expect(exerciseMatchesMovementPatternFilter(ex, 'hip_dominant_bilateral')).toBe(true);
    expect(exerciseMatchesMovementPatternFilter(ex, 'knee_dominant_bilateral')).toBe(false);
  });
});

describe('filterExercisesList', () => {
  const swing = makeExercise({ id: 'swing', name: 'Kettlebell lengetés', category: 'kettlebell', movement_pattern: 'hip_dominant_bilateral', difficulty: 2 });
  const press = makeExercise({ id: 'press', name: 'Katonai nyomás', category: 'kettlebell', movement_pattern: 'vertical_push_bilateral', difficulty: 3 });
  const inactive = makeExercise({ id: 'old', name: 'Régi gyakorlat', is_active: false });
  const all = [swing, press, inactive];

  it('a kereső a névre, leírásra, instrukcióra illeszt (kis/nagybetű-független)', () => {
    const result = filterExercisesList(all, { ...emptyFilters, searchQuery: 'lenget' });
    expect(result.map(e => e.id)).toEqual(['swing']);
  });

  it('a nehézségi szűrő pontosan illeszt', () => {
    const result = filterExercisesList(all, { ...emptyFilters, selectedDifficulty: 3 });
    expect(result.map(e => e.id)).toEqual(['press']);
  });

  it('showInactive=false esetén az inaktív gyakorlatokat kihagyja', () => {
    const result = filterExercisesList(all, { ...emptyFilters, showInactive: false });
    expect(result.map(e => e.id)).not.toContain('old');
  });

  it('a kategória + mozgásminta szűrő együtt (AND) szűkít', () => {
    const result = filterExercisesList(all, {
      ...emptyFilters,
      selectedCategory: 'kettlebell',
      selectedMovementPattern: 'hip_dominant_bilateral',
    });
    expect(result.map(e => e.id)).toEqual(['swing']);
  });

  it('üres szűrőre az összes gyakorlatot visszaadja', () => {
    expect(filterExercisesList(all, emptyFilters)).toHaveLength(3);
  });
});
