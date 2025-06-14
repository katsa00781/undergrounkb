import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

export interface WorkoutSection {
  name: string;
  exercises: {
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    restPeriod?: number;
  }[];
}

export interface Workout {
  id: string;
  title: string;
  date: string;
  duration: number;
  notes?: string;
  sections: WorkoutSection[];
  created_at?: string;
  updated_at?: string;
  user_id: string;
}

// Define the database types
export type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
export type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];

export async function createWorkout(workout: Omit<Workout, 'id' | 'created_at' | 'updated_at'>) {
  console.log('Creating workout:', workout);
  
  try {
    // Create a copy of the workout object for the database operation
    const workoutToInsert = {
      ...workout,
      // Ensure the sections field is properly formatted as JSON
      sections: workout.sections
    };
    
    console.log('Workout to insert:', workoutToInsert);
    
    const { data, error } = await supabase
      .from('workouts')
      .insert(workoutToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating workout:', error);
      
      // Check if error is JSON related and try alternative approach
      if (error.message && (
          error.message.includes('json') || 
          error.message.includes('jsonb') || 
          error.message.includes('column "sections"')
      )) {
        console.log('Trying with stringified sections...');
        
        const workoutWithStringifiedSections = {
          ...workout,
          sections: JSON.stringify(workout.sections)
        };
        
        const { data: newData, error: newError } = await supabase
          .from('workouts')
          .insert(workoutWithStringifiedSections)
          .select()
          .single();
          
        if (newError) {
          console.error('Still failed with stringified sections:', newError);
          throw newError;
        }
        
        console.log('Success with stringified sections:', newData);
        return newData as Workout;
      }
      
      throw error;
    }
    
    console.log('Workout created successfully:', data);
    return data as Workout;
  } catch (error) {
    console.error('Exception in createWorkout:', error);
    throw error;
  }
}

export async function getWorkouts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
    
    // Process the data to ensure sections are properly parsed
    const processedWorkouts = data?.map(workout => {
      // If sections is a string (stringified JSON), parse it
      if (workout.sections && typeof workout.sections === 'string') {
        try {
          workout.sections = JSON.parse(workout.sections);
        } catch (e) {
          console.error('Error parsing sections JSON:', e);
          // Keep it as is if parsing fails
        }
      }
      return workout;
    });
    
    return processedWorkouts as Workout[];
  } catch (error) {
    console.error('Exception in getWorkouts:', error);
    throw error;
  }
}

export async function updateWorkout(id: string, workout: Partial<Workout>) {
  const { data, error } = await supabase
    .from('workouts')
    .update(workout)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Workout;
}

export async function deleteWorkout(id: string) {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}