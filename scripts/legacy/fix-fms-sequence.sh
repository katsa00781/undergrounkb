#!/bin/zsh
# filepath: /Users/kacsorzsolt/Downloads/ugkettlebellpro/fix-fms-sequence.sh

# Script to fix the "relation fms_assessments_id_seq does not exist" error
# This occurs when there's a sequence issue with the FMS table

echo "==============================================="
echo "     FMS Table Sequence Error Fix Script"
echo "==============================================="

# Create a temporary SQL file
TMP_SQL=$(mktemp)
cat > $TMP_SQL << 'EOL'
-- Make sure we have the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fms_assessments') THEN
    -- Table exists, check if it's using UUID or SERIAL for ID
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'fms_assessments' 
      AND column_name = 'id'
      AND data_type = 'uuid'
    ) THEN
      RAISE NOTICE 'Table is already using UUID for ID, no conversion needed.';
    ELSE
      -- Need to convert table to use UUID instead of SERIAL
      RAISE NOTICE 'Converting table from SERIAL to UUID...';
      
      -- Create a backup of the existing table
      CREATE TABLE public.fms_assessments_backup AS SELECT * FROM public.fms_assessments;
      
      -- Drop the original table
      DROP TABLE public.fms_assessments CASCADE;
      
      -- Create the new table with UUID
      CREATE TABLE public.fms_assessments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        deep_squat SMALLINT NOT NULL CHECK (deep_squat BETWEEN 0 AND 3),
        hurdle_step SMALLINT NOT NULL CHECK (hurdle_step BETWEEN 0 AND 3),
        inline_lunge SMALLINT NOT NULL CHECK (inline_lunge BETWEEN 0 AND 3),
        shoulder_mobility SMALLINT NOT NULL CHECK (shoulder_mobility BETWEEN 0 AND 3),
        active_straight_leg_raise SMALLINT NOT NULL CHECK (active_straight_leg_raise BETWEEN 0 AND 3),
        trunk_stability_pushup SMALLINT NOT NULL CHECK (trunk_stability_pushup BETWEEN 0 AND 3),
        rotary_stability SMALLINT NOT NULL CHECK (rotary_stability BETWEEN 0 AND 3),
        total_score SMALLINT GENERATED ALWAYS AS (
          deep_squat + hurdle_step + inline_lunge + shoulder_mobility + 
          active_straight_leg_raise + trunk_stability_pushup + rotary_stability
        ) STORED,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );
      
      -- Try to restore data if possible, converting any numeric IDs to UUIDs
      BEGIN
        INSERT INTO public.fms_assessments (
          id, user_id, date, deep_squat, hurdle_step, inline_lunge, 
          shoulder_mobility, active_straight_leg_raise, trunk_stability_pushup, 
          rotary_stability, notes, created_at, updated_at
        )
        SELECT 
          uuid_generate_v4() AS id, 
          user_id, date, deep_squat, hurdle_step, inline_lunge, 
          shoulder_mobility, active_straight_leg_raise, trunk_stability_pushup, 
          rotary_stability, notes, created_at, updated_at
        FROM public.fms_assessments_backup;
        
        RAISE NOTICE 'Data restored from backup.';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not restore data: %', SQLERRM;
      END;
    END IF;
  ELSE
    -- Table doesn't exist, create it with UUID
    RAISE NOTICE 'Creating new FMS table with UUID...';
    
    CREATE TABLE public.fms_assessments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      deep_squat SMALLINT NOT NULL CHECK (deep_squat BETWEEN 0 AND 3),
      hurdle_step SMALLINT NOT NULL CHECK (hurdle_step BETWEEN 0 AND 3),
      inline_lunge SMALLINT NOT NULL CHECK (inline_lunge BETWEEN 0 AND 3),
      shoulder_mobility SMALLINT NOT NULL CHECK (shoulder_mobility BETWEEN 0 AND 3),
      active_straight_leg_raise SMALLINT NOT NULL CHECK (active_straight_leg_raise BETWEEN 0 AND 3),
      trunk_stability_pushup SMALLINT NOT NULL CHECK (trunk_stability_pushup BETWEEN 0 AND 3),
      rotary_stability SMALLINT NOT NULL CHECK (rotary_stability BETWEEN 0 AND 3),
      total_score SMALLINT GENERATED ALWAYS AS (
        deep_squat + hurdle_step + inline_lunge + shoulder_mobility + 
        active_straight_leg_raise + trunk_stability_pushup + rotary_stability
      ) STORED,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );
  END IF;
  
  -- Create or recreate indexes
  CREATE INDEX IF NOT EXISTS fms_assessments_user_id_idx ON public.fms_assessments (user_id);
  CREATE INDEX IF NOT EXISTS fms_assessments_date_idx ON public.fms_assessments (date);
  
  -- Enable RLS
  ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own assessments" ON public.fms_assessments;
  DROP POLICY IF EXISTS "Users can insert their own assessments" ON public.fms_assessments;
  DROP POLICY IF EXISTS "Users can update their own assessments" ON public.fms_assessments;
  DROP POLICY IF EXISTS "Users can delete their own assessments" ON public.fms_assessments;
  DROP POLICY IF EXISTS "Service role has full access" ON public.fms_assessments;
  
  -- Create policies
  CREATE POLICY "Users can view their own assessments" 
    ON public.fms_assessments FOR SELECT 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can insert their own assessments" 
    ON public.fms_assessments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can update their own assessments" 
    ON public.fms_assessments FOR UPDATE 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can delete their own assessments" 
    ON public.fms_assessments FOR DELETE 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Service role has full access" 
    ON public.fms_assessments FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');
    
  -- Create a trigger to update the updated_at timestamp
  CREATE OR REPLACE FUNCTION update_fms_modified_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Drop and recreate the trigger
  DROP TRIGGER IF EXISTS update_fms_assessments_updated_at ON public.fms_assessments;
  CREATE TRIGGER update_fms_assessments_updated_at
  BEFORE UPDATE ON public.fms_assessments
  FOR EACH ROW
  EXECUTE PROCEDURE update_fms_modified_column();

  -- Grant appropriate permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.fms_assessments TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.fms_assessments TO service_role;
  
