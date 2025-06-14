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
    throw new SupabaseError('Invalid email address', 'INVALID_EMAIL');
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      await handleSupabaseError(error);
    }

    if (!profile) {
      await createUserProfile(user);
    }

    startSessionTimeout();
  } catch (error) {
    await handleSupabaseError(error);
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
        name: userData.name || user.email?.split('@')[0] || 'User',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      throw insertError;
    }

    toast.success('Profile created successfully');
  } catch (error) {
    await handleSupabaseError(error);
  }
}

function startSessionTimeout() {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
  }

  sessionTimeoutId = setTimeout(async () => {
    try {
      await supabase.auth.signOut();
      toast.info('Session expired. Please sign in again.');
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