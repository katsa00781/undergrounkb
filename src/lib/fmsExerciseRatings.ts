import type { Exercise } from './exerciseService';
import { getExerciseFMSFocuses, getFMSFocusLabel, type FMSFocusId } from './exerciseService';
import type { FMSAssessment } from './fms';

export type ExerciseRatingStatus = 'red' | 'yellow' | 'green' | 'unknown';

export interface ExerciseRating {
  status: ExerciseRatingStatus;
  label: string;
  reasons: string[];
  scores: Array<{ focusId: FMSFocusId; score: number }>;
}

const STATUS_META: Record<ExerciseRatingStatus, { label: string; className: string; dotClassName: string }> = {
  red: {
    label: 'Nem végezhető',
    className: 'bg-error-100 text-error-800 dark:bg-error-900/40 dark:text-error-200',
    dotClassName: 'bg-error-500',
  },
  yellow: {
    label: 'Limitációval',
    className: 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200',
    dotClassName: 'bg-warning-500',
  },
  green: {
    label: 'Végezhető',
    className: 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-200',
    dotClassName: 'bg-success-500',
  },
  unknown: {
    label: 'Nincs FMS adat',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    dotClassName: 'bg-gray-400',
  },
};

function getFocusScore(assessment: FMSAssessment, focusId: FMSFocusId): number {
  return assessment[focusId] ?? 0;
}

export function getExerciseRatingForAssessment(exercise: Pick<Exercise, 'name' | 'description' | 'instructions' | 'movement_pattern'>, assessment: FMSAssessment | null | undefined): ExerciseRating {
  if (!assessment) {
    return {
      status: 'unknown',
      label: STATUS_META.unknown.label,
      reasons: ['Nincs elérhető FMS felmérés ehhez a résztvevőhöz.'],
      scores: [],
    };
  }

  const focuses = getExerciseFMSFocuses(exercise);
  if (focuses.length === 0) {
    return {
      status: 'green',
      label: STATUS_META.green.label,
      reasons: ['Nincs közvetlen FMS korlátozás ehhez a gyakorlathoz.'],
      scores: [],
    };
  }

  const scores = focuses.map(focusId => ({
    focusId,
    score: getFocusScore(assessment, focusId),
  }));

  const minimumScore = Math.min(...scores.map(item => item.score));
  const status: ExerciseRatingStatus = minimumScore <= 1 ? 'red' : minimumScore === 2 ? 'yellow' : 'green';

  return {
    status,
    label: STATUS_META[status].label,
    reasons: scores.map(({ focusId, score }) => `${getFMSFocusLabel(focusId)}: ${score}/3`),
    scores,
  };
}

export function getExerciseRatingMeta(status: ExerciseRatingStatus) {
  return STATUS_META[status];
}