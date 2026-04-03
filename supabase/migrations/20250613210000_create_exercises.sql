DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_category') THEN
    CREATE TYPE exercise_category AS ENUM (
      'strength_training',
      'cardio',
      'kettlebell',
      'mobility_flexibility',
      'hiit',
      'recovery'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_pattern') THEN
    CREATE TYPE movement_pattern AS ENUM (
      'gait_stability',
      'gait_crawling',
      'hip_dominant_bilateral',
      'hip_dominant_unilateral',
      'knee_dominant_bilateral',
      'knee_dominant_unilateral',
      'horizontal_push_bilateral',
      'horizontal_push_unilateral',
      'horizontal_pull_bilateral',
      'horizontal_pull_unilateral',
      'vertical_push_bilateral',
      'vertical_push_unilateral',
      'vertical_pull_bilateral',
      'stability_anti_extension',
      'stability_anti_rotation',
      'stability_anti_flexion',
      'core_other',
      'local_exercises',
      'upper_body_mobility',
      'aslr_correction_first',
      'aslr_correction_second',
      'sm_correction_first',
      'sm_correction_second',
      'stability_correction',
      'mobilization'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  category exercise_category NOT NULL,
  movement_pattern movement_pattern NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true NOT NULL
);

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern ON public.exercises(movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON public.exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON public.exercises(created_by);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON public.exercises;
CREATE POLICY "Exercises are viewable by everyone"
  ON public.exercises 
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage exercises" ON public.exercises;
CREATE POLICY "Admins can manage exercises"
  ON public.exercises
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update timestamp on update
CREATE OR REPLACE FUNCTION update_exercise_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_exercise_timestamp_trigger ON public.exercises;
CREATE TRIGGER update_exercise_timestamp_trigger
BEFORE UPDATE ON public.exercises
FOR EACH ROW EXECUTE FUNCTION update_exercise_timestamp();

-- Grant permissions
GRANT ALL ON public.exercises TO authenticated;
