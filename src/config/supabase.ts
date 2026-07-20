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

// After a long idle/backgrounded tab, the browser can silently kill the
// underlying TCP connection without ever surfacing an error to `fetch`.
// Without a timeout, the resulting request (and any `finally { setLoading(false) }`
// that depends on it) hangs forever, so pages spin indefinitely instead of
// erroring out and letting the user retry.
const FETCH_TIMEOUT_MS = 20000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  if (init?.signal) {
    init.signal.addEventListener('abort', () => controller.abort());
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Initialize Supabase client with additional options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Use PKCE flow for better security
    debug: true // Enable debug mode to see more detailed auth logs
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    },
    fetch: fetchWithTimeout
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
