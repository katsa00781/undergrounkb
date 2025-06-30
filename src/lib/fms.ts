import { supabase } from '../config/supabase';

export interface FMSAssessment {
  id: string;
  user_id: string;
  deep_squat: number;
  hurdle_step: number;
  inline_lunge: number;
  shoulder_mobility: number;
  active_straight_leg_raise: number;
  trunk_stability_pushup: number;
  rotary_stability: number;
  total_score?: number;
  notes?: string;
  assessed_by?: string;
  created_at?: string;
  updated_at?: string;
}

export async function createFMSAssessment(assessment: Omit<FMSAssessment, 'id' | 'created_at' | 'updated_at' | 'total_score'>) {

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

    return data as FMSAssessment;
  } catch (error) {
    console.error('Exception in createFMSAssessment:', error);
    throw error;
  }
}

export async function getLatestFMSAssessment(userId: string) {
  try {

    const { data, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest FMS assessment:', error);
      throw error;
    }

    return data as FMSAssessment | null;
  } catch (error) {
    console.error('Exception in getLatestFMSAssessment:', error);
    throw error;
  }
}

export async function getFMSAssessments(userId: string) {
  try {

    const { data, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching FMS assessments:', error);
      throw error;
    }

    return data as FMSAssessment[];
  } catch (error) {
    console.error('Exception in getFMSAssessments:', error);
    throw error;
  }
}

export async function getAllUsers() {
  try {

    // First, log the Supabase connection status

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('email');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    // Format the data to include a display name
    const formattedData = data.map(user => {
      // Log each user for debugging

      // Create a name with available information
      let displayName;
      if (user.full_name) {
        displayName = user.full_name;
      } else if (user.email) {
        displayName = user.email;
      } else {
        displayName = `User ${user.id.slice(0, 8)}...`;
      }

      return {
        id: user.id,
        email: user.email,
        full_name: displayName,
        name: displayName // A kompatibilitás miatt megtartjuk
      };
    });

    return formattedData;
  } catch (error) {
    console.error('Exception in getAllUsers:', error);
    throw error;
  }
}