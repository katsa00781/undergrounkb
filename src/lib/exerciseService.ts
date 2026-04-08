import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];
export type ExerciseCategory = Database['public']['Enums']['exercise_category'];
export type MovementPattern = Database['public']['Enums']['movement_pattern'];
export type ExerciseTaxonomyTag = Database['public']['Tables']['exercise_taxonomy_tags']['Row'];
export type ExerciseTaxonomyDimension = Database['public']['Enums']['exercise_taxonomy_dimension'];
export type ExerciseTaxonomyAssignmentSource = Database['public']['Enums']['exercise_taxonomy_assignment_source'];

export type ExerciseWithTaxonomy = Exercise & {
  exercise_taxonomy_assignments?: Array<{
    source: ExerciseTaxonomyAssignmentSource;
    is_primary: boolean;
    exercise_taxonomy_tags: ExerciseTaxonomyTag | null;
  }>;
  taxonomy_tags: ExerciseTaxonomyTag[];
  manual_taxonomy_tags: ExerciseTaxonomyTag[];
  derived_taxonomy_tags: ExerciseTaxonomyTag[];
};

export type ExerciseWriteInput = ExerciseInsert & {
  taxonomyTagSlugs?: string[];
};

export type ExerciseWriteUpdate = ExerciseUpdate & {
  taxonomyTagSlugs?: string[];
};

export type ExerciseListFilters = {
  searchQuery: string;
  selectedCategory: string | null;
  selectedMovementPattern: string | null;
  selectedPatternFamily: string | null;
  selectedLaterality: string | null;
  selectedFMSFocus: string | null;
  selectedDifficulty: number | null;
  showInactive: boolean;
};
export type FMSFocusId =
  | 'deep_squat'
  | 'hurdle_step'
  | 'inline_lunge'
  | 'shoulder_mobility'
  | 'active_straight_leg_raise'
  | 'trunk_stability_pushup'
  | 'rotary_stability';

const EXERCISE_CATEGORY_OPTIONS: { id: ExerciseCategory; label: string }[] = [
  { id: 'strength_training', label: 'Erőedzés' },
  { id: 'cardio', label: 'Kardió' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'mobility_flexibility', label: 'Mobilitás/Nyújtás' },
  { id: 'hiit', label: 'HIIT' },
  { id: 'recovery', label: 'Regeneráció' },
  { id: 'fms', label: 'FMS' },
  { id: 'smr', label: 'SMR' },
];

const EXERCISE_CATEGORY_MOVEMENT_PATTERNS: Record<ExerciseCategory, MovementPattern[]> = {
  kettlebell: [
    'gait_stability',
    'gait_crawling',
    'hip_dominant_bilateral',
    'hip_dominant_unilateral',
    'knee_dominant_bilateral',
    'knee_dominant_unilateral',
    'horizontal_push_bilateral',
    'horizontal_push_unilateral',
    'horizontal_pull_bilateral',
    'horizontal_pull_unilateral',
    'vertical_push_bilateral',
    'vertical_push_unilateral',
    'vertical_pull_bilateral',
    'stability_anti_extension',
    'stability_anti_rotation',
    'stability_anti_flexion',
    'core_other',
    'local_exercises',
  ],
  fms: [
    'aslr_correction_first',
    'aslr_correction_second',
    'sm_correction_first',
    'sm_correction_second',
    'stability_correction',
    'upper_body_mobility',
    'mobilization',
    'stability_anti_extension',
    'stability_anti_rotation',
    'stability_anti_flexion',
    'knee_dominant_bilateral',
    'knee_dominant_unilateral',
    'hip_dominant_bilateral',
    'hip_dominant_unilateral',
    'horizontal_push_bilateral',
    'core_other',
  ],
  smr: [
    'mobilization',
  ],
  mobility_flexibility: [
    'upper_body_mobility',
    'mobilization',
  ],
  strength_training: [
    'hip_dominant_bilateral',
    'hip_dominant_unilateral',
    'knee_dominant_bilateral',
    'knee_dominant_unilateral',
    'horizontal_push_bilateral',
    'horizontal_push_unilateral',
    'horizontal_pull_bilateral',
    'horizontal_pull_unilateral',
    'vertical_push_bilateral',
    'vertical_push_unilateral',
    'vertical_pull_bilateral',
    'stability_anti_extension',
    'stability_anti_rotation',
    'stability_anti_flexion',
    'core_other',
    'gait_stability',
    'gait_crawling',
  ],
  cardio: [
    'gait_stability',
    'gait_crawling',
  ],
  hiit: [
    'gait_stability',
    'gait_crawling',
    'hip_dominant_bilateral',
    'knee_dominant_bilateral',
    'stability_anti_extension',
    'stability_anti_rotation',
    'stability_anti_flexion',
    'core_other',
  ],
  recovery: [
    'mobilization',
    'upper_body_mobility',
    'stability_anti_extension',
    'stability_anti_rotation',
    'stability_anti_flexion',
    'core_other',
    'gait_stability',
  ],
};

