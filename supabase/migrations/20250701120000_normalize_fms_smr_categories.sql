DO $$
BEGIN
  ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'fms';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'smr';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

UPDATE public.exercises
SET category = 'fms'
WHERE category <> 'fms'
  AND (
    movement_pattern IN (
      'aslr_correction_first',
      'aslr_correction_second',
      'sm_correction_first',
      'sm_correction_second',
      'stability_correction'
    )
    OR lower(name) IN (
      'assisted deep squat with band',
      'goblet squat hold',
      'ankle dorsiflexion mobilization',
      'quadruped rocking',
      'overhead squat with dowel',
      'mini-band march',
      'single-leg deadlift (unloaded)',
      'heel-to-wall march',
      'assisted step-over',
      'standing hip flexor mobilization',
      'split squat hold',
      'assisted in-line lunge with band',
      'half kneeling chop/lift with band',
      'ankle dorsiflexion mobilization (front leg)',
      'hip flexor stretch (rear leg)',
      'thread the needle',
      'open book stretch',
      'wall slides',
      'banded shoulder dislocates',
      'quadruped thoracic rotation',
      'single leg lowering with band',
      'assisted straight leg raise',
      'half kneeling hip flexor stretch',
      'toe touch progression',
      'cook hip lift',
      'plank hold',
      'push-up plus',
      'dead bug',
      'tall plank shoulder taps',
      'quadruped hover (bear hold)',
      'bird dog',
      'side plank variations',
      'dead bug (rotary)',
      'pallof press with band',
      'quadruped diagonals',
      'shoulder clearing - thread the needle',
      'wall slides (clearing)',
      'banded external rotation',
      'cat-camel',
      'child''s pose hold'
    )
    OR name ILIKE '%fms%'
    OR name ILIKE '%korrekció%'
    OR description ILIKE '%fms%'
    OR description ILIKE '%korrekció%'
  );

UPDATE public.exercises
SET category = 'smr'
WHERE category <> 'smr'
  AND (
    name ILIKE 'SMR%'
    OR description ILIKE '%foam roll%'
    OR description ILIKE '%henger%'
  );