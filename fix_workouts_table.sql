-- STEP 1: Drop the existing workouts table if it has wrong structure
DROP TABLE IF EXISTS public.workouts CASCADE;

-- STEP 2: Create the workouts table with correct structure
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- STEP 3: Enable Row Level Security
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS policies
-- Policy for users to see only their own workouts
CREATE POLICY "Users can view their own workouts" 
  ON public.workouts FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own workouts
CREATE POLICY "Users can insert their own workouts" 
  ON public.workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own workouts
CREATE POLICY "Users can update their own workouts" 
  ON public.workouts FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own workouts
CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts FOR DELETE 
  USING (auth.uid() = user_id);

-- STEP 5: Create index for performance
CREATE INDEX idx_workouts_user_id_date ON public.workouts(user_id, date DESC);

-- STEP 6: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workouts_updated_at 
    BEFORE UPDATE ON public.workouts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 7: Grant necessary permissions
GRANT ALL ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;