const MOVEMENT_PATTERN_OPTIONS: { id: MovementPattern; label: string; category?: string }[] = [
  { id: 'gait_stability', label: 'Gait – törzs stabilitás', category: 'Gait' },
  { id: 'gait_crawling', label: 'Gait mászásban – törzs stabilitás', category: 'Gait' },
  { id: 'hip_dominant_bilateral', label: 'Csípő domináns – bilaterális', category: 'Csípő' },
  { id: 'hip_dominant_unilateral', label: 'Csípő domináns – unilaterális', category: 'Csípő' },
  { id: 'knee_dominant_bilateral', label: 'Térd domináns – bilaterális', category: 'Térd' },
  { id: 'knee_dominant_unilateral', label: 'Térd domináns – unilaterális', category: 'Térd' },
  { id: 'horizontal_push_bilateral', label: 'Horizontális nyomás – bilaterális', category: 'Horizontális' },
  { id: 'horizontal_push_unilateral', label: 'Horizontális nyomás – unilaterális', category: 'Horizontális' },
  { id: 'horizontal_pull_bilateral', label: 'Horizontális húzás – bilaterális', category: 'Horizontális' },
  { id: 'horizontal_pull_unilateral', label: 'Horizontális húzás – unilaterális', category: 'Horizontális' },
  { id: 'vertical_push_bilateral', label: 'Vertikális nyomás – bilaterális', category: 'Vertikális' },
  { id: 'vertical_push_unilateral', label: 'Vertikális nyomás – unilaterális', category: 'Vertikális' },
  { id: 'vertical_pull_bilateral', label: 'Vertikális húzás – bilaterális', category: 'Vertikális' },
  { id: 'stability_anti_extension', label: 'Stabilitás – anti-extenzió', category: 'Stabilitás' },
  { id: 'stability_anti_rotation', label: 'Stabilitás – anti-rotáció', category: 'Stabilitás' },
  { id: 'stability_anti_flexion', label: 'Stabilitás – anti-flexió', category: 'Stabilitás' },
  { id: 'core_other', label: 'Core – egyéb', category: 'Stabilitás' },
  { id: 'local_exercises', label: 'Lokális gyakorlatok', category: 'Korrekció' },
  { id: 'upper_body_mobility', label: 'Felsőtest mobilizálás', category: 'Korrekció' },
  { id: 'aslr_correction_first', label: 'ASLR korrekció – első pár', category: 'Korrekció' },
  { id: 'aslr_correction_second', label: 'ASLR korrekció – második hármas', category: 'Korrekció' },
  { id: 'sm_correction_first', label: 'SM korrekció – első pár', category: 'Korrekció' },
  { id: 'sm_correction_second', label: 'SM korrekció – második hármas', category: 'Korrekció' },
  { id: 'stability_correction', label: 'Stabilitás korrekció', category: 'Korrekció' },
  { id: 'mobilization', label: 'Mobilizálás', category: 'Korrekció' },
];

