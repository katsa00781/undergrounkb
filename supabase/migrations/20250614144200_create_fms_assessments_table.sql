-- Create FMS assessments table
CREATE TABLE public.fms_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  deep_squat INTEGER NOT NULL,
  hurdle_step INTEGER NOT NULL,
  inline_lunge INTEGER NOT NULL,
  shoulder_mobility INTEGER NOT NULL,
  active_straight_leg_raise INTEGER NOT NULL,
  trunk_stability_pushup INTEGER NOT NULL,
  rotary_stability INTEGER NOT NULL,
  total_score INTEGER GENERATED ALWAYS AS (
    deep_squat + hurdle_step + inline_lunge + shoulder_mobility + 
    active_straight_leg_raise + trunk_stability_pushup + rotary_stability
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own assessments
CREATE POLICY "Users can view their own FMS assessments" 
  ON public.fms_assessments FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own assessments
CREATE POLICY "Users can insert their own FMS assessments" 
  ON public.fms_assessments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own assessments
CREATE POLICY "Users can update their own FMS assessments" 
  ON public.fms_assessments FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own assessments
CREATE POLICY "Users can delete their own FMS assessments" 
  ON public.fms_assessments FOR DELETE 
  USING (auth.uid() = user_id);
