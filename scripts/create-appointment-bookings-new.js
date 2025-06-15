const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAppointmentBookingsTable() {
  console.log('Creating appointment_bookings table...');
  
  // Run SQL using Supabase RPC
  const { error } = await supabase.rpc('execute_sql', {
    sql_query: `
    -- Fix appointments tables discrepancy
    DO $$
    BEGIN
      -- Create appointment_bookings table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.appointment_bookings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'confirmed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );

      -- Copy data if old table exists
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments_participants') THEN
        INSERT INTO public.appointment_bookings (appointment_id, user_id, created_at, status)
        SELECT appointment_id, user_id, created_at, 'confirmed'
        FROM public.appointments_participants
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- Enable RLS
      ALTER TABLE public.appointment_bookings ENABLE ROW LEVEL SECURITY;
      
      -- Create basic policies
      DROP POLICY IF EXISTS "Anyone can view bookings" ON public.appointment_bookings;
      CREATE POLICY "Anyone can view bookings"
        ON public.appointment_bookings FOR SELECT
        USING (true);
        
      DROP POLICY IF EXISTS "Users can manage their own bookings" ON public.appointment_bookings;
      CREATE POLICY "Users can manage their own bookings"
        ON public.appointment_bookings FOR ALL
        USING (auth.uid() = user_id);
    
    END$$;
    
    -- Create necessary function for cancellations
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
    console.error('Error creating table:', error);
    // Try with direct SQL
    console.log('Falling back to direct SQL execution...');
    try {
      // Execute SQL directly
      const { error: sqlError } = await supabase.from('_sqljs').rpc('execute_sql', {
        sql: `
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
        console.error('Error with direct SQL execution:', sqlError);
      } else {
        console.log('Table created successfully with fallback method!');
      }
    } catch (fallbackError) {
      console.error('Fallback approach failed:', fallbackError);
    }
  } else {
    console.log('Table created successfully!');
  }
  
  // Check if table exists now
  try {
    const { data, error: checkError } = await supabase
      .from('appointment_bookings')
      .select('count')
      .limit(1);
      
    if (checkError) {
      console.error('Table still not accessible:', checkError);
    } else {
      console.log('Table verified to exist and be accessible!');
    }
  } catch (checkError) {
    console.error('Error checking table:', checkError);
  }
}

// Run the function
createAppointmentBookingsTable()
  .catch(console.error)
  .finally(() => {
    console.log('Script execution completed.');
  });