const FMS_FOCUS_OPTIONS: { id: FMSFocusId; label: string }[] = [
  { id: 'deep_squat', label: 'Mély guggolás' },
  { id: 'hurdle_step', label: 'Akadálylépés' },
  { id: 'inline_lunge', label: 'Inline kitörés' },
  { id: 'shoulder_mobility', label: 'Vállmobilitás' },
  { id: 'active_straight_leg_raise', label: 'Aktív nyújtott lábemelés' },
  { id: 'trunk_stability_pushup', label: 'Törzsstabil fekvőtámasz' },
  { id: 'rotary_stability', label: 'Rotációs stabilitás' },
];

const FMS_FOCUS_EXERCISE_NAMES: Record<FMSFocusId, string[]> = {
  deep_squat: [
    'assisted deep squat with band',
    'goblet squat hold',
    'ankle dorsiflexion mobilization',
    'quadruped rocking',
    'overhead squat with dowel',
  ],
  hurdle_step: [
    'mini-band march',
    'single-leg deadlift (unloaded)',
    'heel-to-wall march',
    'assisted step-over',
    'standing hip flexor mobilization',
  ],
  inline_lunge: [
    'split squat hold',
    'assisted in-line lunge with band',
    'half kneeling chop/lift with band',
    'ankle dorsiflexion mobilization (front leg)',
    'hip flexor stretch (rear leg)',
  ],
  shoulder_mobility: [
    'thread the needle',
    'open book stretch',
    'wall slides',
    'banded shoulder dislocates',
    'quadruped thoracic rotation',
    'shoulder clearing - thread the needle',
    'wall slides (clearing)',
    'banded external rotation',
  ],
  active_straight_leg_raise: [
    'single leg lowering with band',
    'assisted straight leg raise',
    'half kneeling hip flexor stretch',
    'toe touch progression',
    'cook hip lift',
  ],
  trunk_stability_pushup: [
    'plank hold',
    'push-up plus',
    'dead bug',
    'tall plank shoulder taps',
    'quadruped hover (bear hold)',
  ],
  rotary_stability: [
    'bird dog',
    'side plank variations',
    'dead bug (rotary)',
    'pallof press with band',
    'quadruped diagonals',
  ],
};

const LEGACY_CATEGORY_TO_TAXONOMY_SLUG: Record<ExerciseCategory, string> = {
  strength_training: 'strength',
  cardio: 'cardio',
  kettlebell: 'kettlebell',
  mobility_flexibility: 'mobility',
  hiit: 'hiit',
  recovery: 'recovery',
  fms: 'fms',
  smr: 'smr',
};

const EXACT_PATTERN_TO_TAXONOMY_SLUG: Record<MovementPattern, string> = {
  gait_stability: 'gait_stability',
  gait_crawling: 'gait_crawling',
  hip_dominant_bilateral: 'hip_dominant_bilateral',
  hip_dominant_unilateral: 'hip_dominant_unilateral',
  knee_dominant_bilateral: 'knee_dominant_bilateral',
  knee_dominant_unilateral: 'knee_dominant_unilateral',
  horizontal_push_bilateral: 'horizontal_push_bilateral',
  horizontal_push_unilateral: 'horizontal_push_unilateral',
  horizontal_pull_bilateral: 'horizontal_pull_bilateral',
  horizontal_pull_unilateral: 'horizontal_pull_unilateral',
  vertical_push_bilateral: 'vertical_push_bilateral',
  vertical_push_unilateral: 'vertical_push_unilateral',
  vertical_pull_bilateral: 'vertical_pull_bilateral',
  stability_anti_extension: 'stability_anti_extension',
  stability_anti_rotation: 'stability_anti_rotation',
  stability_anti_flexion: 'stability_anti_flexion',
  core_other: 'core_other',
  local_exercises: 'local_exercises',
  upper_body_mobility: 'upper_body_mobility_pattern',
  aslr_correction_first: 'aslr_correction_first',
  aslr_correction_second: 'aslr_correction_second',
  sm_correction_first: 'sm_correction_first',
  sm_correction_second: 'sm_correction_second',
  stability_correction: 'stability_correction_pattern',
  mobilization: 'mobilization_pattern',
};

