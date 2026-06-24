-- Post-migration audit for exercise taxonomy coverage
-- Run after 20260408133000_add_exercise_taxonomy.sql

-- 1. Legacy category distribution
SELECT
  category::text AS legacy_category,
  COUNT(*) AS exercise_count
FROM public.exercises
GROUP BY category::text
ORDER BY category::text;

-- 2. Legacy movement pattern distribution
SELECT
  movement_pattern::text AS legacy_movement_pattern,
  COUNT(*) AS exercise_count
FROM public.exercises
GROUP BY movement_pattern::text
ORDER BY movement_pattern::text;

-- 3. Taxonomy tag coverage by dimension
SELECT
  tags.dimension,
  tags.slug,
  tags.label,
  COUNT(assignments.exercise_id) AS tagged_exercise_count
FROM public.exercise_taxonomy_tags AS tags
LEFT JOIN public.exercise_taxonomy_assignments AS assignments
  ON assignments.exercise_taxonomy_tag_id = tags.id
GROUP BY tags.dimension, tags.slug, tags.label, tags.sort_order
ORDER BY tags.dimension, tags.sort_order, tags.label;

-- 4. Exercises without any taxonomy assignment
SELECT
  exercises.id,
  exercises.name,
  exercises.category::text AS legacy_category,
  exercises.movement_pattern::text AS legacy_movement_pattern
FROM public.exercises AS exercises
LEFT JOIN public.exercise_taxonomy_assignments AS assignments
  ON assignments.exercise_id = exercises.id
WHERE assignments.exercise_id IS NULL
ORDER BY exercises.name;

-- 5. Exercises missing an exact-pattern derived tag
SELECT
  exercises.id,
  exercises.name,
  exercises.movement_pattern::text AS legacy_movement_pattern
FROM public.exercises AS exercises
LEFT JOIN public.exercise_taxonomy_assignments AS assignments
  ON assignments.exercise_id = exercises.id
LEFT JOIN public.exercise_taxonomy_tags AS tags
  ON tags.id = assignments.exercise_taxonomy_tag_id
  AND tags.dimension = 'exact_pattern'
WHERE tags.id IS NULL
ORDER BY exercises.name;

-- 6. Exercises that look kettlebell-related but have no kettlebell taxonomy tag
SELECT
  exercises.id,
  exercises.name,
  exercises.description,
  exercises.category::text AS legacy_category,
  exercises.movement_pattern::text AS legacy_movement_pattern
FROM public.exercises AS exercises
WHERE (
  lower(coalesce(exercises.name, '')) LIKE '%kettlebell%'
  OR lower(coalesce(exercises.name, '')) LIKE '%girya%'
  OR lower(coalesce(exercises.description, '')) LIKE '%kettlebell%'
  OR lower(coalesce(exercises.description, '')) LIKE '%girya%'
  OR lower(coalesce(exercises.name, '')) ~ '(^|[^a-z])kb([^a-z]|$)'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.exercise_taxonomy_assignments AS assignments
  JOIN public.exercise_taxonomy_tags AS tags
    ON tags.id = assignments.exercise_taxonomy_tag_id
  WHERE assignments.exercise_id = exercises.id
    AND tags.slug = 'kettlebell'
)
ORDER BY exercises.name;

-- 7. Exercises that look FMS-related but have no FMS taxonomy tag
SELECT
  exercises.id,
  exercises.name,
  exercises.description,
  exercises.category::text AS legacy_category,
  exercises.movement_pattern::text AS legacy_movement_pattern
FROM public.exercises AS exercises
WHERE (
  exercises.movement_pattern::text IN (
    'aslr_correction_first',
    'aslr_correction_second',
    'sm_correction_first',
    'sm_correction_second',
    'stability_correction'
  )
  OR lower(coalesce(exercises.name, '')) LIKE '%fms%'
  OR lower(coalesce(exercises.description, '')) LIKE '%fms%'
  OR lower(coalesce(exercises.description, '')) LIKE '%korrekci%'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.exercise_taxonomy_assignments AS assignments
  JOIN public.exercise_taxonomy_tags AS tags
    ON tags.id = assignments.exercise_taxonomy_tag_id
  WHERE assignments.exercise_id = exercises.id
    AND tags.slug = 'fms'
)
ORDER BY exercises.name;

-- 8. Exercises that look SMR-related but have no SMR taxonomy tag
SELECT
  exercises.id,
  exercises.name,
  exercises.description,
  exercises.category::text AS legacy_category,
  exercises.movement_pattern::text AS legacy_movement_pattern
FROM public.exercises AS exercises
WHERE (
  lower(coalesce(exercises.name, '')) LIKE 'smr%'
  OR lower(coalesce(exercises.name, '')) LIKE '%smr -%'
  OR lower(coalesce(exercises.name, '')) LIKE '%henger%'
  OR lower(coalesce(exercises.name, '')) LIKE '%foam roll%'
  OR lower(coalesce(exercises.name, '')) LIKE '%hengerez%'
  OR lower(coalesce(exercises.description, '')) LIKE '%foam roll%'
  OR lower(coalesce(exercises.description, '')) LIKE '%henger%'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.exercise_taxonomy_assignments AS assignments
  JOIN public.exercise_taxonomy_tags AS tags
    ON tags.id = assignments.exercise_taxonomy_tag_id
  WHERE assignments.exercise_id = exercises.id
    AND tags.slug = 'smr'
)
ORDER BY exercises.name;

-- 9. Full exercise-to-tag snapshot
SELECT
  exercises.name,
  exercises.category::text AS legacy_category,
  exercises.movement_pattern::text AS legacy_movement_pattern,
  COALESCE(
    ARRAY_AGG(tags.label ORDER BY tags.dimension, tags.sort_order, tags.label)
      FILTER (WHERE tags.id IS NOT NULL),
    ARRAY[]::text[]
  ) AS taxonomy_labels
FROM public.exercises AS exercises
LEFT JOIN public.exercise_taxonomy_assignments AS assignments
  ON assignments.exercise_id = exercises.id
LEFT JOIN public.exercise_taxonomy_tags AS tags
  ON tags.id = assignments.exercise_taxonomy_tag_id
GROUP BY exercises.id, exercises.name, exercises.category, exercises.movement_pattern
ORDER BY exercises.name;