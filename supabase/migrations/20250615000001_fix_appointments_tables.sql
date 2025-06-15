-- Fix the discrepancy between code and database table names
-- Code is using 'appointment_bookings', but database has 'appointments_participants'

-- Drop the old table if it exists (after copying data if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appointments_participants'
  ) THEN
    -- Create the new table if it doesn't exist already
    CREATE TABLE IF NOT EXISTS public.appointment_bookings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
    
    -- Copy data from old table to new table
    INSERT INTO public.appointment_bookings (appointment_id, user_id, created_at, status)
    SELECT appointment_id, user_id, created_at, 'confirmed'
    FROM public.appointments_participants;
    
    -- Drop the old table after migrating data
    DROP TABLE IF EXISTS public.appointments_participants;
  ELSE
    -- If old table doesn't exist, just create the new one if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.appointment_bookings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
  END IF;
END$$;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_appointment ON public.appointment_bookings(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_user ON public.appointment_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_status ON public.appointment_bookings(status);

-- Enable Row Level Security
ALTER TABLE public.appointment_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for the new table
CREATE POLICY "Bookings are viewable by everyone"
    ON public.appointment_bookings FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own bookings"
    ON public.appointment_bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
    ON public.appointment_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookings"
    ON public.appointment_bookings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all bookings"
    ON public.appointment_bookings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.appointment_bookings TO authenticated;

-- Add RPC function for decrement_participants
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
