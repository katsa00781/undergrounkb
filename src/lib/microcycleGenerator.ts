import { buildMicrocyclePlan } from './microcycle/buildPlan';
import { MicrocycleRequest, PlannedSession } from './microcycle/types';
import { generateWorkoutPlanV2 } from './workoutGenerator.fixed';
import { generatePwronWorkoutPlan } from './pwronWorkoutGenerator';
import { generateLongevityWorkoutPlan } from './longevityWorkoutGenerator';
import type { GeneratedWorkoutPlan } from './workoutGenerator.fixed';
import { createWorkout, WorkoutSection } from './workouts';
import { createProgram } from './programService';

/**
 * Egy tervezett session legenerálása a megfelelő (meglévő) generátorral.
 * A dátumot a tervezett naptári dátumra írja felül.
 */
async function generateSession(
  userId: string,
  session: PlannedSession,
): Promise<GeneratedWorkoutPlan> {
  const { generator } = session;

  let plan: GeneratedWorkoutPlan;
  if (generator.kind === 'periodized') {
    plan = await generateWorkoutPlanV2({
      userId,
      programType: generator.programType,
      day: generator.day,
      cycleWeek: generator.cycleWeek,
      trainingFocus: generator.trainingFocus,
      usePeriodizationPresets: true,
      includeWeights: true,
    });
  } else if (generator.kind === 'pwron') {
    plan = await generatePwronWorkoutPlan({
      userId,
      programType: generator.programType,
      weekNumber: generator.weekNumber,
      sessionVariant: generator.sessionVariant,
      athleteName: generator.athleteName,
      prescriptionMode: generator.prescriptionMode,
    });
  } else {
    plan = await generateLongevityWorkoutPlan({
      userId,
      weekNumber: generator.weekNumber,
      modality: generator.modality,
      agtVariant: generator.agtVariant,
      athleteName: generator.athleteName,
    });
  }

  return { ...plan, date: session.date };
}

/**
 * A generált terv blokkjait a workouts DB JSONB-formátumába képezi.
 * A placeholder-eket megtartjuk (batch módban nincs szerkesztő, ahol a felhasználó
 * feloldaná őket), hogy semmilyen blokk ne vesszen el — a sportoló neve / instrukció
 * a notes-ba kerül, a placeholder neve külön mezőben.
 */
function mapPlanToDbSections(plan: GeneratedWorkoutPlan): WorkoutSection[] {
  return plan.sections.map((section) => ({
    name: section.name,
    exercises: section.exercises.map((exercise) => {
      const repsNumber = Number(exercise.reps);
      return {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseId.startsWith('placeholder-') ? exercise.name : undefined,
        sets: Number(exercise.sets) || 3,
        reps:
          typeof exercise.reps === 'string' && Number.isNaN(repsNumber)
            ? exercise.reps
            : repsNumber || 10,
        weight:
          exercise.weight && Number(exercise.weight) > 0 ? Number(exercise.weight) : undefined,
        notes: exercise.instruction || exercise.notes || undefined,
        restPeriod:
          exercise.restPeriod && Number(exercise.restPeriod) > 0 ? Number(exercise.restPeriod) : undefined,
      };
    }),
  })) as unknown as WorkoutSection[];
}

export interface GenerateMicrocycleResult {
  programId: string;
  sessionCount: number;
  warnings: string[];
}

/**
 * Teljes microciklus legenerálása: legyártja az összes session-t, létrehoz egy
 * workout_programs rekordot, majd minden session-t dátumozott workout-ként ment,
 * a programhoz kötve (program_id / week / day_label / sequence).
 */
export async function generateMicrocycle(
  req: MicrocycleRequest,
): Promise<GenerateMicrocycleResult> {
  const { sessions, warnings } = buildMicrocyclePlan(req);

  if (sessions.length === 0) {
    throw new Error('A microciklushoz legalább egy edzésnapot ki kell jelölni.');
  }

  const program = await createProgram({
    user_id: req.userId,
    name: req.name,
    description: null,
    generator_mode: req.params.mode,
    params: req.params,
    week_count: req.weekCount,
    start_date: req.startDate,
  });

  // Sorrendben, szekvenciálisan (a generátorok közös gyakorlat-katalógust töltenek,
  // a párhuzamos hívás feleslegesen terhelné a hálózatot).
  for (const session of sessions) {
    const plan = await generateSession(req.userId, session);
    await createWorkout({
      title: `${req.name} – ${session.week}. hét – ${session.dayLabel}`,
      date: session.date,
      duration: plan.duration,
      notes: plan.notes,
      user_id: req.userId,
      sections: mapPlanToDbSections(plan),
      program_id: program.id,
      program_week: session.week,
      program_day_label: session.dayLabel,
      program_sequence: session.sequence,
    });
  }

  return {
    programId: program.id,
    sessionCount: sessions.length,
    warnings,
  };
}
