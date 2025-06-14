import { supabase } from '../config/supabase';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  movement_pattern: string;
  difficulty: number; // Changed to match database schema (1-5)
  description?: string;
  instructions?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  is_active: boolean;
}

export const CATEGORIES = [
  'Strength Training',
  'Cardio',
  'Kettlebell',
  'Mobility/Flexibility',
  'HIIT',
  'Recovery'
] as const;

export const MOVEMENT_PATTERNS: { [key: string]: string[] } = {
  'Kettlebell': [
    'Gait – törzs stabilitás',
    'Gait mászásban – törzs stabilitás',
    'Csípő domináns – bilaterális (FMS aktív lábemelés)',
    'Csípő domináns – unilaterális (ASLR)',
    'Térd domináns – bilaterális (ASLR)',
    'Térd domináns – unilaterális (Kitörés)',
    'Horizontális nyomás – bilaterális (SM + törzs)',
    'Horizontális nyomás – unilaterális (SM + törzs)',
    'Horizontális húzás – bilaterális (SM)',
    'Horizontális húzás – unilaterális (SM + törzs)',
    'Vertikális nyomás – bilaterális',
    'Vertikális nyomás – unilaterális (SM + törzs)',
    'Vertikális húzás – bilaterális',
    'Stabilitás – anti-extenzió',
    'Stabilitás – anti-rotáció',
    'Stabilitás – anti-flexió',
    'Core – egyéb',
    'Lokális gyakorlatok (L)',
    'Felsőtest mobilizálás',
    'ASLR korrekció – első pár',
    'ASLR korrekció – második hármas',
    'SM korrekció – első pár',
    'SM korrekció – második hármas',
    'Stabilitás korrekció',
    'Mobilizálás'
  ],
  'Mobility/Flexibility': [],
  'Recovery': []
};

export async function getExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Exercise[];
}

export async function createExercise(exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) throw error;
  return data as Exercise;
}

export async function updateExercise(id: string, exercise: Partial<Exercise>) {
  const { data, error } = await supabase
    .from('exercises')
    .update(exercise)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Exercise;
}

export async function deleteExercise(id: string) {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id);

  if (error) throw error;
}