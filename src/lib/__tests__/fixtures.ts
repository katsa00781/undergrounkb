import type { Exercise } from '../exercises';
import type { FMSAssessment } from '../fms';

let counter = 0;

/**
 * Teszt-gyakorlat factory. Minden kötelező `exercises.Row` mezőt feltölt
 * értelmes alapértékkel, a `overrides` felülírja a teszteset szempontjából
 * lényeges mezőket.
 */
export function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  counter += 1;
  return {
    id: overrides.id ?? `ex-${counter}`,
    name: overrides.name ?? `Gyakorlat ${counter}`,
    description: overrides.description ?? null,
    instructions: overrides.instructions ?? null,
    category: overrides.category ?? 'kettlebell',
    movement_pattern: overrides.movement_pattern ?? 'knee_dominant_bilateral',
    difficulty: overrides.difficulty ?? 2,
    image_url: overrides.image_url ?? null,
    video_url: overrides.video_url ?? null,
    created_at: overrides.created_at ?? '2026-01-01T00:00:00Z',
    updated_at: overrides.updated_at ?? '2026-01-01T00:00:00Z',
    created_by: overrides.created_by ?? null,
    is_active: overrides.is_active ?? true,
    exercise_taxonomy_assignments: overrides.exercise_taxonomy_assignments ?? [],
    taxonomy_tags: overrides.taxonomy_tags ?? [],
    manual_taxonomy_tags: overrides.manual_taxonomy_tags ?? [],
    derived_taxonomy_tags: overrides.derived_taxonomy_tags ?? [],
  };
}

/**
 * Teszt FMS-felmérés factory. Alapból minden pontszám 3 (tökéletes),
 * a `overrides` állítja az egyes mintákat alacsonyabbra.
 */
export function makeFMSAssessment(overrides: Partial<FMSAssessment> = {}): FMSAssessment {
  return {
    id: 'fms-1',
    user_id: 'user-1',
    deep_squat: 3,
    hurdle_step: 3,
    inline_lunge: 3,
    shoulder_mobility: 3,
    active_straight_leg_raise: 3,
    trunk_stability_pushup: 3,
    rotary_stability: 3,
    total_score: 21,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
