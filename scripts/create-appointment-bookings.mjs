// Script to create the appointment_bookings table in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
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

async function createAppointmentBookingsTable() {
  console.log('==============================');
  console.log('Creating Appointment Bookings Table');
  console.log('==============================');
  
  try {
    console.log('Checking if table already exists...');
    
    // Check if appointment_bookings already exists
    const { error: tableError } = await supabase
      .from('appointment_bookings')
      .select('count')
      .limit(1);

    if (!tableError) {
      console.log('appointment_bookings table already exists.');
      return true;
    }
    
    console.log('appointment_bookings table does not exist. Creating it...');
    
    // Check if appointments_participants exists (old table name)
    const { error: oldTableError } = await supabase
      .from('appointments_participants')
      .select('count')
      .limit(1);

    const hasOldTable = !oldTableError;
    
    console.log(`Old table appointments_participants ${hasOldTable ? 'exists' : 'does not exist'}.`);
    
    // Create the table
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
      throw new Error('Failed to create table.');
    }
    
    console.log('Creating indices...');
    
    // Create indices
    const createIndicesQuery = `
      CREATE INDEX IF NOT EXISTS idx_appointment_bookings_appointment_id ON public.appointment_bookings(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_appointment_bookings_user_id ON public.appointment_bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_appointment_bookings_status ON public.appointment_bookings(status);
    `;
    
    const { error: indicesError } = await supabase.rpc('_anonrpc', { 
      sql_query: createIndicesQuery 
    });
    
    if (indicesError) {
      console.error('Error creating indices:', indicesError);
      // Continue anyway
    }
    
    // Enable RLS
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
    
    // Create policies
    console.log('Creating RLS policies...');
    
    const createPoliciesQuery = `
      -- Create policies
      DROP POLICY IF EXISTS "Users can view their own bookings" ON public.appointment_bookings;
      CREATE POLICY "Users can view their own bookings"
        ON public.appointment_bookings FOR SELECT
        USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Admin can view all bookings" ON public.appointment_bookings;
      CREATE POLICY "Admin can view all bookings"
        ON public.appointment_bookings FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
          )
        );

      DROP POLICY IF EXISTS "Users can create their own bookings" ON public.appointment_bookings;
      CREATE POLICY "Users can create their own bookings"
        ON public.appointment_bookings FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update their own bookings" ON public.appointment_bookings;
      CREATE POLICY "Users can update their own bookings"
        ON public.appointment_bookings FOR UPDATE
        USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Admin can update any booking" ON public.appointment_bookings;
      CREATE POLICY "Admin can update any booking"
        ON public.appointment_bookings FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
          )
        );

      DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.appointment_bookings;
      CREATE POLICY "Users can delete their own bookings"
        ON public.appointment_bookings FOR DELETE
        USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Admin can delete any booking" ON public.appointment_bookings;
      CREATE POLICY "Admin can delete any booking"
        ON public.appointment_bookings FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
          )
        );
    `;
    
    const { error: policiesError } = await supabase.rpc('_anonrpc', { 
      sql_query: createPoliciesQuery 
    });
    
    if (policiesError) {
      console.error('Error creating policies:', policiesError);
      // Continue anyway
    }
    
    // Add RPC function
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
    
    // If old table exists, copy data
    if (hasOldTable) {
      console.log('Copying data from old table...');
      
      const copyDataQuery = `
        INSERT INTO public.appointment_bookings (appointment_id, user_id, created_at, status)
        SELECT appointment_id, user_id, created_at, 'confirmed'
        FROM public.appointments_participants
        ON CONFLICT DO NOTHING;
      `;
      
      const { error: copyError } = await supabase.rpc('_anonrpc', { 
        sql_query: copyDataQuery 
      });
      
      if (copyError) {
        console.error('Error copying data:', copyError);
        // Continue anyway
      }
    }
    
    // Verify the table was created successfully
    const { error: verifyError } = await supabase
      .from('appointment_bookings')
      .select('count')
      .limit(1);
      
    if (verifyError) {
      console.error('Error verifying table creation:', verifyError);
      throw new Error('Failed to verify table creation');
    }
    
    console.log('\nTable creation completed successfully!');
    return true;
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Run the script
createAppointmentBookingsTable()
  .then(success => {
    if (success) {
      console.log('✅ appointment_bookings table has been created successfully!');
      process.exit(0);
    } else {
      console.error('❌ Failed to create appointment_bookings table.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