const PATTERN_FAMILY_AND_LATERALITY_TAGS: Record<MovementPattern, string[]> = {
  gait_stability: ['gait', 'locomotion'],
  gait_crawling: ['gait', 'locomotion'],
  hip_dominant_bilateral: ['hip_dominant', 'bilateral'],
  hip_dominant_unilateral: ['hip_dominant', 'unilateral'],
  knee_dominant_bilateral: ['knee_dominant', 'bilateral'],
  knee_dominant_unilateral: ['knee_dominant', 'unilateral'],
  horizontal_push_bilateral: ['horizontal_push', 'bilateral'],
  horizontal_push_unilateral: ['horizontal_push', 'unilateral'],
  horizontal_pull_bilateral: ['horizontal_pull', 'bilateral'],
  horizontal_pull_unilateral: ['horizontal_pull', 'unilateral'],
  vertical_push_bilateral: ['vertical_push', 'bilateral'],
  vertical_push_unilateral: ['vertical_push', 'unilateral'],
  vertical_pull_bilateral: ['vertical_pull', 'bilateral'],
  stability_anti_extension: ['anti_extension', 'core'],
  stability_anti_rotation: ['anti_rotation', 'core'],
  stability_anti_flexion: ['anti_flexion', 'core'],
  core_other: ['core'],
  local_exercises: ['local_exercise'],
  upper_body_mobility: ['upper_body_mobility'],
  aslr_correction_first: ['fms'],
  aslr_correction_second: ['fms'],
  sm_correction_first: ['fms'],
  sm_correction_second: ['fms'],
  stability_correction: ['stability_correction'],
  mobilization: ['mobilization'],
};

const FILTERABLE_PATTERN_FAMILY_SLUGS = new Set([
  'gait',
  'hip_dominant',
  'knee_dominant',
  'horizontal_push',
  'horizontal_pull',
  'vertical_push',
  'vertical_pull',
  'anti_extension',
  'anti_rotation',
  'anti_flexion',
  'core',
  'local_exercise',
  'upper_body_mobility',
  'mobilization',
  'stability_correction',
]);

const FILTERABLE_LATERALITY_SLUGS = new Set([
  'bilateral',
  'unilateral',
  'locomotion',
]);

function normalizeExerciseText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function mapExerciseWithTaxonomy(exercise: Exercise & {
  exercise_taxonomy_assignments?: Array<{
    source: ExerciseTaxonomyAssignmentSource;
    is_primary: boolean;
    exercise_taxonomy_tags: ExerciseTaxonomyTag | null;
  }>;
}): ExerciseWithTaxonomy {
  const assignments = exercise.exercise_taxonomy_assignments ?? [];
  const taxonomyTags = assignments
    .map((assignment) => assignment.exercise_taxonomy_tags)
    .filter((tag): tag is ExerciseTaxonomyTag => Boolean(tag));

  return {
    ...exercise,
    exercise_taxonomy_assignments: assignments,
    taxonomy_tags: taxonomyTags,
    manual_taxonomy_tags: assignments
      .filter((assignment) => assignment.source === 'manual')
      .map((assignment) => assignment.exercise_taxonomy_tags)
      .filter((tag): tag is ExerciseTaxonomyTag => Boolean(tag)),
    derived_taxonomy_tags: assignments
      .filter((assignment) => assignment.source === 'derived')
      .map((assignment) => assignment.exercise_taxonomy_tags)
      .filter((tag): tag is ExerciseTaxonomyTag => Boolean(tag)),
  };
}

