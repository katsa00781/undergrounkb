import { supabase } from '../config/supabase';
import { notifyDataChanged } from '../utils/dataRefresh';

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

export interface FMSAssessmentSubject {
  userId: string;
  displayName: string;
  fullName: string | null;
  email: string | null;
  latestAssessmentDate: string | null;
  latestAssessmentCreatedAt: string | null;
  latestTotalScore: number | null;
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

    notifyDataChanged('fms');
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

export async function listFMSAssessmentSubjects(): Promise<FMSAssessmentSubject[]> {
  try {
    const { data: assessments, error: assessmentsError } = await supabase
      .from('fms_assessments')
      .select('user_id, date, created_at, total_score')
      .order('created_at', { ascending: false });

    if (assessmentsError) {
      console.error('Error fetching FMS assessment subjects:', assessmentsError);
      throw assessmentsError;
    }

    const latestByUserId = new Map<string, {
      date: string | null;
      created_at: string | null;
      total_score: number | null;
    }>();

    for (const assessment of assessments || []) {
      if (!assessment.user_id || latestByUserId.has(assessment.user_id)) {
        continue;
      }

      latestByUserId.set(assessment.user_id, {
        date: assessment.date ?? null,
        created_at: assessment.created_at ?? null,
        total_score: assessment.total_score ?? null,
      });
    }

    const userIds = Array.from(latestByUserId.keys());
    if (userIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching FMS subject profiles:', profilesError);
      throw profilesError;
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

    return userIds
      .map((userId) => {
        const profile = profileMap.get(userId);
        const latestAssessment = latestByUserId.get(userId);
        const displayName = profile?.full_name || profile?.email || `FMS alany ${userId.slice(0, 8)}`;

        return {
          userId,
          displayName,
          fullName: profile?.full_name || null,
          email: profile?.email || null,
          latestAssessmentDate: latestAssessment?.date || null,
          latestAssessmentCreatedAt: latestAssessment?.created_at || null,
          latestTotalScore: latestAssessment?.total_score || null,
        } satisfies FMSAssessmentSubject;
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName, 'hu'));
  } catch (error) {
    console.error('Exception in listFMSAssessmentSubjects:', error);
    throw error;
  }
}