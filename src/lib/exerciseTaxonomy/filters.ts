import type {
  Exercise,
  ExerciseWithTaxonomy,
  ExerciseCategory,
  MovementPattern,
  ExerciseTaxonomyDimension,
  ExerciseListFilters,
  FMSFocusId,
} from './types';
import {
  MOVEMENT_PATTERN_OPTIONS,
  FMS_FOCUS_EXERCISE_NAMES,
  LEGACY_CATEGORY_TO_TAXONOMY_SLUG,
  EXACT_PATTERN_TO_TAXONOMY_SLUG,
  FILTERABLE_PATTERN_FAMILY_SLUGS,
  FILTERABLE_LATERALITY_SLUGS,
} from './constants';
import {
  normalizeExerciseText,
  getExerciseTaxonomyTags,
  exerciseHasTaxonomyTag,
} from './mapping';

export function getExerciseFMSFocuses(exercise: Pick<Exercise, 'name' | 'description' | 'instructions' | 'movement_pattern'>): FMSFocusId[] {
  const name = normalizeExerciseText(exercise.name);
  const description = normalizeExerciseText(exercise.description);
  const instructions = normalizeExerciseText(exercise.instructions);
  const haystack = `${name} ${description} ${instructions}`;
  const matches = new Set<FMSFocusId>();

  (Object.entries(FMS_FOCUS_EXERCISE_NAMES) as Array<[FMSFocusId, string[]]>).forEach(([focusId, names]) => {
    if (names.includes(name)) {
      matches.add(focusId);
    }
  });

  if (exercise.movement_pattern === 'aslr_correction_first' || exercise.movement_pattern === 'aslr_correction_second') {
    matches.add('active_straight_leg_raise');
  }

  if (exercise.movement_pattern === 'sm_correction_first' || exercise.movement_pattern === 'sm_correction_second') {
    matches.add('shoulder_mobility');
  }

  if (exercise.movement_pattern === 'stability_correction') {
    matches.add('trunk_stability_pushup');
    matches.add('rotary_stability');
  }

  if (exercise.movement_pattern === 'upper_body_mobility') {
    matches.add('shoulder_mobility');
  }

  if (exercise.movement_pattern === 'knee_dominant_bilateral' && haystack.includes('guggol')) {
    matches.add('deep_squat');
  }

  if (exercise.movement_pattern === 'knee_dominant_unilateral') {
    if (haystack.includes('kitör') || haystack.includes('lunge')) {
      matches.add('inline_lunge');
    }
    if (haystack.includes('march') || haystack.includes('step-over') || haystack.includes('akadály')) {
      matches.add('hurdle_step');
    }
  }

  if (exercise.movement_pattern === 'hip_dominant_unilateral') {
    if (haystack.includes('cook hip lift') || haystack.includes('straight leg')) {
      matches.add('active_straight_leg_raise');
    } else {
      matches.add('hurdle_step');
    }
  }

  if (exercise.movement_pattern === 'stability_anti_extension') {
    matches.add('trunk_stability_pushup');
  }

  if (exercise.movement_pattern === 'stability_anti_rotation' || exercise.movement_pattern === 'stability_anti_flexion') {
    if (haystack.includes('chop') || haystack.includes('lift')) {
      matches.add('inline_lunge');
    }
    matches.add('rotary_stability');
  }

  if (exercise.movement_pattern === 'mobilization') {
    if (haystack.includes('boka') || haystack.includes('ankle') || haystack.includes('guggol')) {
      matches.add('deep_squat');
    }
    if (haystack.includes('hip flexor') || haystack.includes('csípőhajlító') || haystack.includes('toe touch')) {
      matches.add('active_straight_leg_raise');
    }
    if (haystack.includes('thoracic') || haystack.includes('váll') || haystack.includes('shoulder')) {
      matches.add('shoulder_mobility');
    }
  }

  return Array.from(matches);
}

export function exerciseMatchesCategoryFilter(exercise: ExerciseWithTaxonomy | Exercise, selectedCategory: string): boolean {
  if (!selectedCategory) {
    return true;
  }

  if (exercise.category === selectedCategory) {
    return true;
  }

  const mappedSlug = LEGACY_CATEGORY_TO_TAXONOMY_SLUG[selectedCategory as ExerciseCategory];
  if (!mappedSlug) {
    return false;
  }

  return getExerciseTaxonomyTags(exercise).some((tag) => tag.slug === mappedSlug);
}

