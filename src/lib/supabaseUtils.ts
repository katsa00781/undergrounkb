import { supabase, getCurrentUserRole } from '../config/supabase';
import { toast } from '../components/ui/use-toast';
import toastReact from 'react-hot-toast';

/**
 * Utility functions for working with Supabase
 */

export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Error handler for Supabase operations
export async function handleSupabaseError(error: any) {
  const errorCode = error?.code || 'UNKNOWN_ERROR';
  const errorMessage = error?.message || 'An unknown error occurred';

  console.error(`Supabase Error [${errorCode}]:`, error);
  if (typeof toastReact !== 'undefined') {
    toastReact.error(errorMessage);
  }

  throw new SupabaseError(errorMessage, errorCode, error);
}

// Check if a table exists in the database
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01') { // Table does not exist
        return false;
      }
      if (error.code === '42P17') { // Infinite recursion in policy
        console.warn(`Policy recursion detected for table ${tableName}, assuming table exists`);
        return true;
      }
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// This function is deprecated as we no longer need to sync between profiles and users tables
// We now use only the profiles table for user data
export async function syncProfileToUser(_id: string, _data: Record<string, unknown>): Promise<void> {
  // This function is kept for backward compatibility but does nothing

  return;
}

// Retry a Supabase operation with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 300
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      retries++;

      // Check if we've reached max retries or if the error is not retryable
      if (retries >= maxRetries || 
          (err.code && ['42P01', '42501', '23505'].includes(err.code))) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Get the current authenticated user with error handling
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if the Supabase connection is working
export async function testSupabaseConnection(): Promise<boolean> {
  try {

    // Try to access the auth API

    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth API error:', {
        code: authError.status,
        message: authError.message
      });
      return false;
    }

    // Try to access a table

    const { error: tableError } = await supabase
      .from('exercises')
      .select('count')
      .limit(1);

    if (tableError) {
      // Ignore table not found errors and policy recursion errors
      if (tableError.code !== '42P01' && tableError.code !== '42P17') {
        console.error('Table access error:', {
          code: tableError.code,
          message: tableError.message,
          details: tableError.details
        });
        return false;
      }

      if (tableError.code === '42P17') {
        console.warn('Policy recursion detected, but connection is working');
      } else if (tableError.code === '42P01') {
        console.warn('Table does not exist, but connection is working');
      }
    } else {

    }

    // Test RPC function availability (not functionality)

    try {
      const { error: rpcError } = await supabase.rpc('decrement_participants', {
        appointment_id: '00000000-0000-0000-0000-000000000000'
      });

      // These error codes are acceptable:
      // 42501 - permission denied (expected for unauthorized users)
      // 42883 - function does not exist (might not be deployed yet)
      // 42P17 - policy recursion
      // P0001 - raise exception (business logic error)
      if (rpcError) {
        if (['42501', '42883', '42P17', 'P0001'].includes(rpcError.code)) {

        } else {
          console.error('RPC function error:', {
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details
          });
          return false;
        }
      } else {

      }
    } catch (error) {
      // Ignore RPC errors as they might be permission related
      console.warn('RPC test error (non-critical):', error);
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during connection test:', {
      type: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'N/A'
    });
    return false;
  }
}

// Types
export interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  avatar_url?: string;
}

// Helper function to show toast messages in browser environment
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

// Initialize or update user profile
export async function initializeUserProfile(userId: string, email: string): Promise<UserProfile | null> {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error fetching profile:', fetchError);
      showToast('Error fetching user profile', 'error');
      return null;
    }

    if (existingProfile) {
      return existingProfile as UserProfile;
    }

    // Create new profile if it doesn't exist
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email,
          role: 'user', // Default role for new users
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      showToast('Error creating user profile', 'error');
      return null;
    }

    showToast('Profile created successfully');
    return newProfile as UserProfile;
  } catch (error) {
    console.error('Error in initializeUserProfile:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    // Ensure user has permission to update profile
    const currentRole = await getCurrentUserRole();
    if (currentRole === 'anonymous') {
      showToast('You must be logged in to update your profile', 'error');
      return null;
    }

    // Remove protected fields from updates
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.role; // Role can only be updated by admins
    delete safeUpdates.created_at;
    safeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      showToast('Error updating profile', 'error');
      return null;
    }

    showToast('Profile updated successfully');
    return data as UserProfile;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      showToast('Error fetching user profile', 'error');
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    showToast('Unexpected error occurred', 'error');
    return null;
  }
}

// Admin function to update user role
export async function updateUserRole(
  userId: string,
  newRole: string
): Promise<boolean> {
  try {
    const currentRole = await getCurrentUserRole();
    if (currentRole !== 'admin') {
      showToast('Only administrators can update user roles', 'error');
      return false;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      showToast('Error updating user role', 'error');
      return false;
    }

    showToast('User role updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    showToast('Unexpected error occurred', 'error');
    return false;
  }
}
