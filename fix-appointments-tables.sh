#!/bin/bash

# Script to fix the appointments table structure by directly modifying frontend code

# Display header
echo "============================"
echo "Appointments Table Fix Script"
echo "============================"
echo

# Find out if we need to modify the code
echo "Checking current code implementation..."

APPOINTMENTS_FILE="src/lib/appointments.ts"
if [ ! -f "$APPOINTMENTS_FILE" ]; then
    echo "Error: Appointments file not found at $APPOINTMENTS_FILE"
    exit 1
fi

# Count occurrences of appointment_bookings and appointments_participants
BOOKINGS_COUNT=$(grep -c "appointment_bookings" "$APPOINTMENTS_FILE")
PARTICIPANTS_COUNT=$(grep -c "appointments_participants" "$APPOINTMENTS_FILE")

echo "Found $BOOKINGS_COUNT references to 'appointment_bookings'"
echo "Found $PARTICIPANTS_COUNT references to 'appointments_participants'"

if [ $PARTICIPANTS_COUNT -gt 0 ]; then
    echo "Need to update code to use 'appointment_bookings' instead of 'appointments_participants'"
    sed -i.bak "s/appointments_participants/appointment_bookings/g" "$APPOINTMENTS_FILE"
    echo "Code updated successfully!"
elif [ $BOOKINGS_COUNT -gt 0 ]; then
    echo "Code already uses 'appointment_bookings', no changes needed."
else
    echo "Warning: Could not find any references to appointment bookings in the code."
    echo "Manual inspection of $APPOINTMENTS_FILE is recommended."
fi

# Add information about updating database structure
echo
echo "=============================================="
echo "For the database fix to take full effect:"
echo "=============================================="
echo "1. Ensure your Supabase instance is running"
echo "2. Apply the migration using Supabase dashboard:"
echo "   - Navigate to your Supabase project"
echo "   - Go to SQL Editor"
echo "   - Run the following SQL:"
echo 
cat <<'EOSQL'
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
        status = CASE 
            WHEN (GREATEST(0, current_count - 1)) < max_count THEN 'available'
            ELSE 'booked'
        END,
        updated_at = now()
    WHERE id = decrement_participants.appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
EOSQL

echo
echo "3. Restart the application"
echo
echo "Appointments fix completed!"
