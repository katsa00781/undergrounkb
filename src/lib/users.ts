import { supabase, connectionManager } from '../config/supabase';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user' | 'disabled';
  created_at?: string;
  updated_at?: string;
}

export async function getUsers() {
  console.log('Attempting to fetch users from profiles table...');
  
  try {
    // First check if the connection manager can connect to the database
    const isConnected = await connectionManager.checkConnection();
    console.log(`Supabase connection check: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
    
    if (!isConnected) {
      console.error('Cannot connect to Supabase database. Please check your configuration and network.');
      throw new Error('Database connection failed');
    }
    
    // Try to get the table schema to verify if the table exists and is accessible
    console.log('Checking if profiles table exists and is accessible...');
    const { error: schemaError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (schemaError) {
      console.error('Error accessing profiles table:', schemaError);
      throw schemaError;
    }
    
    // Now attempt to fetch the actual data, excluding disabled users
    console.log('Fetching active users from profiles table...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, updated_at')
      .neq('role', 'disabled')  // Filter out disabled users
      .order('full_name');
    
    if (error) {
      console.error('Error fetching users from profiles table:', error);
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.length || 0} active users from profiles table`);
    return data as User[];
  } catch (err) {
    console.error('Unexpected error in getUsers:', err);
    throw err;
  }
}

export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at, updated_at')
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
  // Soft delete: Set role to 'disabled' instead of hard delete
  console.log(`Soft deleting user ${id} by setting role to 'disabled'`);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'disabled' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error soft deleting user:', error);
    throw error;
  }
  
  console.log('User soft deleted successfully:', data);
  return data as User;
}

export async function getCurrentUserRole(): Promise<'admin' | 'user' | 'disabled'> {
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
      return profileData.role as 'admin' | 'user' | 'disabled';
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

export async function getAllUsers() {
  // Get all users including disabled ones (for admin purposes)
  console.log('Fetching all users including disabled ones...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, updated_at')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.length || 0} total users`);
    return data as User[];
  } catch (err) {
    console.error('Unexpected error in getAllUsers:', err);
    throw err;
  }
}

export async function restoreUser(id: string, newRole: 'admin' | 'user' = 'user') {
  // Restore a disabled user by setting their role back to admin or user
  console.log(`Restoring user ${id} with role ${newRole}`);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', id)
    .eq('role', 'disabled')  // Only restore if currently disabled
    .select()
    .single();

  if (error) {
    console.error('Error restoring user:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('User not found or not disabled');
  }
  
  console.log('User restored successfully:', data);
  return data as User;
}
