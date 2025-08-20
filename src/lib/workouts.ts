import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

export interface WorkoutSection {
  name: string;
  exercises: {
    exerciseId: string;
    sets: number;
    reps: number | string; // Support both number and string for reps
    weight?: number;
    notes?: string;
    restPeriod?: number;
    // Personal tracking fields
    actualSets?: number;
    actualReps?: number | string;
    actualWeight?: number;
    personalNotes?: string;
    completed?: boolean;
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
  // Shared workout fields
  is_template?: boolean;
  original_workout_id?: string;
  shared_from?: string;
  appointment_id?: string;
}

// Define the database types
export type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
export type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];

export async function createWorkout(workout: Omit<Workout, 'id' | 'created_at' | 'updated_at'>) {

  try {
    // Create a copy of the workout object for the database operation
    const workoutToInsert = {
      ...workout,
      // Ensure the sections field is properly formatted as JSON
      sections: workout.sections
    };

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

        return newData as Workout;
      }

      throw error;
    }

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

/**
 * Copy a workout from the admin (trainer) to a user when they book an appointment for that day
 * @param appointmentDate - The date of the appointment (YYYY-MM-DD format)
 * @param adminId - The ID of the trainer/admin
 * @param userId - The ID of the user who booked the appointment
 * @returns The copied workout, or null if no workout was found
 */
export async function copyWorkoutToUser(appointmentDate: string, adminId: string, userId: string) {
  try {

    // Find the admin's workout for the appointment date
    const { data: adminWorkouts, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', adminId)
      .eq('date', appointmentDate)
      .order('created_at', { ascending: false }) // Get the most recent one if multiple exist
      .limit(1);

    if (fetchError) {
      console.error('Error finding admin workout:', fetchError);
      return null;
    }

    if (!adminWorkouts || adminWorkouts.length === 0) {
      console.warn(`No workout found for admin ${adminId} on date ${appointmentDate}`);
      return null;
    }

    const adminWorkout = adminWorkouts[0];

    // Process the workout to ensure sections are properly parsed
    if (adminWorkout.sections && typeof adminWorkout.sections === 'string') {
      try {
        adminWorkout.sections = JSON.parse(adminWorkout.sections);
      } catch (e) {
        console.error('Error parsing sections JSON:', e);
      }
    }

    // Create a new workout for the user based on the admin's workout
    const newUserWorkout = {
      title: `${adminWorkout.title} (Assigned)`,
      date: appointmentDate,
      duration: adminWorkout.duration,
      notes: adminWorkout.notes ? `${adminWorkout.notes}\n\nAssigned from trainer session.` : 'Assigned from trainer session.',
      sections: adminWorkout.sections,
      user_id: userId
    };

    // Insert the new workout for the user
    const { data: newWorkout, error: insertError } = await supabase
      .from('workouts')
      .insert(newUserWorkout)
      .select()
      .single();

    if (insertError) {
      console.error('Error copying workout to user:', insertError);
      return null;
    }

    return newWorkout as Workout;
  } catch (error) {
    console.error('Exception in copyWorkoutToUser:', error);
    return null;
  }
}

// Share workout with appointment participants
export async function shareWorkoutWithParticipants(workoutId: string, appointmentId: string) {
  try {
    // Get the original workout
    const { data: originalWorkout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (workoutError || !originalWorkout) {
      throw new Error('Workout not found');
    }

    // Get appointment participants
    const { data: bookings, error: bookingsError } = await supabase
      .from('appointment_bookings')
      .select('user_id, profiles!inner(id, first_name, last_name)')
      .eq('appointment_id', appointmentId)
      .eq('status', 'confirmed');

    if (bookingsError) {
      throw new Error('Error fetching participants');
    }

    // Parse sections if needed
    let sections = originalWorkout.sections;
    if (typeof sections === 'string') {
      sections = JSON.parse(sections);
    }

    // Create personal copies for each participant
    const personalWorkouts = [];
    
    for (const booking of bookings) {
      const personalWorkout = {
        title: `${originalWorkout.title} (Shared)`,
        date: originalWorkout.date,
        duration: originalWorkout.duration,
        notes: `${originalWorkout.notes || ''}\n\nShared from group session.`,
        sections: sections,
        user_id: booking.user_id,
        is_template: false,
        original_workout_id: workoutId,
        shared_from: originalWorkout.user_id,
        appointment_id: appointmentId
      };

      const { data: newWorkout, error: insertError } = await supabase
        .from('workouts')
        .insert(personalWorkout)
        .select()
        .single();

      if (!insertError && newWorkout) {
        personalWorkouts.push(newWorkout);
      }
    }

    return personalWorkouts;
  } catch (error) {
    console.error('Error sharing workout with participants:', error);
    throw error;
  }
}

// Update personal workout with actual performance
export async function updatePersonalWorkoutPerformance(
  workoutId: string, 
  sectionIndex: number, 
  exerciseIndex: number, 
  performance: {
    actualSets?: number;
    actualReps?: number | string;
    actualWeight?: number;
    personalNotes?: string;
    completed?: boolean;
  }
) {
  try {
    // Get the current workout
    const { data: workout, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (fetchError || !workout) {
      throw new Error('Workout not found');
    }

    // Parse sections
    let sections = workout.sections;
    if (typeof sections === 'string') {
      sections = JSON.parse(sections);
    }

    // Update the specific exercise with performance data
    if (sections[sectionIndex] && sections[sectionIndex].exercises[exerciseIndex]) {
      sections[sectionIndex].exercises[exerciseIndex] = {
        ...sections[sectionIndex].exercises[exerciseIndex],
        ...performance
      };
    }

    // Update the workout
    const { data: updatedWorkout, error: updateError } = await supabase
      .from('workouts')
      .update({ sections })
      .eq('id', workoutId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedWorkout;
  } catch (error) {
    console.error('Error updating workout performance:', error);
    throw error;
  }
}

// Get workout progress/trend data for a user
export async function getWorkoutProgressTrend(userId: string, exerciseId?: string, dateRange?: { start: string; end: string }) {
  try {
    let query = supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (dateRange) {
      query = query.gte('date', dateRange.start).lte('date', dateRange.end);
    }

    const { data: workouts, error } = await query;

    if (error) {
      throw error;
    }

    // Process workouts to extract progress data
    const progressData: Array<{
      date: string;
      workoutTitle: string;
      exerciseId: string;
      exerciseName: string;
      plannedSets: number;
      actualSets?: number;
      plannedReps: number | string;
      actualReps?: number | string;
      plannedWeight?: number;
      actualWeight?: number;
      completed?: boolean;
    }> = [];

    workouts.forEach(workout => {
      let sections = workout.sections;
      if (typeof sections === 'string') {
        sections = JSON.parse(sections);
      }

      sections.forEach((section: WorkoutSection) => {
        section.exercises.forEach((exercise) => {
          if (!exerciseId || exercise.exerciseId === exerciseId) {
            progressData.push({
              date: workout.date,
              workoutTitle: workout.title,
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseId, // TODO: Get actual exercise name
              plannedSets: exercise.sets,
              actualSets: exercise.actualSets,
              plannedReps: exercise.reps,
              actualReps: exercise.actualReps,
              plannedWeight: exercise.weight,
              actualWeight: exercise.actualWeight,
              completed: exercise.completed
            });
          }
        });
      });
    });

    return progressData;
  } catch (error) {
    console.error('Error getting workout progress trend:', error);
    throw error;
  }
}