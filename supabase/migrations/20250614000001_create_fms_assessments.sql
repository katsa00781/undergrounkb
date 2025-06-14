-- Create the FMS assessments table
CREATE TABLE IF NOT EXISTS public.fms_assessments (
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

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS fms_assessments_user_id_idx ON public.fms_assessments (user_id);

-- Create an index on date for faster sorting
CREATE INDEX IF NOT EXISTS fms_assessments_date_idx ON public.fms_assessments (date);

-- Set up RLS (Row Level Security)
ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for row-level security
-- Allow users to view their own assessments
CREATE POLICY "Users can view their own assessments" 
  ON public.fms_assessments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own assessments
CREATE POLICY "Users can insert their own assessments" 
  ON public.fms_assessments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own assessments
CREATE POLICY "Users can update their own assessments" 
  ON public.fms_assessments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own assessments
CREATE POLICY "Users can delete their own assessments" 
  ON public.fms_assessments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow service role admin access
CREATE POLICY "Service role has full access" 
  ON public.fms_assessments 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fms_assessments_updated_at ON public.fms_assessments;

CREATE TRIGGER update_fms_assessments_updated_at
BEFORE UPDATE ON public.fms_assessments
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();
