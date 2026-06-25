import type { ExerciseCategory, MovementPattern, FMSFocusId } from './types';
import {
  EXERCISE_CATEGORY_OPTIONS,
  EXERCISE_CATEGORY_MOVEMENT_PATTERNS,
  MOVEMENT_PATTERN_OPTIONS,
  FMS_FOCUS_OPTIONS,
} from './constants';

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
