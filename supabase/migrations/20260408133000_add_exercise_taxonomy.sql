DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_taxonomy_dimension') THEN
    CREATE TYPE exercise_taxonomy_dimension AS ENUM (
      'category',
      'equipment',
      'pattern_family',
      'laterality',
      'exact_pattern'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_taxonomy_assignment_source') THEN
    CREATE TYPE exercise_taxonomy_assignment_source AS ENUM (
      'derived',
      'manual'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_category') THEN
    ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'strength_training';
    ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'cardio';
    ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'kettlebell';
    ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'mobility_flexibility';
    ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'hiit';
    ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'recovery';
    ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'fms';
    ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'smr';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.exercise_taxonomy_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  dimension exercise_taxonomy_dimension NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', now())
);

CREATE TABLE IF NOT EXISTS public.exercise_taxonomy_assignments (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  exercise_taxonomy_tag_id UUID NOT NULL REFERENCES public.exercise_taxonomy_tags(id) ON DELETE CASCADE,
  source exercise_taxonomy_assignment_source NOT NULL DEFAULT 'manual',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', now()),
  PRIMARY KEY (exercise_id, exercise_taxonomy_tag_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_taxonomy_tags_dimension
  ON public.exercise_taxonomy_tags(dimension, sort_order, label);

CREATE INDEX IF NOT EXISTS idx_exercise_taxonomy_assignments_exercise
  ON public.exercise_taxonomy_assignments(exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_taxonomy_assignments_tag
  ON public.exercise_taxonomy_assignments(exercise_taxonomy_tag_id);

CREATE INDEX IF NOT EXISTS idx_exercise_taxonomy_assignments_source
  ON public.exercise_taxonomy_assignments(source);

ALTER TABLE public.exercise_taxonomy_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_taxonomy_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exercise taxonomy tags are viewable by everyone" ON public.exercise_taxonomy_tags;
CREATE POLICY "Exercise taxonomy tags are viewable by everyone"
ON public.exercise_taxonomy_tags
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage exercise taxonomy tags" ON public.exercise_taxonomy_tags;
CREATE POLICY "Admins can manage exercise taxonomy tags"
ON public.exercise_taxonomy_tags
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Exercise taxonomy assignments are viewable by everyone" ON public.exercise_taxonomy_assignments;
CREATE POLICY "Exercise taxonomy assignments are viewable by everyone"
ON public.exercise_taxonomy_assignments
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage exercise taxonomy assignments" ON public.exercise_taxonomy_assignments;
CREATE POLICY "Admins can manage exercise taxonomy assignments"
ON public.exercise_taxonomy_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);

CREATE OR REPLACE FUNCTION public.update_exercise_taxonomy_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('UTC', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_exercise_taxonomy_tags_updated_at ON public.exercise_taxonomy_tags;
CREATE TRIGGER trigger_update_exercise_taxonomy_tags_updated_at
  BEFORE UPDATE ON public.exercise_taxonomy_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exercise_taxonomy_tags_updated_at();

INSERT INTO public.exercise_taxonomy_tags (slug, label, dimension, description, sort_order)
VALUES
  ('strength', 'Erő', 'category', 'Általános erőfejlesztő kategória.', 10),
  ('cardio', 'Kardió', 'category', 'Állóképesség és kondicionálás.', 20),
  ('mobility', 'Mobilitás', 'category', 'Mobilitás- és mozgástartomány-fejlesztés.', 30),
  ('hiit', 'HIIT', 'category', 'Nagy intenzitású intervallum munka.', 40),
  ('recovery', 'Regeneráció', 'category', 'Regenerációs vagy helyreállító blokk.', 50),
  ('fms', 'FMS', 'category', 'FMS-hez kapcsolódó korrekciós gyakorlat.', 60),
  ('smr', 'SMR', 'category', 'SMR és lágyrész-előkészítés.', 70),
  ('kettlebell', 'Kettlebell', 'equipment', 'Kettlebellel végezhető gyakorlat.', 100),
  ('gait', 'Gait', 'pattern_family', 'Helyváltoztató vagy cipeléses stabilitási minta.', 200),
  ('hip_dominant', 'Csípő domináns', 'pattern_family', 'Hinge vagy csípő domináns minta.', 210),
  ('knee_dominant', 'Térd domináns', 'pattern_family', 'Squat vagy térd domináns minta.', 220),
  ('horizontal_push', 'Horizontális nyomás', 'pattern_family', 'Horizontális nyomó minta.', 230),
  ('horizontal_pull', 'Horizontális húzás', 'pattern_family', 'Horizontális húzó minta.', 240),
  ('vertical_push', 'Vertikális nyomás', 'pattern_family', 'Vertikális nyomó minta.', 250),
  ('vertical_pull', 'Vertikális húzás', 'pattern_family', 'Vertikális húzó minta.', 260),
  ('anti_extension', 'Anti-extenzió', 'pattern_family', 'Törzsstabilitás anti-extenzió fókusz.', 270),
  ('anti_rotation', 'Anti-rotáció', 'pattern_family', 'Törzsstabilitás anti-rotáció fókusz.', 280),
  ('anti_flexion', 'Anti-flexió', 'pattern_family', 'Törzsstabilitás anti-flexió fókusz.', 290),
  ('core', 'Core', 'pattern_family', 'Core és stabilitás egyéb fókusz.', 300),
  ('local_exercise', 'Lokális gyakorlat', 'pattern_family', 'Lokális korrekciós vagy izolációs gyakorlat.', 310),
  ('upper_body_mobility', 'Felsőtest mobilitás', 'pattern_family', 'Felsőtest mobilitási fókusz.', 320),
  ('mobilization', 'Mobilizálás', 'pattern_family', 'Mobilizációs minta.', 330),
  ('stability_correction', 'Stabilitás korrekció', 'pattern_family', 'Stabilitási korrekciós minta.', 340),
  ('bilateral', 'Bilaterális', 'laterality', 'Kétoldali kivitelezés.', 400),
  ('unilateral', 'Unilaterális', 'laterality', 'Egyoldali kivitelezés.', 410),
  ('locomotion', 'Lokomóció', 'laterality', 'Helyváltoztató vagy mászás alapú kivitelezés.', 420),
  ('gait_stability', 'Gait - törzs stabilitás', 'exact_pattern', 'Pontosan a gait_stability movement_pattern.', 500),
  ('gait_crawling', 'Gait mászásban - törzs stabilitás', 'exact_pattern', 'Pontosan a gait_crawling movement_pattern.', 510),
  ('hip_dominant_bilateral', 'Csípő domináns - bilaterális', 'exact_pattern', 'Pontosan a hip_dominant_bilateral movement_pattern.', 520),
  ('hip_dominant_unilateral', 'Csípő domináns - unilaterális', 'exact_pattern', 'Pontosan a hip_dominant_unilateral movement_pattern.', 530),
  ('knee_dominant_bilateral', 'Térd domináns - bilaterális', 'exact_pattern', 'Pontosan a knee_dominant_bilateral movement_pattern.', 540),
  ('knee_dominant_unilateral', 'Térd domináns - unilaterális', 'exact_pattern', 'Pontosan a knee_dominant_unilateral movement_pattern.', 550),
  ('horizontal_push_bilateral', 'Horizontális nyomás - bilaterális', 'exact_pattern', 'Pontosan a horizontal_push_bilateral movement_pattern.', 560),
  ('horizontal_push_unilateral', 'Horizontális nyomás - unilaterális', 'exact_pattern', 'Pontosan a horizontal_push_unilateral movement_pattern.', 570),
  ('horizontal_pull_bilateral', 'Horizontális húzás - bilaterális', 'exact_pattern', 'Pontosan a horizontal_pull_bilateral movement_pattern.', 580),
  ('horizontal_pull_unilateral', 'Horizontális húzás - unilaterális', 'exact_pattern', 'Pontosan a horizontal_pull_unilateral movement_pattern.', 590),
  ('vertical_push_bilateral', 'Vertikális nyomás - bilaterális', 'exact_pattern', 'Pontosan a vertical_push_bilateral movement_pattern.', 600),
  ('vertical_push_unilateral', 'Vertikális nyomás - unilaterális', 'exact_pattern', 'Pontosan a vertical_push_unilateral movement_pattern.', 610),
  ('vertical_pull_bilateral', 'Vertikális húzás - bilaterális', 'exact_pattern', 'Pontosan a vertical_pull_bilateral movement_pattern.', 620),
  ('stability_anti_extension', 'Stabilitás - anti-extenzió', 'exact_pattern', 'Pontosan a stability_anti_extension movement_pattern.', 630),
  ('stability_anti_rotation', 'Stabilitás - anti-rotáció', 'exact_pattern', 'Pontosan a stability_anti_rotation movement_pattern.', 640),
  ('stability_anti_flexion', 'Stabilitás - anti-flexió', 'exact_pattern', 'Pontosan a stability_anti_flexion movement_pattern.', 650),
  ('core_other', 'Core - egyéb', 'exact_pattern', 'Pontosan a core_other movement_pattern.', 660),
  ('local_exercises', 'Lokális gyakorlatok', 'exact_pattern', 'Pontosan a local_exercises movement_pattern.', 670),
  ('upper_body_mobility_pattern', 'Felsőtest mobilizálás', 'exact_pattern', 'Pontosan az upper_body_mobility movement_pattern.', 680),
  ('aslr_correction_first', 'ASLR korrekció - első pár', 'exact_pattern', 'Pontosan az aslr_correction_first movement_pattern.', 690),
  ('aslr_correction_second', 'ASLR korrekció - második hármas', 'exact_pattern', 'Pontosan az aslr_correction_second movement_pattern.', 700),
  ('sm_correction_first', 'SM korrekció - első pár', 'exact_pattern', 'Pontosan az sm_correction_first movement_pattern.', 710),
  ('sm_correction_second', 'SM korrekció - második hármas', 'exact_pattern', 'Pontosan az sm_correction_second movement_pattern.', 720),
  ('stability_correction_pattern', 'Stabilitás korrekció', 'exact_pattern', 'Pontosan a stability_correction movement_pattern.', 730),
  ('mobilization_pattern', 'Mobilizálás', 'exact_pattern', 'Pontosan a mobilization movement_pattern.', 740)
ON CONFLICT (slug) DO UPDATE
SET
  label = EXCLUDED.label,
  dimension = EXCLUDED.dimension,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

CREATE OR REPLACE FUNCTION public.assign_exercise_taxonomy_tag_by_slug(
  p_exercise_id UUID,
  p_tag_slug TEXT,
  p_source exercise_taxonomy_assignment_source DEFAULT 'manual',
  p_is_primary BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.exercise_taxonomy_assignments (
    exercise_id,
    exercise_taxonomy_tag_id,
    source,
    is_primary
  )
  SELECT
    p_exercise_id,
    id,
    p_source,
    p_is_primary
  FROM public.exercise_taxonomy_tags
  WHERE slug = p_tag_slug
  ON CONFLICT (exercise_id, exercise_taxonomy_tag_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_exercise_derived_taxonomy_assignments(p_exercise_id UUID)
RETURNS VOID AS $$
DECLARE
  exercise_record public.exercises%ROWTYPE;
  exercise_category_value TEXT;
  exercise_movement_pattern_value TEXT;
BEGIN
  SELECT *
  INTO exercise_record
  FROM public.exercises
  WHERE id = p_exercise_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  DELETE FROM public.exercise_taxonomy_assignments
  WHERE exercise_id = p_exercise_id
    AND source = 'derived';

  exercise_category_value := lower(coalesce(exercise_record.category::text, ''));
  exercise_movement_pattern_value := lower(coalesce(exercise_record.movement_pattern::text, ''));

  CASE exercise_category_value
    WHEN 'strength_training' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'strength', 'derived', true);
    WHEN 'cardio' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'cardio', 'derived', true);
    WHEN 'kettlebell' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'kettlebell', 'derived', true);
    WHEN 'mobility_flexibility' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'mobility', 'derived', true);
    WHEN 'hiit' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'hiit', 'derived', true);
    WHEN 'recovery' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'recovery', 'derived', true);
    WHEN 'fms' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'fms', 'derived', true);
    WHEN 'smr' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'smr', 'derived', true);
    ELSE
      NULL;
  END CASE;

  CASE exercise_movement_pattern_value
    WHEN 'gait_stability' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'gait', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'locomotion', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'gait_stability', 'derived');
    WHEN 'gait_crawling' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'gait', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'locomotion', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'gait_crawling', 'derived');
    WHEN 'hip_dominant_bilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'hip_dominant', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'bilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'hip_dominant_bilateral', 'derived');
    WHEN 'hip_dominant_unilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'hip_dominant', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'unilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'hip_dominant_unilateral', 'derived');
    WHEN 'knee_dominant_bilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'knee_dominant', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'bilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'knee_dominant_bilateral', 'derived');
    WHEN 'knee_dominant_unilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'knee_dominant', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'unilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'knee_dominant_unilateral', 'derived');
    WHEN 'horizontal_push_bilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'horizontal_push', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'bilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'horizontal_push_bilateral', 'derived');
    WHEN 'horizontal_push_unilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'horizontal_push', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'unilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'horizontal_push_unilateral', 'derived');
    WHEN 'horizontal_pull_bilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'horizontal_pull', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'bilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'horizontal_pull_bilateral', 'derived');
    WHEN 'horizontal_pull_unilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'horizontal_pull', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'unilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'horizontal_pull_unilateral', 'derived');
    WHEN 'vertical_push_bilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'vertical_push', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'bilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'vertical_push_bilateral', 'derived');
    WHEN 'vertical_push_unilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'vertical_push', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'unilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'vertical_push_unilateral', 'derived');
    WHEN 'vertical_pull_bilateral' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'vertical_pull', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'bilateral', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'vertical_pull_bilateral', 'derived');
    WHEN 'stability_anti_extension' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'anti_extension', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'core', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'stability_anti_extension', 'derived');
    WHEN 'stability_anti_rotation' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'anti_rotation', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'core', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'stability_anti_rotation', 'derived');
    WHEN 'stability_anti_flexion' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'anti_flexion', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'core', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'stability_anti_flexion', 'derived');
    WHEN 'core_other' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'core', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'core_other', 'derived');
    WHEN 'local_exercises' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'local_exercise', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'local_exercises', 'derived');
    WHEN 'upper_body_mobility' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'upper_body_mobility', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'upper_body_mobility_pattern', 'derived');
    WHEN 'aslr_correction_first' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'fms', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'aslr_correction_first', 'derived');
    WHEN 'aslr_correction_second' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'fms', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'aslr_correction_second', 'derived');
    WHEN 'sm_correction_first' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'fms', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'sm_correction_first', 'derived');
    WHEN 'sm_correction_second' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'fms', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'sm_correction_second', 'derived');
    WHEN 'stability_correction' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'stability_correction', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'stability_correction_pattern', 'derived');
    WHEN 'mobilization' THEN
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'mobilization', 'derived');
      PERFORM public.assign_exercise_taxonomy_tag_by_slug(p_exercise_id, 'mobilization_pattern', 'derived');
    ELSE
      NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_sync_exercise_derived_taxonomy_assignments()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_exercise_derived_taxonomy_assignments(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE public.exercises
SET updated_at = updated_at
WHERE false;

DROP TRIGGER IF EXISTS trigger_sync_exercise_derived_taxonomy_assignments ON public.exercises;
CREATE TRIGGER trigger_sync_exercise_derived_taxonomy_assignments
  AFTER INSERT OR UPDATE OF category, movement_pattern
  ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_exercise_derived_taxonomy_assignments();

DO $$
DECLARE
  exercise_record RECORD;
BEGIN
  FOR exercise_record IN SELECT id FROM public.exercises LOOP
    PERFORM public.sync_exercise_derived_taxonomy_assignments(exercise_record.id);
  END LOOP;
END
$$;

INSERT INTO public.exercise_taxonomy_assignments (
  exercise_id,
  exercise_taxonomy_tag_id,
  source,
  is_primary
)
SELECT
  exercises.id,
  exercise_taxonomy_tags.id,
  'manual',
  false
FROM public.exercises
JOIN public.exercise_taxonomy_tags
  ON exercise_taxonomy_tags.slug = 'kettlebell'
WHERE (
  lower(coalesce(exercises.name, '')) LIKE '%kettlebell%'
  OR lower(coalesce(exercises.name, '')) LIKE '%girya%'
  OR lower(coalesce(exercises.description, '')) LIKE '%kettlebell%'
  OR lower(coalesce(exercises.description, '')) LIKE '%girya%'
  OR lower(coalesce(exercises.name, '')) ~ '(^|[^a-z])kb([^a-z]|$)'
)
ON CONFLICT (exercise_id, exercise_taxonomy_tag_id) DO NOTHING;

INSERT INTO public.exercise_taxonomy_assignments (
  exercise_id,
  exercise_taxonomy_tag_id,
  source,
  is_primary
)
SELECT
  exercises.id,
  exercise_taxonomy_tags.id,
  'manual',
  false
FROM public.exercises AS exercises
JOIN public.exercise_taxonomy_tags
  ON exercise_taxonomy_tags.slug = 'fms'
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
  OR lower(coalesce(exercises.name, '')) IN (
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
)
ON CONFLICT (exercise_id, exercise_taxonomy_tag_id) DO NOTHING;

INSERT INTO public.exercise_taxonomy_assignments (
  exercise_id,
  exercise_taxonomy_tag_id,
  source,
  is_primary
)
SELECT
  exercises.id,
  exercise_taxonomy_tags.id,
  'manual',
  false
FROM public.exercises AS exercises
JOIN public.exercise_taxonomy_tags
  ON exercise_taxonomy_tags.slug = 'smr'
WHERE (
  lower(coalesce(exercises.name, '')) LIKE 'smr%'
  OR lower(coalesce(exercises.name, '')) LIKE '%smr -%'
  OR lower(coalesce(exercises.name, '')) LIKE '%henger%'
  OR lower(coalesce(exercises.name, '')) LIKE '%foam roll%'
  OR lower(coalesce(exercises.name, '')) LIKE '%hengerez%'
  OR lower(coalesce(exercises.description, '')) LIKE '%foam roll%'
  OR lower(coalesce(exercises.description, '')) LIKE '%henger%'
)
ON CONFLICT (exercise_id, exercise_taxonomy_tag_id) DO NOTHING;

COMMENT ON TABLE public.exercise_taxonomy_tags IS 'Normalized taxonomy tags for precise multi-category exercise classification.';
COMMENT ON TABLE public.exercise_taxonomy_assignments IS 'Many-to-many assignments between exercises and taxonomy tags. Derived tags come from legacy category/movement_pattern, manual tags are curated extras.';