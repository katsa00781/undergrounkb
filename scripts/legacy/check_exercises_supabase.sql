-- Ellenőrző lekérdezések a hozzáadott gyakorlatokhoz
-- Futtasd le ezeket a Supabase SQL Editor-ban az insertek után

-- 1. Összesítés: hány gyakorlat lett hozzáadva kategóriánként
SELECT 
    category,
    COUNT(*) as gyakorlatok_szama
FROM public.exercises 
WHERE name LIKE '%SMR%' OR name LIKE '%Assisted%' OR name LIKE '%Goblet%' OR name LIKE '%Thread%' OR name LIKE '%Bird dog%'
GROUP BY category
ORDER BY category;

-- 2. FMS korrekciós gyakorlatok listája (mobility_flexibility kategória)
SELECT 
    name,
    movement_pattern,
    difficulty,
    description
FROM public.exercises 
WHERE category = 'mobility_flexibility'
    AND (name NOT LIKE '%SMR%')
ORDER BY name;

-- 3. SMR gyakorlatok listája (recovery kategória)
SELECT 
    name,
    movement_pattern,
    difficulty,
    description
FROM public.exercises 
WHERE category = 'recovery'
    AND name LIKE '%SMR%'
ORDER BY name;

-- 4. Összes új gyakorlat mozgásminta szerint csoportosítva
SELECT 
    movement_pattern,
    COUNT(*) as gyakorlatok_szama,
    STRING_AGG(name, ', ' ORDER BY name) as gyakorlatok
FROM public.exercises 
WHERE name LIKE '%SMR%' 
    OR name LIKE '%Assisted%' 
    OR name LIKE '%Goblet%' 
    OR name LIKE '%Thread%' 
    OR name LIKE '%Bird dog%'
    OR name LIKE '%Plank%'
    OR name LIKE '%Dead bug%'
GROUP BY movement_pattern
ORDER BY movement_pattern;

-- 5. Teljes exercises tábla statisztika
SELECT 
    category,
    movement_pattern,
    COUNT(*) as db
FROM public.exercises 
WHERE is_active = true
GROUP BY category, movement_pattern
ORDER BY category, movement_pattern;
