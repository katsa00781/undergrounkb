import { supabase } from '../config/supabase';
import { notifyDataChanged } from '../utils/dataRefresh';
import { getWorkouts, Workout } from './workouts';
import type { MicrocycleMode, MicrocycleParams } from './microcycle/types';

export interface WorkoutProgram {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  generator_mode: MicrocycleMode;
  params: MicrocycleParams | Record<string, unknown>;
  week_count: number;
  start_date: string;
  created_at?: string;
  updated_at?: string;
}

export async function createProgram(
  program: Omit<WorkoutProgram, 'id' | 'created_at' | 'updated_at'>,
): Promise<WorkoutProgram> {
  const { data, error } = await supabase
    .from('workout_programs')
    .insert({
      user_id: program.user_id,
      name: program.name,
      description: program.description ?? null,
      generator_mode: program.generator_mode,
      params: program.params as never,
      week_count: program.week_count,
      start_date: program.start_date,
    })
    .select()
    .single();

  if (error) throw error;
  notifyDataChanged('workouts');
  return data as unknown as WorkoutProgram;
}

export async function getPrograms(userId: string): Promise<WorkoutProgram[]> {
  const { data, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as WorkoutProgram[];
}

export async function getProgramById(programId: string): Promise<WorkoutProgram | null> {
  const { data, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as WorkoutProgram) ?? null;
}

/**
 * Egy program a hozzá tartozó (program_id-vel kötött) edzésekkel, hét/sorrend szerint rendezve.
 */
export async function getProgramWithWorkouts(
  programId: string,
  userId: string,
): Promise<{ program: WorkoutProgram | null; workouts: Workout[] }> {
  const program = await getProgramById(programId);
  if (!program) {
    return { program: null, workouts: [] };
  }

  const allWorkouts = await getWorkouts(userId);
  const workouts = allWorkouts
    .filter((workout) => workout.program_id === programId)
    .sort((a, b) => (a.program_sequence ?? 0) - (b.program_sequence ?? 0));

  return { program, workouts };
}

/**
 * Program törlése. A workouts.program_id FK ON DELETE CASCADE miatt a hozzá tartozó
 * session-ök is törlődnek.
 */
export async function deleteProgram(programId: string): Promise<void> {
  const { error } = await supabase
    .from('workout_programs')
    .delete()
    .eq('id', programId);

  if (error) throw error;
  notifyDataChanged('workouts');
}
