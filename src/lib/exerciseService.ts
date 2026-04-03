import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];
export type ExerciseCategory = Database['public']['Enums']['exercise_category'];
export type MovementPattern = Database['public']['Enums']['movement_pattern'];
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

function normalizeExerciseText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
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
  return EXERCISE_CATEGORY_OPTIONS;
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
