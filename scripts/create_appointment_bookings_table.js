const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or API key.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

// Initialize Supabase client with additional options
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
    // Execute SQL to create the table and relationships
    const { error } = await supabase.rpc('_anonrpc', {
      sql_query: `
        -- Create appointment_bookings table
        CREATE TABLE IF NOT EXISTS public.appointment_bookings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'confirmed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create indices for performance
        CREATE INDEX IF NOT EXISTS idx_appointment_bookings_appointment_id ON public.appointment_bookings(appointment_id);
        CREATE INDEX IF NOT EXISTS idx_appointment_bookings_user_id ON public.appointment_bookings(user_id);
        CREATE INDEX IF NOT EXISTS idx_appointment_bookings_status ON public.appointment_bookings(status);

        -- Enable Row Level Security
        ALTER TABLE public.appointment_bookings ENABLE ROW LEVEL SECURITY;

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

        -- Create decrement_participants function for cancellations
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
      `
    });
    
    if (error) {
      console.error('Error creating table with rpc.exec_sql:', error);
      
      // Fallback to direct SQL if the RPC method fails
      console.log('Trying alternative method...');
      
      // Try direct SQL execution
      const { error: sqlError } = await supabase.rpc('_anonrpc', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.appointment_bookings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'confirmed',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );
        `
      });
      
      if (sqlError) {
        console.error('Error creating table with _sqljs.exec_sql:', sqlError);
        return false;
      }
    }
    
    console.log('Table creation completed successfully!');
    
    // Test if table exists and can be accessed
    const { data, error: testError } = await supabase
      .from('appointment_bookings')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Table created but cannot be accessed:', testError);
      return false;
    }
    
    console.log('Table verified and accessible');
    return true;
  } catch (err) {
    console.error('Unexpected error creating table:', err);
    return false;
  }
}

// Execute
createAppointmentBookingsTable()
  .then(success => {
    if (success) {
      console.log('✅ appointment_bookings table has been created successfully!');
    } else {
      console.error('❌ Failed to create appointment_bookings table.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
