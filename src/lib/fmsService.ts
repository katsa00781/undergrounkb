import { supabase } from '../config/supabase';
import { toast } from '../components/ui/use-toast';
import { isCurrentUserAdmin } from './userService';

export interface FMSAssessment {
  id: string;
  user_id: string;
  date: string;
  deep_squat: number;
  hurdle_step_left: number;
  hurdle_step_right: number;
  inline_lunge_left: number;
  inline_lunge_right: number;
  shoulder_mobility_left: number;
  shoulder_mobility_right: number;
  active_straight_leg_raise_left: number;
  active_straight_leg_raise_right: number;
  trunk_stability_pushup: number;
  rotary_stability_left: number;
  rotary_stability_right: number;
  total_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFMSAssessmentData {
  date: string;
  deep_squat: number;
  hurdle_step_left: number;
  hurdle_step_right: number;
  inline_lunge_left: number;
  inline_lunge_right: number;
  shoulder_mobility_left: number;
  shoulder_mobility_right: number;
  active_straight_leg_raise_left: number;
  active_straight_leg_raise_right: number;
  trunk_stability_pushup: number;
  rotary_stability_left: number;
  rotary_stability_right: number;
  notes?: string;
}

// Helper function to show toast messages
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  if (typeof window !== 'undefined') {
    toast({
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type === 'success' ? 'default' : 'destructive',
    });
  } else {

  }
};

// Calculate total FMS score
function calculateTotalScore(assessment: CreateFMSAssessmentData): number {
  const scores = [
    assessment.deep_squat,
    Math.min(assessment.hurdle_step_left, assessment.hurdle_step_right),
    Math.min(assessment.inline_lunge_left, assessment.inline_lunge_right),
    Math.min(assessment.shoulder_mobility_left, assessment.shoulder_mobility_right),
    Math.min(assessment.active_straight_leg_raise_left, assessment.active_straight_leg_raise_right),
    assessment.trunk_stability_pushup,
    Math.min(assessment.rotary_stability_left, assessment.rotary_stability_right)
  ];

  return scores.reduce((sum, score) => sum + score, 0);
}

// Create a new FMS assessment
export async function createFMSAssessment(data: CreateFMSAssessmentData): Promise<FMSAssessment | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      showToast('You must be logged in to create an assessment', 'error');
      return null;
    }

    const totalScore = calculateTotalScore(data);
    const { data: assessment, error } = await supabase
      .from('fms_assessments')
      .insert([{
        ...data,
        user_id: user.id,
        total_score: totalScore
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating FMS assessment:', error);
      showToast('Error creating FMS assessment', 'error');
      return null;
    }

    showToast('FMS assessment created successfully');
    return assessment;
  } catch (error) {
    console.error('Error in createFMSAssessment:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Get user's latest FMS assessment
export async function getLatestFMSAssessment(userId: string): Promise<FMSAssessment | null> {
  try {
    const { data: assessment, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Error fetching latest FMS assessment:', error);
      showToast('Error fetching latest FMS assessment', 'error');
      return null;
    }

    return assessment;
  } catch (error) {
    console.error('Error in getLatestFMSAssessment:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Get all FMS assessments for a user
export async function getUserFMSAssessments(userId: string): Promise<FMSAssessment[]> {
  try {
    const { data: assessments, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching FMS assessments:', error);
      showToast('Error fetching FMS assessments', 'error');
      return [];
    }

    return assessments;
  } catch (error) {
    console.error('Error in getUserFMSAssessments:', error);
    showToast('Unexpected error occurred', 'error');
    return [];
  }
}

// Get all FMS assessments (admin only)
export async function getAllFMSAssessments(): Promise<FMSAssessment[]> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      showToast('Only administrators can view all assessments', 'error');
      return [];
    }

    const { data: assessments, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching all FMS assessments:', error);
      showToast('Error fetching all FMS assessments', 'error');
      return [];
    }

    return assessments;
  } catch (error) {
    console.error('Error in getAllFMSAssessments:', error);
    showToast('Unexpected error occurred', 'error');
    return [];
  }
}

// Delete an FMS assessment
export async function deleteFMSAssessment(assessmentId: string): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      showToast('You must be logged in to delete an assessment', 'error');
      return false;
    }

    // Check if the user owns the assessment or is an admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      const { data: assessment } = await supabase
        .from('fms_assessments')
        .select('user_id')
        .eq('id', assessmentId)
        .single();

      if (!assessment || assessment.user_id !== user.id) {
        showToast('You can only delete your own assessments', 'error');
        return false;
      }
    }

    const { error } = await supabase
      .from('fms_assessments')
      .delete()
      .eq('id', assessmentId);

    if (error) {
      console.error('Error deleting FMS assessment:', error);
      showToast('Error deleting FMS assessment', 'error');
      return false;
    }

    showToast('FMS assessment deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteFMSAssessment:', error);
    showToast('Unexpected error occurred', 'error');
    return false;
  }
}

// Update an FMS assessment
export async function updateFMSAssessment(
  assessmentId: string,
  data: Partial<CreateFMSAssessmentData>
): Promise<FMSAssessment | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      showToast('You must be logged in to update an assessment', 'error');
      return null;
    }

    // Check if the user owns the assessment or is an admin
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      const { data: assessment } = await supabase
        .from('fms_assessments')
        .select('user_id')
        .eq('id', assessmentId)
        .single();

      if (!assessment || assessment.user_id !== user.id) {
        showToast('You can only update your own assessments', 'error');
        return null;
      }
    }

    // Get the current assessment to calculate the new total score
    const { data: currentAssessment } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (!currentAssessment) {
      showToast('Assessment not found', 'error');
      return null;
    }

    // Merge current and new data to calculate total score
    const mergedData = { ...currentAssessment, ...data };
    const totalScore = calculateTotalScore(mergedData);

    const { data: updatedAssessment, error } = await supabase
      .from('fms_assessments')
      .update({
        ...data,
        total_score: totalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating FMS assessment:', error);
      showToast('Error updating FMS assessment', 'error');
      return null;
    }

    showToast('FMS assessment updated successfully');
    return updatedAssessment;
  } catch (error) {
    console.error('Error in updateFMSAssessment:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
} 