import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import type { WorkoutSection } from './workouts';

export const formatWorkoutDate = (date: string | Date) => {
  const value = typeof date === 'string' ? parseISO(date) : date;
  return format(value, 'yyyy. MMMM d.', { locale: hu });
};

export const formatWorkoutDuration = (duration?: number | null) => `${duration ?? 0} perc`;

/**
 * Egy tervezett (nem naplózott) gyakorlat megjelenítendő neve. A gyakorlatkatalógus-
 * egyezés az elsődleges forrás; ha nincs (pl. Longevity placeholder-id, lásd
 * microcycleGenerator.ts `exerciseName` mező), erre esik vissza a katalógus-lookup
 * helyett a nyers exerciseId megjelenítése elé.
 */
export const resolveExerciseDisplayName = (
  exercise: WorkoutSection['exercises'][number],
  catalogName: string | undefined | null,
  fallback = 'Ismeretlen gyakorlat',
): string => catalogName || exercise.exerciseName || fallback;