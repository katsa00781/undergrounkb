-- Admin gyakorlattár-átnézéshez: jelölhető, hogy egy gyakorlatot már ellenőriztek-e.
-- Alapból false, hogy a meglévő gyakorlatok "ellenőrizetlen"-ként induljanak.

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT false;
