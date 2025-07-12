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

  try {
    // First check if the connection manager can connect to the database
    const isConnected = await connectionManager.checkConnection();

    if (!isConnected) {
      console.error('Cannot connect to Supabase database. Please check your configuration and network.');
      throw new Error('Database connection failed');
    }

    // Try to get the table schema to verify if the table exists and is accessible

    const { error: schemaError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (schemaError) {
      console.error('Error accessing profiles table:', schemaError);
      throw schemaError;
    }

    // Now attempt to fetch the actual data, excluding disabled users

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, updated_at')
      .neq('role', 'disabled')  // Filter out disabled users
      .order('full_name');

    if (error) {
      console.error('Error fetching users from profiles table:', error);
      throw error;
    }

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
  // MEGHÍVÓ RENDSZER: Felhasználó létrehozás helyett meghívót küldünk
  try {
    const inviteData = {
      email: user.email,
      role: user.role === 'disabled' ? 'user' : user.role // disabled role-t user-re alakítjuk
    } as const;

    // Meghívó létrehozása az új invite service-szel
    const { createInvite } = await import('./invites');
    const invite = await createInvite(inviteData);
    
    // Visszatérünk egy "mock" user objektummal a UI kompatibilitás miatt
    return {
      id: invite.id, // invite id-t használjuk
      email: invite.email,
      full_name: `[PENDING INVITE] ${invite.email}`,
      role: invite.role,
      created_at: invite.created_at,
      updated_at: invite.updated_at
    } as User;
    
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
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
  // Use RPC function for soft delete via admin function
  const { error } = await supabase
    .rpc('delete_admin_user', {
      user_id: id
    });

  if (error) {
    console.error('RPC Error soft deleting user:', error);
    throw error;
  }

  return true;
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

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, updated_at')
      .order('full_name');

    if (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }

    return data as User[];
  } catch (err) {
    console.error('Unexpected error in getAllUsers:', err);
    throw err;
  }
}

export async function restoreUser(id: string, newRole: 'admin' | 'user' = 'user') {
  // Use RPC function to restore user via admin function
  const { error } = await supabase
    .rpc('restore_admin_user', {
      user_id: id,
      new_role: newRole
    });

  if (error) {
    console.error('RPC Error restoring user:', error);
    throw error;
  }

  return true;
}
