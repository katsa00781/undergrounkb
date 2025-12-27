-- Adatbázis gyakorlatok ellenőrzése
-- Másold be és futtasd le a Supabase SQL Editor-ban

-- 1. Meglévő kategóriák és gyakorlatok száma
SELECT 
    category,
    COUNT(*) as exercise_count
FROM public.exercises
GROUP BY category
ORDER BY category;

-- 2. Meglévő mozgásminták kategóriánként
SELECT 
    category,
    movement_pattern,
    COUNT(*) as count
FROM public.exercises
GROUP BY category, movement_pattern
ORDER BY category, movement_pattern;

-- 3. Összes FMS nevű vagy FMS jellegű gyakorlat
SELECT name, category, movement_pattern
FROM public.exercises
WHERE name ILIKE '%FMS%'
   OR name ILIKE '%korrekció%'
   OR name ILIKE '%correction%'
   OR movement_pattern IN ('aslr_correction_first', 'aslr_correction_second', 'sm_correction_first', 'sm_correction_second', 'stability_correction')
ORDER BY name;

-- 4. Összes SMR gyakorlat
SELECT name, category, movement_pattern
FROM public.exercises
WHERE name LIKE 'SMR%'
   OR name ILIKE '%henger%'
   OR name ILIKE '%foam roll%'
ORDER BY name;

-- 5. Összes kettlebell gyakorlat
SELECT name, category, movement_pattern
FROM public.exercises
WHERE name ILIKE '%kettlebell%'
   OR name ILIKE '%kb %'
   OR category = 'kettlebell'
ORDER BY name
LIMIT 20;

-- 6. Kategória nélküli vagy hibás kategóriájú gyakorlatok
SELECT name, category, movement_pattern
FROM public.exercises
WHERE category IS NULL
   OR category NOT IN ('strength_training', 'cardio', 'kettlebell', 'mobility_flexibility', 'hiit', 'recovery', 'fms', 'smr')
ORDER BY name;

-- 7. Mobility/flexibility kategóriában lévő gyakorlatok (lehet FMS-be kellene)
SELECT name, category, movement_pattern
FROM public.exercises
WHERE category = 'mobility_flexibility'
ORDER BY name
LIMIT 20;

-- 8. Recovery kategóriában lévő gyakorlatok (lehet SMR-be kellene)
SELECT name, category, movement_pattern
FROM public.exercises
WHERE category = 'recovery'
ORDER BY name
LIMIT 20;
