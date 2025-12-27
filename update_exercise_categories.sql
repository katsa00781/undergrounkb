-- LÉPÉS 2: Gyakorlatok kategóriáinak frissítése
-- ===================================================
-- FONTOS: Ezt a scriptet MÁSODIKKÉNT kell lefuttatni!
-- Az enum értékek hozzáadása után (add_fms_smr_categories.sql)
-- Másold ki és futtasd le a Supabase SQL Editor-ban
-- ===================================================

-- 1. Frissítsük az FMS gyakorlatokat az 'fms' kategóriára
UPDATE public.exercises
SET category = 'fms'
WHERE name LIKE '%FMS%' 
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
   );

-- 2. Frissítsük az SMR gyakorlatokat az 'smr' kategóriára
UPDATE public.exercises
SET category = 'smr'
WHERE name LIKE 'SMR -%';

-- 3. Ellenőrizzük a változtatásokat
SELECT category, COUNT(*) as count
FROM public.exercises
GROUP BY category
ORDER BY category;

-- 4. Néhány példa FMS gyakorlatokra
SELECT name, category, movement_pattern
FROM public.exercises
WHERE category = 'fms'
LIMIT 5;

-- 5. Néhány példa SMR gyakorlatokra
SELECT name, category, movement_pattern
FROM public.exercises
WHERE category = 'smr'
LIMIT 5;
