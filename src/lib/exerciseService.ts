import { supabase } from '../config/supabase';
import type {
  Exercise,
  ExerciseWithTaxonomy,
  ExerciseWriteInput,
  ExerciseWriteUpdate,
  ExerciseCategory,
  MovementPattern,
  ExerciseTaxonomyDimension,
} from './exerciseTaxonomy/types';
import { mapExerciseWithTaxonomy, getNormalizedTaxonomySlugs } from './exerciseTaxonomy/mapping';

// Re-export the taxonomy/filter logic so existing importers keep working unchanged.
export * from './exerciseTaxonomy/types';
export * from './exerciseTaxonomy/constants';
export * from './exerciseTaxonomy/mapping';
export * from './exerciseTaxonomy/metadata';
export * from './exerciseTaxonomy/filters';

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
  /**
   * Inaktív (soft-deleted / edzésgenerálásból kivett) gyakorlatok is bekerüljenek-e.
   * Alapból false: csak aktív gyakorlatok jönnek vissza, így az edzésgenerátorok
   * nem ajánlanak inaktívvá tett gyakorlatot. A gyakorlatkönyvtár adja át true-val,
   * mert ott (admin) az inaktívakat is meg kell jeleníteni.
   */
  includeInactive?: boolean;
}) {
  let query = supabase
    .from('exercises')
    .select('*, exercise_taxonomy_assignments(source, is_primary, exercise_taxonomy_tags(*))');

  // Csak aktív gyakorlatok, ha nem kérik explicit az inaktívakat is
  if (!options?.includeInactive) {
    query = query.eq('is_active', true);
  }

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
