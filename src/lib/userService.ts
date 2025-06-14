import { supabase } from '../config/supabase';
import { toast } from '../components/ui/use-toast';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'anonymous';
  created_at: string;
  updated_at: string;
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
    console.log(message);
  }
};

// Get current user's profile
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Error getting current user:', authError);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
}

// Get user role using RPC function
export async function getUserRole(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_role', { user_id: userId });

    if (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }

    return data || 'user';
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return 'user';
  }
}

// Check if current user is admin using RPC function
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return false;
    }

    const { data, error } = await supabase
      .rpc('is_admin', { user_id: user.id });

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in isCurrentUserAdmin:', error);
    return false;
  }
}

// Get current user's role directly
export async function getCurrentUserRole(): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('get_current_user_role');

    if (error) {
      console.error('Error getting current user role:', error);
      return 'user';
    }

    return data || 'user';
  } catch (error) {
    console.error('Error in getCurrentUserRole:', error);
    return 'user';
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      showToast('You must be logged in to update profiles', 'error');
      return null;
    }

    if (!isAdmin && user.id !== userId) {
      showToast('You can only update your own profile', 'error');
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      showToast('Error updating profile', 'error');
      return null;
    }

    showToast('Profile updated successfully');
    return profile;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

// Get all user profiles (admin only)
export async function getAllUserProfiles(): Promise<Profile[]> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      showToast('Only administrators can view all profiles', 'error');
      return [];
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all profiles:', error);
      showToast('Error fetching profiles', 'error');
      return [];
    }

    return profiles;
  } catch (error) {
    console.error('Error in getAllUserProfiles:', error);
    showToast('Unexpected error occurred', 'error');
    return [];
  }
}

// Delete user profile (admin only)
export async function deleteUserProfile(userId: string): Promise<boolean> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      showToast('Only administrators can delete profiles', 'error');
      return false;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting profile:', error);
      showToast('Error deleting profile', 'error');
      return false;
    }

    showToast('Profile deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteUserProfile:', error);
    showToast('Unexpected error occurred', 'error');
    return false;
  }
}

// Create or update user profile on sign up/in
export async function upsertUserProfile(user: {
  id: string;
  email?: string;
}): Promise<Profile | null> {
  try {
    const updates = {
      id: user.id,
      email: user.email || '',
      updated_at: new Date().toISOString()
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(updates)
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    return null;
  }
} 