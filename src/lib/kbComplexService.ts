import { supabase } from '../config/supabase';

export type KbComplexExercise = {
  exerciseId: string;
  exerciseName: string;
  reps: number | string;
};

export type KbComplex = {
  id: string;
  user_id: string;
  name: string;
  rounds: number;
  rest_between_rounds: number;
  exercises: KbComplexExercise[];
  created_at: string;
  updated_at: string;
};

export type KbComplexInsert = {
  name: string;
  rounds: number;
  rest_between_rounds: number;
  exercises: KbComplexExercise[];
};

export async function listKbComplexes(userId: string): Promise<KbComplex[]> {
  const { data, error } = await supabase
    .from('kb_complexes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as KbComplex[];
}

export async function createKbComplex(
  userId: string,
  input: KbComplexInsert,
): Promise<KbComplex> {
  const { data, error } = await supabase
    .from('kb_complexes')
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as KbComplex;
}

export async function deleteKbComplex(id: string): Promise<void> {
  const { error } = await supabase.from('kb_complexes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
