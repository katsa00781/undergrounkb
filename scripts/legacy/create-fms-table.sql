-- FMS assessments table creation script (compatible with direct SQL execution)
-- Use this script in the Supabase SQL Editor to create the FMS assessments table

-- Ensure that the uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, check if the table exists and drop it if required
DROP TABLE IF EXISTS public.fms_assessments CASCADE;

-- Create FMS assessments table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS fms_assessments_user_id_idx ON public.fms_assessments (user_id);
CREATE INDEX IF NOT EXISTS fms_assessments_date_idx ON public.fms_assessments (date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own assessments" ON public.fms_assessments;
    DROP POLICY IF EXISTS "Users can insert their own assessments" ON public.fms_assessments;
    DROP POLICY IF EXISTS "Users can update their own assessments" ON public.fms_assessments;
    DROP POLICY IF EXISTS "Users can delete their own assessments" ON public.fms_assessments;
    DROP POLICY IF EXISTS "Service role has full access" ON public.fms_assessments;

    -- Re-create policies
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

END$$;

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

-- Note: No need for sequence permissions as we're using UUID primary keys
