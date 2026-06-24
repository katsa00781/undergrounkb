-- Összes gyakorlat kategóriájának pontos beállítása
-- Futtasd le CSAK az enum-ok hozzáadása után!
-- ===================================================

-- 1. FMS KORREKCIÓS GYAKORLATOK
-- Mozgásminta alapján
UPDATE public.exercises
SET category = 'fms'
WHERE movement_pattern IN (
    'aslr_correction_first',
    'aslr_correction_second', 
    'sm_correction_first',
    'sm_correction_second',
    'stability_correction'
);

-- Név alapján - FMS specifikus gyakorlatok
UPDATE public.exercises
SET category = 'fms'
WHERE category != 'fms' AND (
    name ILIKE '%FMS%'
    OR name IN (
        'Assisted deep squat with band',
        'Goblet squat hold',
        'Ankle dorsiflexion mobilization',
        'Quadruped rocking',
        'Overhead squat with dowel',
        'Mini-band march',
        'Single-leg deadlift (unloaded)',
        'Heel-to-wall march',
        'Assisted step-over',
        'Standing hip flexor mobilization',
        'Split squat hold',
        'Assisted in-line lunge with band',
        'Half kneeling chop/lift with band',
        'Ankle dorsiflexion mobilization (front leg)',
        'Hip flexor stretch (rear leg)',
        'Thread the needle',
        'Open book stretch',
        'Wall slides',
        'Banded shoulder dislocates',
        'Quadruped thoracic rotation',
        'Single leg lowering with band',
        'Assisted straight leg raise',
        'Half kneeling hip flexor stretch',
        'Toe touch progression',
        'Cook hip lift',
        'Plank hold',
        'Push-up plus',
        'Dead bug',
        'Tall plank shoulder taps',
        'Quadruped hover (bear hold)',
        'Bird dog',
        'Side plank variations',
        'Dead bug (rotary)',
        'Pallof press with band',
        'Quadruped diagonals',
        'Shoulder clearing - Thread the needle',
        'Wall slides (clearing)',
        'Banded external rotation',
        'Cat-camel',
        'Child''s pose hold'
    )
);

-- 2. SMR (HENGER) GYAKORLATOK
UPDATE public.exercises
SET category = 'smr'
WHERE category != 'smr' AND (
    name LIKE 'SMR%'
    OR name ILIKE '%SMR -%'
    OR name ILIKE '%henger%'
    OR name ILIKE '%foam roll%'
    OR name ILIKE '%hengerez%'
);

-- 3. KETTLEBELL GYAKORLATOK
-- Csak azok maradnak kettlebell kategóriában, amik valóban KB gyakorlatok
UPDATE public.exercises
SET category = 'kettlebell'
WHERE category != 'kettlebell' 
  AND category NOT IN ('fms', 'smr')
  AND (
    name ILIKE '%kettlebell%'
    OR name ILIKE '% KB %'
    OR name ILIKE 'KB %'
    OR name LIKE '%girya%'
);

-- 4. ELLENŐRZÉSEK
-- Számoljuk meg az egyes kategóriák gyakorlatait
SELECT 
    category,
    COUNT(*) as exercise_count,
    ARRAY_AGG(DISTINCT movement_pattern) as movement_patterns_used
FROM public.exercises
GROUP BY category
ORDER BY category;

-- FMS gyakorlatok részletes listája
SELECT 
    name,
    category,
    movement_pattern,
    difficulty
FROM public.exercises
WHERE category = 'fms'
ORDER BY movement_pattern, name;

-- SMR gyakorlatok részletes listája
SELECT 
    name,
    category,
    movement_pattern,
    difficulty
FROM public.exercises
WHERE category = 'smr'
ORDER BY name;

-- Kettlebell gyakorlatok példa
SELECT 
    name,
    category,
    movement_pattern,
    difficulty
FROM public.exercises
WHERE category = 'kettlebell'
ORDER BY movement_pattern, name
LIMIT 30;

-- Kategória nélküli vagy ismeretlen kategóriájú gyakorlatok (ha van)
SELECT 
    name,
    category,
    movement_pattern
FROM public.exercises
WHERE category IS NULL
   OR category NOT IN ('strength_training', 'cardio', 'kettlebell', 'mobility_flexibility', 'hiit', 'recovery', 'fms', 'smr')
ORDER BY name;
