-- Mozgásminta adat-drift javítás (BACKLOG 3. szekció — movement_pattern adat-drift 🟡).
-- Néhány erőedzés-gyakorlat olyan `movement_pattern` értéket használ, ami az
-- élő enumban LÉTEZIK ugyan (legacy seed-érték), de NINCS a UI kanonikus
-- MOVEMENT_PATTERN_OPTIONS listájában (src/lib/exerciseTaxonomy/constants.ts).
-- Tünet: ezek a gyakorlatok nem jelennek meg kanonikus címkével a mozgásminta-
-- és pattern-family szűrőben, és a derived taxonómia-trigger CASE-e sem fogja
-- meg őket → csak a `strength` kategória-tagjük marad, hiányzik a pattern-family
-- (core / gait / ...) és az exact_pattern tag.
--
-- Leképezés a kanonikus enum-értékekre (a BACKLOG javaslata alapján kibővítve):
--   anti_extension       → stability_anti_extension   (anti-extenziós core: plank, kigördülés, láb leengedés, L-ülés)
--   anti_lateral_flexion → stability_anti_flexion      (frontális síkú stabilitás: oldalsó plank, windmill, TGU, pincér járás)
--   loaded_carry         → gait_stability              (terhelt cipelés = gait/törzs stabilitás: farmer/rack/fej feletti járás)
--   corrective           → local_exercises             (lokális korrekciós/izolációs munka: batwing, csukló/tricepsz/oldal/vádli)
--   locomotion           → gait_crawling               (tárgyat húzó/toló mászás)
--
-- Az `AFTER UPDATE OF movement_pattern` trigger
-- (trigger_sync_exercise_derived_taxonomy_assignments) automatikusan újragenerálja
-- a derived tageket; a manuális tagek (pl. a KB-gyakorlatok kettlebell címkéje)
-- érintetlenek maradnak (a sync csak `source = 'derived'` sorokat töröl/épít újra).

UPDATE public.exercises SET movement_pattern = 'stability_anti_extension'
WHERE movement_pattern = 'anti_extension';

UPDATE public.exercises SET movement_pattern = 'stability_anti_flexion'
WHERE movement_pattern = 'anti_lateral_flexion';

UPDATE public.exercises SET movement_pattern = 'gait_stability'
WHERE movement_pattern = 'loaded_carry';

UPDATE public.exercises SET movement_pattern = 'local_exercises'
WHERE movement_pattern = 'corrective';

UPDATE public.exercises SET movement_pattern = 'gait_crawling'
WHERE movement_pattern = 'locomotion';
