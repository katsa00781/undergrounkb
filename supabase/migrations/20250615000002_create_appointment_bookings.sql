-- Migration: Create appointment_bookings table
-- Description: Creates a new table to store appointment bookings

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
