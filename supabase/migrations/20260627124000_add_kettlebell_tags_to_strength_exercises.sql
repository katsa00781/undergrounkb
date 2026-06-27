-- Hiányzó kettlebell címke pótlása erőedzés-kategóriás KB-gyakorlatokon.
-- A derived taxonómia-trigger csak `category = 'kettlebell'` esetén ad kettlebell
-- taget, a kezdeti taxonómia-migráció (20260408133000) pedig csak akkor adott
-- manuális kettlebell taget, ha a név/leírás tartalmazta a "kettlebell"/"kb"/
-- "girya" szót. Így sok, az Erőedzés kategóriában tárolt KB-gyakorlat kimaradt a
-- kettlebell-szűrőből, pedig kettlebell-lel végezhető.
--
-- Döntés (2026-06-27, edző jóváhagyásával): a KB-fókuszú edzőteremben az alábbi
-- gyakorlatok mind kettlebell címkét kapnak — az egyértelmű KB-gyakorlatok (goblet
-- guggolás, windmill, TGU, batwing, forró krumpli) és a tipikusan kettlebell-lel
-- végzett, de más eszközzel is kivitelezhető mozgások (egylábas felhúzás/evezés,
-- egykezes evezés, farmer járás, push press, libikóka padlón nyomás, jó reggelt,
-- áthúzás) egyaránt. A címke `manual` source-ú, így a movement_pattern/category
-- változást követő derived-sync nem törli.

INSERT INTO public.exercise_taxonomy_assignments (
  exercise_id,
  exercise_taxonomy_tag_id,
  source,
  is_primary
)
SELECT
  e.id,
  t.id,
  'manual',
  false
FROM public.exercises AS e
JOIN public.exercise_taxonomy_tags AS t
  ON t.slug = 'kettlebell'
WHERE e.category = 'strength_training'
  AND e.name IN (
    -- Egyértelmű kettlebell-gyakorlatok
    'Goblet guggolás',
    'Windmill',
    'TGU féltérdről tenyérre',
    'Batwing padon',
    'Forró krumpli ülve',
    -- KB-vel és más eszközzel is végezhető (edző: mind KB)
    'Egylábas felhúzás',
    'Egylábas evezés',
    'Fűrészelés döntött törzsű',
    'Farmer járás 1 eszköz',
    'Farmer járás 2 eszköz',
    'Kétkezes lökés',
    'Padlón nyomás libikóka',
    'Jó reggelt',
    'Kétkezes áthúzás fekve'
  )
ON CONFLICT (exercise_id, exercise_taxonomy_tag_id) DO NOTHING;
