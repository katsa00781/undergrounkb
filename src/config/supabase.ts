import { createClient } from '@supabase/supabase-js';
import { SupabaseManager } from '../lib/SupabaseManager';
import { config } from 'dotenv';

// Load environment variables in Node.js environment
if (typeof process !== 'undefined' && process.env) {
  try {
    config();
  } catch (error) {
    console.error('Error loading dotenv:', error);
  }
}

// Load environment variables
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  // Try to load from process.env first (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  }

  // If not found in process.env, try import.meta.env (Vite)
  if ((!supabaseUrl || !supabaseAnonKey) && typeof import.meta !== 'undefined' && import.meta.env) {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  // Log environment status (helpful for debugging)
  console.log('Environment variables status:');
  console.log('- VITE_SUPABASE_URL:', supabaseUrl ? supabaseUrl : 'Missing');
  console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '********' : 'Missing');

  // Validate URL format
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    throw new Error('Invalid Supabase URL format. Must start with https://');
  }

  // Validate anon key format (should be a JWT token)
  if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
    throw new Error('Invalid Supabase anon key format. Should be a JWT token starting with "eyJ"');
  }

} catch (error) {
  console.error('Error loading environment variables:', error);
  supabaseUrl = '';
  supabaseAnonKey = '';
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\nMissing or invalid Supabase environment variables.');
  console.error('Please ensure you have created a .env file with:');
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.error('\nYou can find these values in your Supabase project settings under Project Settings > API');
  throw new Error('Missing or invalid Supabase environment variables');
}

// Initialize Supabase client with additional options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
    debug: true // Enable debug mode to see more detailed auth logs
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public' // Explicitly set the schema
  }
});

// Create and export the unified Supabase manager
export const connectionManager = SupabaseManager.getInstance(supabase);

// Helper function to check if Supabase connection is working
export async function checkSupabaseConnection() {
  return await connectionManager.checkConnection();
}

// Helper function to cleanup all managers
export function cleanupSupabaseManagers() {
  connectionManager.cleanup();
}

// Helper function to get current user role
export async function getCurrentUserRole(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return 'anonymous';
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.warn('Could not fetch user role:', error);
      return 'user'; // Default to 'user' role if we can't fetch the profile
    }

    return profile?.role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}
