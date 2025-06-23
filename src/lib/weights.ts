import { supabase } from '../config/supabase';

export interface WeightMeasurement {
  id: string;
  user_id: string;
  weight: number;
  created_at?: string;
  // Nem módosítjuk a fő típusdefiníciót a kompatibilitás miatt
  // Ha van date vagy notes mező a komponensekben, akkor azok továbbra is elérhetőek
  date?: string;
  notes?: string;
  updated_at?: string;
}

export const getWeightMeasurements = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_weights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching weight measurements:', error);
    throw error;
  }
  
  // Átalakítjuk az adatokat, hogy kompatibilisek legyenek a WeightMeasurement interfész-szel
  // Ha a UI date mezőt használ a created_at helyett, ezt itt konvertáljuk
  const formattedData = data?.map(item => ({
    ...item,
    date: item.date || new Date(item.created_at).toISOString().split('T')[0]
  }));

  return formattedData as WeightMeasurement[];
};

export const createWeightMeasurement = async (measurement: Omit<WeightMeasurement, 'id' | 'created_at' | 'updated_at'>) => {
  // Előkészítjük az adatokat a user_weights tábla formátumához
  const weightData = {
    user_id: measurement.user_id,
    weight: measurement.weight,
    // Ha van date mező a bemeneti adatokban, azt is tároljuk
    ...(measurement.date && { date: measurement.date }),
    ...(measurement.notes && { notes: measurement.notes })
  };

  const { data, error } = await supabase
    .from('user_weights')
    .insert(weightData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as WeightMeasurement;
};

export const deleteWeightMeasurement = async (id: string) => {
  const { error } = await supabase
    .from('user_weights')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};