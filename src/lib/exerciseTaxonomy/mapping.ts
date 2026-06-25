import type {
  Exercise,
  ExerciseWithTaxonomy,
  ExerciseTaxonomyTag,
  ExerciseTaxonomyAssignmentSource,
} from './types';
import {
  LEGACY_CATEGORY_TO_TAXONOMY_SLUG,
  EXACT_PATTERN_TO_TAXONOMY_SLUG,
  PATTERN_FAMILY_AND_LATERALITY_TAGS,
} from './constants';

export function normalizeExerciseText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function mapExerciseWithTaxonomy(exercise: Exercise & {
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

export function getNormalizedTaxonomySlugs(slugs?: string[]): string[] {
  return Array.from(new Set((slugs ?? []).map((slug) => slug.trim()).filter(Boolean)));
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
