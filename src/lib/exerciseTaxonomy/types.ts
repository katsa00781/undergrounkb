import type { Database } from '../../types/supabase';

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
