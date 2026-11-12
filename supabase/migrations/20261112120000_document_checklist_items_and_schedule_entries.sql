-- Szerkeszthető napi végrehajtás + műszakonkénti napirend. Az oszlopokat a mobil app
-- (Underground KB Mobile) `add_checklist_items_and_schedule_entries_to_lifestyle_settings`
-- migrációja hozta létre a közös Supabase projekten — ez a fájl csak DOKUMENTÁLJA a
-- sémát (IF NOT EXISTS, így újrafuttatva no-op). RLS: nincs változás, a meglévő
-- lifestyle_settings policy-k (saját sor, user_id = auth.uid()) lefedik.
--
-- checklist_items: [{key, label, icon}] — NULL = az alapértelmezett 5 feladat
--   (ate_in_window, protein_hit, trained, walked, slept_well); [] = szándékosan üres lista.
--   A daily_logs.checklist (változatlan jsonb, key -> bool) ezeket a key-eket pipálja.
-- schedule_entries: {reggeles|delutanos|ejszakas|pihenonap: [{id, activity, start, end?, approx?}]}
--   Csak a sablontól eltérő műszak kulcsa szerepel; hiányzó kulcsnál a beépített sablon
--   (+ a régi custom_schedules időpont-felülírásai) érvényes. A custom_schedules oszlop
--   marad (régebbi mobil buildek olvassák).
-- A web ezeket NEM írja: a kalóriacél-mentés (upsertNutritionGoals) csak whitelistelt
-- mezőket küld (src/lib/lifestyleSettings.ts).

ALTER TABLE public.lifestyle_settings
  ADD COLUMN IF NOT EXISTS checklist_items JSONB,
  ADD COLUMN IF NOT EXISTS schedule_entries JSONB NOT NULL DEFAULT '{}'::jsonb;
