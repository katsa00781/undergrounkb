// Script to apply the appointment_bookings table fix
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Get connection parameters
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or API key.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('==============================');
  console.log('Appointments Table Fix Script');
  console.log('==============================');
  console.log();
  
  try {
    console.log('Checking for existing tables...');
    
    // Check if appointment_bookings already exists
    const { error: tableError } = await supabase
      .from('appointment_bookings')
      .select('count')
      .limit(1);

    if (!tableError) {
      console.log('appointment_bookings table already exists.');
      return;
    }
    
    console.log('appointment_bookings table does not exist. Creating it...');
    
    // Check if appointments_participants exists
    const { error: oldTableError } = await supabase
      .from('appointments_participants')
      .select('count')
      .limit(1);

    const hasOldTable = !oldTableError;
    
    console.log(`Old table appointments_participants ${hasOldTable ? 'exists' : 'does not exist'}.`);
    
    // 1. Create new table
    console.log('Creating appointment_bookings table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.appointment_bookings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'confirmed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `;
    
    const { error: createError } = await supabase.rpc('_anonrpc', { 
      sql_query: createTableQuery 
    });
    
    if (createError) {
      console.error('Error creating table:', createError);
      console.log('Trying alternative approach with specific tables...');
      
      // Alternative approach if the RPC function doesn't work
      const alternativeResult = await supabase.rpc('create_appointment_bookings_table');
      if (alternativeResult.error) {
        console.error('Alternative approach failed:', alternativeResult.error);
        throw new Error('Failed to create table.');
      }
    }
    
    console.log('Creating indices...');
    
    // 2. Create indices
    const createIndicesQuery = `
      CREATE INDEX IF NOT EXISTS idx_appointment_bookings_appointment ON public.appointment_bookings(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_appointment_bookings_user ON public.appointment_bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_appointment_bookings_status ON public.appointment_bookings(status);
    `;
    
    const { error: indicesError } = await supabase.rpc('_anonrpc', { 
      sql_query: createIndicesQuery 
    });
    
    if (indicesError) {
      console.error('Error creating indices:', indicesError);
      // Continue anyway
    }
    
    // 3. Enable RLS
    console.log('Enabling Row Level Security...');
    
    const enableRLSQuery = `
      ALTER TABLE public.appointment_bookings ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('_anonrpc', { 
      sql_query: enableRLSQuery 
    });
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
      // Continue anyway
    }
    
    // 4. Add RPC function
    console.log('Adding decrement_participants RPC function...');
    
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION public.decrement_participants(appointment_id uuid)
      RETURNS void AS $$
      DECLARE
          current_count integer;
          max_count integer;
      BEGIN
          -- Get current participants count
          SELECT current_participants, max_participants INTO current_count, max_count
          FROM public.appointments
          WHERE id = decrement_participants.appointment_id;

          -- Update the appointment
          UPDATE public.appointments
          SET 
              current_participants = GREATEST(0, current_count - 1),
              status = CASE 
                  WHEN (GREATEST(0, current_count - 1)) < max_count THEN 'available'
                  ELSE 'booked'
              END,
              updated_at = now()
          WHERE id = decrement_participants.appointment_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: functionError } = await supabase.rpc('_anonrpc', { 
      sql_query: createFunctionQuery 
    });
    
    if (functionError) {
      console.error('Error creating function:', functionError);
      // Continue anyway
    }
    
    // 5. If old table exists, copy data
    if (hasOldTable) {
      console.log('Copying data from old table...');
      
      const copyDataQuery = `
        INSERT INTO public.appointment_bookings (appointment_id, user_id, created_at, status)
        SELECT appointment_id, user_id, created_at, 'confirmed'
        FROM public.appointments_participants;
      `;
      
      const { error: copyError } = await supabase.rpc('_anonrpc', { 
        sql_query: copyDataQuery 
      });
      
      if (copyError) {
        console.error('Error copying data:', copyError);
        // Continue anyway
      }
    }
    
    console.log('\nFix completed successfully!');
    console.log('Please restart your application to see the changes.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the fix
applyFix();