function getNormalizedTaxonomySlugs(slugs?: string[]): string[] {
  return Array.from(new Set((slugs ?? []).map((slug) => slug.trim()).filter(Boolean)));
}

async function replaceManualTaxonomyAssignments(exerciseId: string, taxonomyTagSlugs?: string[]) {
  const normalizedSlugs = getNormalizedTaxonomySlugs(taxonomyTagSlugs);

  const { error: deleteError } = await supabase
    .from('exercise_taxonomy_assignments')
    .delete()
    .eq('exercise_id', exerciseId)
    .eq('source', 'manual');

  if (deleteError) {
    throw new Error(`Error resetting exercise taxonomy tags: ${deleteError.message}`);
  }

  if (normalizedSlugs.length === 0) {
    return;
  }

  const { data: matchingTags, error: tagsError } = await supabase
    .from('exercise_taxonomy_tags')
    .select('id, slug')
    .in('slug', normalizedSlugs)
    .eq('is_active', true);

  if (tagsError) {
    throw new Error(`Error fetching taxonomy tags: ${tagsError.message}`);
  }

  if (!matchingTags || matchingTags.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('exercise_taxonomy_assignments')
    .insert(
      matchingTags.map((tag) => ({
        exercise_id: exerciseId,
        exercise_taxonomy_tag_id: tag.id,
        source: 'manual' as const,
        is_primary: false,
      }))
    );

  if (insertError) {
    throw new Error(`Error saving taxonomy tags: ${insertError.message}`);
  }
}

export function getDerivedTaxonomySlugsForExerciseShape(exercise: Pick<Exercise, 'category' | 'movement_pattern'>): string[] {
  return Array.from(new Set([
    LEGACY_CATEGORY_TO_TAXONOMY_SLUG[exercise.category],
    EXACT_PATTERN_TO_TAXONOMY_SLUG[exercise.movement_pattern],
    ...(PATTERN_FAMILY_AND_LATERALITY_TAGS[exercise.movement_pattern] ?? []),
  ].filter(Boolean)));
}

export function getExerciseTaxonomyTags(exercise: Pick<ExerciseWithTaxonomy, 'taxonomy_tags'> | Exercise): ExerciseTaxonomyTag[] {
  if ('taxonomy_tags' in exercise && Array.isArray(exercise.taxonomy_tags)) {
    return exercise.taxonomy_tags;
  }

  return [];
}

export function getExerciseManualTaxonomySlugs(exercise: Pick<ExerciseWithTaxonomy, 'manual_taxonomy_tags'> | Exercise): string[] {
  if ('manual_taxonomy_tags' in exercise && Array.isArray(exercise.manual_taxonomy_tags)) {
    return exercise.manual_taxonomy_tags.map((tag) => tag.slug);
  }

  return [];
}

export function exerciseHasTaxonomyTag(exercise: ExerciseWithTaxonomy | Exercise, slug: string): boolean {
  return getExerciseTaxonomyTags(exercise).some((tag) => tag.slug === slug);
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

export async function listExerciseTaxonomyTags(options?: {
  dimensions?: ExerciseTaxonomyDimension[];
  includeInactive?: boolean;
}) {
  let query = supabase
    .from('exercise_taxonomy_tags')
    .select('*')
    .order('dimension')
    .order('sort_order')
    .order('label');

  if (!options?.includeInactive) {
    query = query.eq('is_active', true);
  }

  if (options?.dimensions?.length) {
    query = query.in('dimension', options.dimensions);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching taxonomy tags: ${error.message}`);
  }

  return data;
}

/**
 * Fetch exercises with optional filtering
 */
export async function getExercises(options?: {
  category?: ExerciseCategory;
  movementPattern?: MovementPattern;
  difficulty?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  orderBy?: { column: keyof Exercise; ascending: boolean };
}) {
  let query = supabase
    .from('exercises')
    .select('*, exercise_taxonomy_assignments(source, is_primary, exercise_taxonomy_tags(*))');

  // Apply filters
  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.movementPattern) {
    query = query.eq('movement_pattern', options.movementPattern);
  }

  if (options?.difficulty) {
    query = query.eq('difficulty', options.difficulty);
  }

  if (options?.searchTerm) {
    query = query.ilike('name', `%${options.searchTerm}%`);
  }

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  // Apply ordering
  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending
    });
  } else {
    query = query.order('name');
  }

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Error fetching exercises: ${error.message}`);
  }

  return (data ?? []).map((exercise) => mapExerciseWithTaxonomy(exercise as ExerciseWithTaxonomy));
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(id: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_taxonomy_assignments(source, is_primary, exercise_taxonomy_tags(*))')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Error fetching exercise: ${error.message}`);
  }

  return mapExerciseWithTaxonomy(data as ExerciseWithTaxonomy);
}

/**
 * Create a new exercise
 */
export async function createExercise(exercise: ExerciseWriteInput) {
  const { taxonomyTagSlugs, ...exerciseRow } = exercise;
  const { data, error } = await supabase
    .from('exercises')
    .insert(exerciseRow)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating exercise: ${error.message}`);
  }

  await replaceManualTaxonomyAssignments(data.id, taxonomyTagSlugs);
  return getExerciseById(data.id);
}

/**
 * Update an existing exercise
 */
export async function updateExercise(id: string, updates: ExerciseWriteUpdate) {
  const { taxonomyTagSlugs, ...exerciseUpdates } = updates;
  const { data, error } = await supabase
    .from('exercises')
    .update(exerciseUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating exercise: ${error.message}`);
  }

  await replaceManualTaxonomyAssignments(id, taxonomyTagSlugs);
  return getExerciseById(data.id);
}

