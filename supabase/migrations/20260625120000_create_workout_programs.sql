-- Microciklus / többhetes program támogatás.
-- Új workout_programs tábla + a workouts tábla 1:N kötése (FK-oszlopok),
-- mivel egy generált session pontosan egy programhoz tartozik (junction tábla nem szükséges).

CREATE TABLE IF NOT EXISTS public.workout_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  generator_mode TEXT NOT NULL,          -- 'periodized' | 'pwron' | 'longevity'
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  week_count INTEGER NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own workout programs" ON public.workout_programs;
CREATE POLICY "Users can view their own workout programs"
  ON public.workout_programs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout programs" ON public.workout_programs;
CREATE POLICY "Users can insert their own workout programs"
  ON public.workout_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout programs" ON public.workout_programs;
CREATE POLICY "Users can update their own workout programs"
  ON public.workout_programs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workout programs" ON public.workout_programs;
CREATE POLICY "Users can delete their own workout programs"
  ON public.workout_programs FOR DELETE
  USING (auth.uid() = user_id);

-- A workouts tábla program-kötése. ON DELETE CASCADE: a program törlése elviszi a session-öket.
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS program_week INTEGER,
  ADD COLUMN IF NOT EXISTS program_day_label TEXT,
  ADD COLUMN IF NOT EXISTS program_sequence INTEGER;

CREATE INDEX IF NOT EXISTS idx_workouts_program_id ON public.workouts(program_id);
