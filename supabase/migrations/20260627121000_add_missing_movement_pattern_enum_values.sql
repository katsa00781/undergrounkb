-- Séma-drift javítás: a `movement_pattern` enum az élő DB-ben eltért a kódtól.
-- A kód (src/lib/exerciseTaxonomy/constants.ts MOVEMENT_PATTERN_OPTIONS) és az
-- eredeti create migráció (20250613210000) az alábbi 7 értéket is használja, de
-- ezek hiányoztak az élő enumból.
-- Tünet: invalid input value for enum movement_pattern: "local_exercises".

ALTER TYPE movement_pattern ADD VALUE IF NOT EXISTS 'gait_stability';
ALTER TYPE movement_pattern ADD VALUE IF NOT EXISTS 'gait_crawling';
ALTER TYPE movement_pattern ADD VALUE IF NOT EXISTS 'core_other';
ALTER TYPE movement_pattern ADD VALUE IF NOT EXISTS 'local_exercises';
ALTER TYPE movement_pattern ADD VALUE IF NOT EXISTS 'sm_correction_first';
ALTER TYPE movement_pattern ADD VALUE IF NOT EXISTS 'sm_correction_second';
ALTER TYPE movement_pattern ADD VALUE IF NOT EXISTS 'stability_correction';
