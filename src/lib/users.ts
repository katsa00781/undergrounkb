import { supabase } from '../config/supabase';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
}

// Helper function to sync data between profiles and users tables
async function syncUserData(id: string, data: Partial<User>) {
  try {
    // Update users table
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id);
    
    if (error) {
      console.warn('Failed to sync user data to users table:', error);
    }
  } catch (err) {
    console.error('Error syncing user data:', err);
  }
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at, updated_at')
    .order('name');

  if (error) throw error;
  return data as User[];
}

export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as User;
}

export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
  // First create in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .insert({ ...user, role: user.role || 'user' })
    .select()
    .single();

  if (error) throw error;

  // Then create in users table
  try {
    await supabase
      .from('users')
      .insert({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role
      });
  } catch (err) {
    console.warn('Failed to create user in users table:', err);
    // Don't throw error here as the profile was created successfully
  }

  return data as User;
}

export async function updateUser(id: string, user: Partial<User>) {
  // Update profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update(user)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Sync with users table
  await syncUserData(id, user);

  return data as User;
}

export async function deleteUser(id: string) {
  // Delete from profiles table
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Delete from users table
  try {
    await supabase
      .from('users')
      .delete()
      .eq('id', id);
  } catch (err) {
    console.warn('Failed to delete user from users table:', err);
    // Don't throw error here as the profile was deleted successfully
  }
}

export async function getCurrentUserRole(): Promise<'admin' | 'user'> {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user found when checking role');
      return 'user';
    }

    // Try to get the role from profiles table first
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profileError && profileData?.role) {
      console.log(`User role from profiles: ${profileData.role}`);
      return profileData.role as 'admin' | 'user';
    }

    if (profileError) {
      console.warn('Error fetching user role from profiles:', profileError);
    }

    // If profiles table fails, try the users table as fallback
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userError && userData?.role) {
      console.log(`User role from users table: ${userData.role}`);
      
      // Sync the role back to profiles if needed
      if (profileError || (profileData && profileData.role !== userData.role)) {
        try {
          await supabase
            .from('profiles')
            .update({ role: userData.role })
            .eq('id', user.id);
          console.log('Synced role from users to profiles');
        } catch (syncError) {
          console.error('Failed to sync role to profiles:', syncError);
        }
      }
      
      return userData.role as 'admin' | 'user';
    }

    if (userError) {
      console.warn('Error fetching user role from users:', userError);
    }

    // Default to user if all else fails
    console.warn('Could not determine user role, defaulting to "user"');
    return 'user';
  } catch (error) {
    console.error('Unexpected error in getCurrentUserRole:', error);
    return 'user';
  }
}

export async function makeUserAdmin(email: string) {
  // Update profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', email)
    .select()
    .single();

  if (error) throw error;

  // Sync with users table
  try {
    await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email);
  } catch (err) {
    console.warn('Failed to update user role in users table:', err);
    // Don't throw error here as the profile was updated successfully
  }

  return data as User;
}
