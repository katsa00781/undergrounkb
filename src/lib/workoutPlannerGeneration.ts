import { Exercise } from './exercises';
import { GeneratedWorkoutPlan } from './workoutGenerator.fixed';

export type PlannerFormattedExercise = {
  exerciseId: string;
  exerciseName?: string;
  sets: number;
  reps: number | string;
  weight?: number;
  notes?: string;
  restPeriod?: number;
};

export type PlannerFormattedSection = {
  name: string;
  exercises: PlannerFormattedExercise[];
};

export type PlannerUiExercise = PlannerFormattedExercise & {
  id: string;
  name?: string;
};

export type PlannerUiSection = {
  id: string;
  name: string;
  exercises: PlannerUiExercise[];
};

export function mapGeneratedWorkoutToPlannerSections(
  generatedWorkout: GeneratedWorkoutPlan,
  exercises: Exercise[]
): {
  formattedSections: PlannerFormattedSection[];
  uiSections: PlannerUiSection[];
} {
  const formattedSections = generatedWorkout.sections.map((section) => ({
    name: section.name,
    exercises: section.exercises.map((exercise) => {
      const isPlaceholder = exercise.exerciseId.startsWith('placeholder-');

      return {
        exerciseId: exercise.exerciseId,
        exerciseName: isPlaceholder ? exercise.name : undefined,
        sets: Number(exercise.sets) || 3,
        reps:
          typeof exercise.reps === 'string' && Number.isNaN(Number(exercise.reps))
            ? exercise.reps
            : Number(exercise.reps) || 10,
        weight:
          exercise.weight && !Number.isNaN(Number(exercise.weight)) && Number(exercise.weight) > 0
            ? Number(exercise.weight)
            : undefined,
        notes: exercise.instruction || undefined,
        restPeriod:
          exercise.restPeriod && !Number.isNaN(Number(exercise.restPeriod)) && Number(exercise.restPeriod) > 0
            ? Number(exercise.restPeriod)
            : undefined,
      };
    }),
  }));

  const uiSections = formattedSections.map((section, sectionIndex) => ({
    id: `${sectionIndex + 1}`,
    name: section.name,
    exercises: section.exercises.map((exercise, exerciseIndex) => {
      const exerciseDetails =
        exercise.exerciseId && !exercise.exerciseId.startsWith('placeholder-')
          ? exercises.find((item) => item.id === exercise.exerciseId)
          : null;

      return {
        id: `${sectionIndex + 1}-${exerciseIndex + 1}`,
        ...exercise,
        name:
          exerciseDetails?.name ||
          (exercise.exerciseId?.startsWith('placeholder-') ? exercise.exerciseName : undefined),
      };
    }),
  }));

  return {
    formattedSections,
    uiSections,
  };
}