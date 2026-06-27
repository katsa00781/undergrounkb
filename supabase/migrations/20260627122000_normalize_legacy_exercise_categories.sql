-- Séma/adat-drift javítás: a gyakorlattár kategória-szűrője nem találta a
-- legnagyobb csoportot. Az `exercises.category` oszlopban legacy seed-értékek
-- maradtak, amelyek nem egyeznek a UI kanonikus kategória-listájával
-- (src/lib/exerciseTaxonomy/constants.ts EXERCISE_CATEGORY_OPTIONS):
--   * `strength`  (79 sor) → a UI csak `strength_training`-et kínál → 0 találat
--   * `core`      (20 sor) → nincs ilyen UI-kategória → soha nem szűrhető
-- (Az `ExerciseForm` már a kanonikus `strength_training`-et írja, így ez egyszeri
--  történeti adat-normalizálás; új írásokat nem érint.)
--
-- Döntés (2026-06-27): a `core` gyakorlatok (anti_extension / anti_rotation /
-- anti_lateral_flexion mozgásminták = törzs/core stabilizáció) az Erőedzésbe
-- olvadnak — konzisztens a taxonómiával, ahol a strength_training amúgy is
-- tartalmazza a stability_anti_* / core mintákat. A core jelleg a mozgásminta-
-- szűrőben marad meg.
--
-- A `category` UPDATE-et az `AFTER UPDATE OF category` trigger
-- (trigger_sync_exercise_derived_taxonomy_assignments) automatikusan követi:
-- a `strength_training` → `strength` derived kategória-tag soronként újragenerálódik,
-- így a szűrő közvetlen egyezéssel ÉS taxonómia-fallbackkel is megtalálja őket.

UPDATE public.exercises
SET category = 'strength_training'
WHERE category IN ('strength', 'core');
