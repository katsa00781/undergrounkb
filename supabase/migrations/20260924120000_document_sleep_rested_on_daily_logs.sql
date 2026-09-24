-- Szubjektív kipihentség (1–5) az alvás-pontszám mellé. Az oszlopot a mobil app
-- (Underground KB Mobile) `add_sleep_rested_to_daily_logs` migrációja hozta létre a
-- közös Supabase projekten — ez a fájl csak DOKUMENTÁLJA a sémát (IF NOT EXISTS, így
-- újrafuttatva no-op). RLS: nincs változás, a meglévő daily_logs policy-k lefedik.
-- 1 = nagyon fáradt … 5 = teljesen kipihent; NULL = nincs kitöltve.

ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS sleep_rested SMALLINT
    CHECK (sleep_rested BETWEEN 1 AND 5);