END $$;
EOL

# Guide the user on what to do
echo "Ez a script segít az FMS tábla szekvencia hibájának javításában."
echo "A 'relation fms_assessments_id_seq does not exist' hiba általában akkor fordul elő,"
echo "amikor az ID oszlop típusa nem megfelelő."
echo
echo "A javításhoz használd az elkészített SQL fájlt a Supabase SQL Editorban."
echo "A SQL fájl itt található: $TMP_SQL"
echo
echo "Végrehajtandó lépések:"
echo
echo "1. Másold ki a fenti SQL fájl tartalmát"
echo "2. Jelentkezz be a Supabase fiókodba"
echo "3. Nyisd meg a projekt SQL Editorát"
echo "4. Illessz be az SQL kódot és futtasd le"
echo

# Offer to open the file
echo -n "Szeretnéd megnyitni a SQL fájlt most? (y/n): "
read answer

if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
  # Try different methods to open the file
  if command -v code &> /dev/null; then
    code "$TMP_SQL"
  elif command -v open &> /dev/null; then
    open -e "$TMP_SQL"
  elif command -v nano &> /dev/null; then
    nano "$TMP_SQL"
  elif command -v vi &> /dev/null; then
    vi "$TMP_SQL"
  else
    echo "A fájl megnyitása nem sikerült automatikusan."
    echo "Kérlek nyisd meg manuálisan: $TMP_SQL"
  fi
fi

echo
echo "==============================================="
echo "     A sikeres telepítés után"
echo "==============================================="
echo
echo "Ha a telepítés sikeres volt, teszteld az FMS"
echo "funkcionalitást az alkalmazásban!"
echo

# Make the script executable
chmod +x "$0"
