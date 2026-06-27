-- Séma-drift javítás: az `exercises` táblából az élő DB-ben hiányzott az
-- `image_url` és `video_url` oszlop, pedig a kód (ExerciseForm, types/supabase.ts)
-- és az eredeti create migráció (20250613210000) is számít rájuk.
-- Tünet: "Could not find the 'image_url' column of 'exercises' in the schema cache".

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS video_url TEXT;
