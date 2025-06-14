import { supabase } from '../config/supabase';

export interface FMSAssessment {
  id: string;
  user_id: string;
  date: string;
  deep_squat: number;
  hurdle_step: number;
  inline_lunge: number;
  shoulder_mobility: number;
  active_straight_leg_raise: number;
  trunk_stability_pushup: number;
  rotary_stability: number;
  total_score: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export async function createFMSAssessment(assessment: Omit<FMSAssessment, 'id' | 'created_at' | 'updated_at' | 'total_score'>) {
  console.log('Creating FMS assessment:', assessment);
  
  try {
    // Create a copy of the assessment object for the database operation
    const assessmentToInsert = { ...assessment };
    
    const { data, error } = await supabase
      .from('fms_assessments')
      .insert(assessmentToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error inserting FMS assessment:', error);
      throw error;
    }
    
    console.log('FMS assessment created successfully:', data);
    return data as FMSAssessment;
  } catch (error) {
    console.error('Exception in createFMSAssessment:', error);
    throw error;
  }
}

export async function getLatestFMSAssessment(userId: string) {
  const { data, error } = await supabase
    .from('fms_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as FMSAssessment | null;
}

export async function getFMSAssessments(userId: string) {
  try {
    console.log('Fetching FMS assessments for user:', userId);
    
    const { data, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching FMS assessments:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} FMS assessments`);
    return data as FMSAssessment[];
  } catch (error) {
    console.error('Exception in getFMSAssessments:', error);
    throw error;
  }
}

export async function getAllUsers() {
  try {
    console.log('Fetching all users from profiles table');
    
    // First, log the Supabase connection status
    console.log('Supabase connection check...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .order('email');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    console.log(`Raw data from profiles table (${data.length} records):`, JSON.stringify(data, null, 2));
    
    // Format the data to include a display name
    const formattedData = data.map(user => {
      // Log each user for debugging
      console.log('User data from DB:', {
        id: user.id,
        email: user.email,
        first_name: user.first_name !== null ? `"${user.first_name}"` : 'null',
        last_name: user.last_name !== null ? `"${user.last_name}"` : 'null',
        role: user.role
      });
      
      // Create a name with available information
      let displayName;
      if (user.first_name && user.last_name) {
        displayName = `${user.first_name} ${user.last_name}`;
      } else if (user.first_name) {
        displayName = user.first_name;
      } else if (user.email) {
        displayName = user.email;
      } else {
        displayName = `User ${user.id.slice(0, 8)}...`;
      }
      
      console.log(`Display name for ${user.id}: "${displayName}"`);
      
      return {
        id: user.id,
        email: user.email,
        name: displayName
      };
    });
    
    console.log(`Formatted user data (${formattedData.length} records):`, JSON.stringify(formattedData, null, 2));
    return formattedData;
  } catch (error) {
    console.error('Exception in getAllUsers:', error);
    throw error;
  }
}