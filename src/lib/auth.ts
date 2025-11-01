import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';
import { handleSupabaseError, SupabaseError } from './supabaseUtils';
import toast from 'react-hot-toast';

export const AUTH_TIMEOUT = 1000 * 60 * 60; // 1 hour
let sessionTimeoutId: NodeJS.Timeout | null = null;

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function ensureUserProfile(user: User) {
  const email = user.email;
  if (!email || !isValidEmail(email)) {
    console.error('Invalid email address');
    return; // Don't throw, just return
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected for new users
      console.error('Error fetching profile:', error);
      return; // Don't throw, just return
    }

    if (!profile) {
      await createUserProfile(user);
    }

    startSessionTimeout();
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    // Don't re-throw to avoid loop
  }
}

async function createUserProfile(user: User) {
  const userData = user.user_metadata || {};
  
  try {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: userData.name || user.email?.split('@')[0] || 'User',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating profile:', insertError);
      // Don't throw to avoid loop
      return;
    }

    toast.success('Profile created successfully');
  } catch (error) {
    console.error('Error creating user profile:', error);
    // Don't re-throw to avoid loop
  }
}

function startSessionTimeout() {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
  }

  sessionTimeoutId = setTimeout(async () => {
    try {
      await supabase.auth.signOut();
      toast('Session expired. Please sign in again.', { icon: 'ℹ️' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, AUTH_TIMEOUT);
}

export function clearSessionTimeout() {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
}

export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }

    if (session) {
      startSessionTimeout();
      return session;
    }
    
    return null;
  } catch (error) {
    await handleSupabaseError(error);
    return null;
  }
} 