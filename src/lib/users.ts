import { supabase } from '../config/supabase';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
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
  // Create in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .insert({ ...user, role: user.role || 'user' })
    .select()
    .single();

  if (error) throw error;
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
  return data as User;
}

export async function deleteUser(id: string) {
  // Delete from profiles table
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getCurrentUserRole(): Promise<'admin' | 'user'> {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user found when checking role');
      return 'user';
    }

    // Get the role from profiles table
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
  return data as User;
}