export function exerciseMatchesMovementPatternFilter(exercise: ExerciseWithTaxonomy | Exercise, selectedMovementPattern: string): boolean {
  if (!selectedMovementPattern) {
    return true;
  }

  if (exercise.movement_pattern === selectedMovementPattern) {
    return true;
  }

  const patternSlug = EXACT_PATTERN_TO_TAXONOMY_SLUG[selectedMovementPattern as MovementPattern];
  if (!patternSlug) {
    return false;
  }

  return getExerciseTaxonomyTags(exercise).some((tag) => tag.slug === patternSlug);
}

export function getExerciseTaxonomyDimensionOptions(
  exercises: Array<ExerciseWithTaxonomy | Exercise>,
  dimension: ExerciseTaxonomyDimension,
): Array<{ value: string; label: string }> {
  const allowedSlugs = dimension === 'pattern_family'
    ? FILTERABLE_PATTERN_FAMILY_SLUGS
    : dimension === 'laterality'
      ? FILTERABLE_LATERALITY_SLUGS
      : null;

  const uniqueTags = new Map<string, string>();

  exercises.forEach((exercise) => {
    getExerciseTaxonomyTags(exercise)
      .filter((tag) => tag.dimension === dimension)
      .filter((tag) => !allowedSlugs || allowedSlugs.has(tag.slug))
      .forEach((tag) => {
        if (!uniqueTags.has(tag.slug)) {
          uniqueTags.set(tag.slug, tag.label);
        }
      });
  });

  return Array.from(uniqueTags.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, 'hu'));
}

export function filterExercisesList(
  exercises: Array<ExerciseWithTaxonomy | Exercise>,
  filters: ExerciseListFilters,
  options?: {
    isFmsCandidate?: (exercise: ExerciseWithTaxonomy | Exercise) => boolean;
  },
) {
  const normalizedSearch = filters.searchQuery.trim().toLowerCase();

  return exercises.filter((exercise) => {
    const matchesSearch = !normalizedSearch
      || exercise.name.toLowerCase().includes(normalizedSearch)
      || exercise.description?.toLowerCase().includes(normalizedSearch)
      || exercise.instructions?.toLowerCase().includes(normalizedSearch);

    const matchesCategory = !filters.selectedCategory || (filters.selectedCategory === 'fms'
      ? (options?.isFmsCandidate ? options.isFmsCandidate(exercise) : exercise.category === 'fms')
      : exerciseMatchesCategoryFilter(exercise, filters.selectedCategory));

    const matchesMovementPattern = !filters.selectedMovementPattern
      || exerciseMatchesMovementPatternFilter(exercise, filters.selectedMovementPattern);

    const matchesPatternFamily = !filters.selectedPatternFamily
      || exerciseHasTaxonomyTag(exercise, filters.selectedPatternFamily);

    const matchesLaterality = !filters.selectedLaterality
      || exerciseHasTaxonomyTag(exercise, filters.selectedLaterality);

    const matchesFmsFocus = !filters.selectedFMSFocus
      || getExerciseFMSFocuses(exercise).includes(filters.selectedFMSFocus as FMSFocusId);

    const matchesDifficulty = !filters.selectedDifficulty
      || exercise.difficulty === filters.selectedDifficulty;

    const matchesActiveState = filters.showInactive || exercise.is_active;

    return matchesSearch
      && matchesCategory
      && matchesMovementPattern
      && matchesPatternFamily
      && matchesLaterality
      && matchesFmsFocus
      && matchesDifficulty
      && matchesActiveState;
  });
}

export function getAvailableMovementPatternOptions(
  exercises: Array<ExerciseWithTaxonomy | Exercise>,
  filters: Pick<ExerciseListFilters, 'selectedCategory' | 'selectedPatternFamily' | 'selectedLaterality' | 'selectedFMSFocus' | 'searchQuery'>,
  options?: {
    isFmsCandidate?: (exercise: ExerciseWithTaxonomy | Exercise) => boolean;
  },
) {
  const prefiltered = filterExercisesList(
    exercises,
    {
      ...filters,
      selectedMovementPattern: null,
      selectedDifficulty: null,
      showInactive: true,
    },
    options,
  );

  const availablePatternIds = new Set(prefiltered.map((exercise) => exercise.movement_pattern));
  return MOVEMENT_PATTERN_OPTIONS.filter((pattern) => availablePatternIds.has(pattern.id));
}
