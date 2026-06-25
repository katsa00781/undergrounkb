import { useState } from 'react';
import { Exercise } from '../lib/exercises';
import {
  ExerciseWithTaxonomy,
  filterExercisesList,
  getAvailableMovementPatternOptions,
  getExerciseFMSFocuses,
} from '../lib/exerciseService';
import { getPlaceholderExerciseMeta } from '../lib/workoutPlannerHelpers';

type FilterMap = { [exerciseKey: string]: string };

const isExerciseFMSCandidate = (exercise: ExerciseWithTaxonomy) =>
  exercise.category === 'fms' || getExerciseFMSFocuses(exercise).length > 0;

/**
 * Per-exercise szűrőállapot és a hozzá tartozó műveletek a WorkoutPlanner
 * gyakorlatválasztójához. Minden szűrő kulcsa `${sectionId}-${exerciseId}`.
 */
export const useSectionExerciseFilters = (exercises: Exercise[]) => {
  const [categoryFilters, setCategoryFilters] = useState<FilterMap>({});
  const [movementPatternFilters, setMovementPatternFilters] = useState<FilterMap>({});
  const [patternFamilyFilters, setPatternFamilyFilters] = useState<FilterMap>({});
  const [lateralityFilters, setLateralityFilters] = useState<FilterMap>({});
  const [fmsFocusFilters, setFmsFocusFilters] = useState<FilterMap>({});
  const [exerciseSearchQueries, setExerciseSearchQueries] = useState<FilterMap>({});

  const getExerciseKey = (sectionId: string, exerciseId: string) => `${sectionId}-${exerciseId}`;

  const getFilteredExercises = (sectionId: string, exerciseId: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    return filterExercisesList(exercises, {
      searchQuery: exerciseSearchQueries[exerciseKey] || '',
      selectedCategory: categoryFilters[exerciseKey] || null,
      selectedMovementPattern: movementPatternFilters[exerciseKey] || null,
      selectedPatternFamily: patternFamilyFilters[exerciseKey] || null,
      selectedLaterality: lateralityFilters[exerciseKey] || null,
      selectedFMSFocus: fmsFocusFilters[exerciseKey] || null,
      selectedDifficulty: null,
      showInactive: true,
    }, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isFmsCandidate: isExerciseFMSCandidate as any,
    });
  };

  const getAvailableMovementPatterns = (sectionId: string, exerciseId: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    return getAvailableMovementPatternOptions(exercises, {
      searchQuery: exerciseSearchQueries[exerciseKey] || '',
      selectedCategory: categoryFilters[exerciseKey] || null,
      selectedPatternFamily: patternFamilyFilters[exerciseKey] || null,
      selectedLaterality: lateralityFilters[exerciseKey] || null,
      selectedFMSFocus: fmsFocusFilters[exerciseKey] || null,
    }, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isFmsCandidate: isExerciseFMSCandidate as any,
    });
  };

  const updateCategoryFilter = (sectionId: string, exerciseId: string, category: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    setCategoryFilters(prev => {
      const newCategory = category === prev[exerciseKey] ? '' : category;
      return {
        ...prev,
        [exerciseKey]: newCategory,
      };
    });

    // Reset movement pattern filter when category changes
    setMovementPatternFilters(prev => ({
      ...prev,
      [exerciseKey]: '',
    }));

    setFmsFocusFilters(prev => ({
      ...prev,
      [exerciseKey]: '',
    }));
  };

  const updateMovementPatternFilter = (sectionId: string, exerciseId: string, movementPattern: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    setMovementPatternFilters(prev => ({
      ...prev,
      [exerciseKey]: movementPattern === prev[exerciseKey] ? '' : movementPattern,
    }));
  };

  const updatePatternFamilyFilter = (sectionId: string, exerciseId: string, patternFamily: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    setPatternFamilyFilters(prev => ({
      ...prev,
      [exerciseKey]: patternFamily === prev[exerciseKey] ? '' : patternFamily,
    }));
  };

  const updateLateralityFilter = (sectionId: string, exerciseId: string, laterality: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    setLateralityFilters(prev => ({
      ...prev,
      [exerciseKey]: laterality === prev[exerciseKey] ? '' : laterality,
    }));
  };

  const updateFMSFocusFilter = (sectionId: string, exerciseId: string, fmsFocus: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    setFmsFocusFilters(prev => ({
      ...prev,
      [exerciseKey]: fmsFocus === prev[exerciseKey] ? '' : fmsFocus,
    }));
  };

  const setSearchQuery = (exerciseKey: string, value: string) => {
    setExerciseSearchQueries(prev => ({
      ...prev,
      [exerciseKey]: value,
    }));
  };

  const setMovementPatternForPlaceholder = (sectionId: string, exerciseId: string, placeholderId: string) => {
    const placeholderMeta = getPlaceholderExerciseMeta(placeholderId);
    const movementPattern = placeholderMeta?.movementPatternId;
    const category = placeholderMeta?.categoryId;
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    if (category) {
      setCategoryFilters(prev => ({
        ...prev,
        [exerciseKey]: category,
      }));
    }

    if (movementPattern) {
      setMovementPatternFilters(prev => ({
        ...prev,
        [exerciseKey]: movementPattern,
      }));
    }
  };

  const clearFiltersForExercise = (exerciseKey: string) => {
    const dropKey = (prev: FilterMap) => {
      const next = { ...prev };
      delete next[exerciseKey];
      return next;
    };
    setCategoryFilters(dropKey);
    setMovementPatternFilters(dropKey);
    setPatternFamilyFilters(dropKey);
    setLateralityFilters(dropKey);
    setFmsFocusFilters(dropKey);
    setExerciseSearchQueries(dropKey);
  };

  const resetFiltersForExercise = (exerciseKey: string) => {
    setCategoryFilters(prev => ({ ...prev, [exerciseKey]: '' }));
    setMovementPatternFilters(prev => ({ ...prev, [exerciseKey]: '' }));
    setPatternFamilyFilters(prev => ({ ...prev, [exerciseKey]: '' }));
    setLateralityFilters(prev => ({ ...prev, [exerciseKey]: '' }));
    setFmsFocusFilters(prev => ({ ...prev, [exerciseKey]: '' }));
    setExerciseSearchQueries(prev => ({ ...prev, [exerciseKey]: '' }));
  };

  const clearFiltersForSection = (sectionId: string) => {
    const dropSection = (prev: FilterMap) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${sectionId}-`)));
    setCategoryFilters(dropSection);
    setMovementPatternFilters(dropSection);
    setPatternFamilyFilters(dropSection);
    setLateralityFilters(dropSection);
    setFmsFocusFilters(dropSection);
    setExerciseSearchQueries(dropSection);
  };

  const resetAllFilters = () => {
    setCategoryFilters({});
    setMovementPatternFilters({});
    setPatternFamilyFilters({});
    setLateralityFilters({});
    setFmsFocusFilters({});
    setExerciseSearchQueries({});
  };

  return {
    categoryFilters,
    movementPatternFilters,
    patternFamilyFilters,
    lateralityFilters,
    fmsFocusFilters,
    exerciseSearchQueries,
    getExerciseKey,
    getFilteredExercises,
    getAvailableMovementPatterns,
    updateCategoryFilter,
    updateMovementPatternFilter,
    updatePatternFamilyFilter,
    updateLateralityFilter,
    updateFMSFocusFilter,
    setSearchQuery,
    setMovementPatternForPlaceholder,
    clearFiltersForExercise,
    resetFiltersForExercise,
    clearFiltersForSection,
    resetAllFilters,
    isExerciseFMSCandidate,
  };
};

export type SectionExerciseFiltersApi = ReturnType<typeof useSectionExerciseFilters>;
