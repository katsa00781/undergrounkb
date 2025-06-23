import { supabase, connectionManager, cleanupSupabaseManagers } from '../config/supabase';
import { testSupabaseConnection } from './supabaseUtils';
import { ensureUserProfile as ensureUserProfileAuth, clearSessionTimeout } from './auth';
import toast from 'react-hot-toast';

/**
 * Initialize Supabase connection and set up listeners
 * This function should be called once at app startup
 */
export async function initializeSupabase(): Promise<boolean> {
  try {
    // Test the connection
    const isConnected = await connectionManager.checkConnection();
    if (!isConnected) {
      console.error('Failed to connect to Supabase');
      toast.error('Database connection failed. Some features may not work properly.');
      return false;
    }

    // Set up auth state change listener to sync user data
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureUserProfileAuth(session.user);
      } else {
        clearSessionTimeout();
      }
    });

    // Set up realtime subscriptions for critical data
    await setupRealtimeSubscriptions();

    // Set up more comprehensive connection test
    const fullConnectionTest = await testSupabaseConnection();
    if (!fullConnectionTest) {
      console.warn('Comprehensive Supabase connection test failed');
      toast.error('Some database features may not be available');
      return false;
    }

    console.log('Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    toast.error('Failed to initialize database connection');
    return false;
  }
}

/**
 * Set up realtime subscriptions for critical data
 */
async function setupRealtimeSubscriptions() {
  // Subscribe to profile changes
  await connectionManager.subscribe(
    'public:profiles',
    'UPDATE',
    async (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (payload.new && payload.old) {
        // Handle profile updates - no need to sync to users table anymore
        // All user data is now stored only in profiles table
        console.log('Profile updated:', payload.new.id);
      }
    }
  );

  // Add more subscriptions as needed
}

/**
 * Cleanup function to be called when the app is unmounted
 */
export function cleanupSupabase(): void {
  cleanupSupabaseManagers();
}

/**
 * Check if the current user has a valid profile
 * If not, create one with default values
 */
export async function ensureUserProfile(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking user profile:', profileError);
      return;
    }

    // If no profile exists, create one
    if (!profile) {
      const userData = user.user_metadata || {};
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          name: userData.name || user.email?.split('@')[0] || 'User',
          role: 'user'
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return;
      }

      // Note: We no longer need to create records in the users table
      // All user data is now stored in the profiles table

      console.log('Created new user profile');
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error);
  }
}
