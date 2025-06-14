-- Create workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  sections JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

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