/**
 * Delete an exercise (soft delete by setting is_active to false)
 */
export async function deleteExercise(id: string) {
  const { error } = await supabase
    .from('exercises')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting exercise: ${error.message}`);
  }

  return true;
}

/**
 * Get all exercise categories
 */
export function getExerciseCategories(): { id: ExerciseCategory, label: string }[] {
  return EXERCISE_CATEGORY_OPTIONS;
}

export function getExerciseCategoryMovementPatterns(category: ExerciseCategory): MovementPattern[] {
  return EXERCISE_CATEGORY_MOVEMENT_PATTERNS[category] || [];
}

export function getExerciseCategoryMovementPatternMap(): Record<ExerciseCategory, MovementPattern[]> {
  return EXERCISE_CATEGORY_MOVEMENT_PATTERNS;
}

export function getExerciseCategoryLabel(category: string | null | undefined): string {
  if (!category) {
    return 'Ismeretlen kategória';
  }

  const match = EXERCISE_CATEGORY_OPTIONS.find(option => option.id === category);
  if (match) {
    return match.label;
  }

  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

/**
 * Get all movement patterns
 */
export function getMovementPatterns(): { id: MovementPattern, label: string, category?: string }[] {
  return MOVEMENT_PATTERN_OPTIONS;
}

export function getMovementPatternLabel(movementPattern: string | null | undefined): string | undefined {
  if (!movementPattern) {
    return undefined;
  }

  return MOVEMENT_PATTERN_OPTIONS.find(pattern => pattern.id === movementPattern)?.label ?? movementPattern;
}

export function getFMSFocusOptions(): { id: FMSFocusId; label: string }[] {
  return FMS_FOCUS_OPTIONS;
}

export function getFMSFocusLabel(fmsFocus: FMSFocusId | string | null | undefined): string | undefined {
  if (!fmsFocus) {
    return undefined;
  }

  return FMS_FOCUS_OPTIONS.find(option => option.id === fmsFocus)?.label;
}

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
