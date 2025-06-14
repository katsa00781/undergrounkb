import { supabase } from '../config/supabase';

export interface WeightMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const getWeightMeasurements = async (userId: string) => {
  const { data, error } = await supabase
    .from('weight_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  return data as WeightMeasurement[];
};

export const createWeightMeasurement = async (measurement: Omit<WeightMeasurement, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('weight_measurements')
    .insert(measurement)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as WeightMeasurement;
};