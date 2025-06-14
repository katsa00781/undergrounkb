import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];
export type ExerciseCategory = Database['public']['Enums']['exercise_category'];
export type MovementPattern = Database['public']['Enums']['movement_pattern'];

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
    .select('*');

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

  return data;
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(id: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Error fetching exercise: ${error.message}`);
  }

  return data;
}

/**
 * Create a new exercise
 */
export async function createExercise(exercise: ExerciseInsert) {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating exercise: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing exercise
 */
export async function updateExercise(id: string, updates: ExerciseUpdate) {
  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating exercise: ${error.message}`);
  }

  return data;
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
  return [
    { id: 'strength_training', label: 'Erőedzés' },
    { id: 'cardio', label: 'Kardió' },
    { id: 'kettlebell', label: 'Kettlebell' },
    { id: 'mobility_flexibility', label: 'Mobilitás/Nyújtás' },
    { id: 'hiit', label: 'HIIT' },
    { id: 'recovery', label: 'Regeneráció' },
  ];
}

/**
 * Get all movement patterns
 */
export function getMovementPatterns(): { id: MovementPattern, label: string, category?: string }[] {
  return [
    // Gait alapú mozgások
    { id: 'gait_stability', label: 'Gait – törzs stabilitás', category: 'Gait' },
    { id: 'gait_crawling', label: 'Gait mászásban – törzs stabilitás', category: 'Gait' },
    
    // Csípő dominás mozgások
    { id: 'hip_dominant_bilateral', label: 'Csípő domináns – bilaterális', category: 'Csípő' },
    { id: 'hip_dominant_unilateral', label: 'Csípő domináns – unilaterális', category: 'Csípő' },
    
    // Térd dominás mozgások
    { id: 'knee_dominant_bilateral', label: 'Térd domináns – bilaterális', category: 'Térd' },
    { id: 'knee_dominant_unilateral', label: 'Térd domináns – unilaterális', category: 'Térd' },
    
    // Horizontális mozgások
    { id: 'horizontal_push_bilateral', label: 'Horizontális nyomás – bilaterális', category: 'Horizontális' },
    { id: 'horizontal_push_unilateral', label: 'Horizontális nyomás – unilaterális', category: 'Horizontális' },
    { id: 'horizontal_pull_bilateral', label: 'Horizontális húzás – bilaterális', category: 'Horizontális' },
    { id: 'horizontal_pull_unilateral', label: 'Horizontális húzás – unilaterális', category: 'Horizontális' },
    
    // Vertikális mozgások
    { id: 'vertical_push_bilateral', label: 'Vertikális nyomás – bilaterális', category: 'Vertikális' },
    { id: 'vertical_push_unilateral', label: 'Vertikális nyomás – unilaterális', category: 'Vertikális' },
    { id: 'vertical_pull_bilateral', label: 'Vertikális húzás – bilaterális', category: 'Vertikális' },
    
    // Stabilitás gyakorlatok
    { id: 'stability_anti_extension', label: 'Stabilitás – anti-extenzió', category: 'Stabilitás' },
    { id: 'stability_anti_rotation', label: 'Stabilitás – anti-rotáció', category: 'Stabilitás' },
    { id: 'stability_anti_flexion', label: 'Stabilitás – anti-flexió', category: 'Stabilitás' },
    { id: 'core_other', label: 'Core – egyéb', category: 'Stabilitás' },
    
    // Korrekciós gyakorlatok
    { id: 'local_exercises', label: 'Lokális gyakorlatok', category: 'Korrekció' },
    { id: 'upper_body_mobility', label: 'Felsőtest mobilizálás', category: 'Korrekció' },
    { id: 'aslr_correction_first', label: 'ASLR korrekció – első pár', category: 'Korrekció' },
    { id: 'aslr_correction_second', label: 'ASLR korrekció – második hármas', category: 'Korrekció' },
    { id: 'sm_correction_first', label: 'SM korrekció – első pár', category: 'Korrekció' },
    { id: 'sm_correction_second', label: 'SM korrekció – második hármas', category: 'Korrekció' },
    { id: 'stability_correction', label: 'Stabilitás korrekció', category: 'Korrekció' },
    { id: 'mobilization', label: 'Mobilizálás', category: 'Korrekció' },
  ];
}
