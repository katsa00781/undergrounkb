import type { Exercise } from '../exercises';
import type { FMSAssessment } from '../fms';
import { resolveFMSScores, type FMSAssessmentDraft } from '../fmsScoring';

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
    reviewed: overrides.reviewed ?? false,
    exercise_taxonomy_assignments: overrides.exercise_taxonomy_assignments ?? [],
    taxonomy_tags: overrides.taxonomy_tags ?? [],
    manual_taxonomy_tags: overrides.manual_taxonomy_tags ?? [],
    derived_taxonomy_tags: overrides.derived_taxonomy_tags ?? [],
  };
}

/**
 * Teszt FMS-felmérés factory. Alapból minden pontszám 3 (tökéletes),
 * a `overrides` állítja az egyes mintákat alacsonyabbra.
 *
 * Az oldalankénti oszlopok alapból `null`-ok — ez a 2026-08-01 előtt rögzített
 * felmérések állapota. Oldalankénti esetet a `makeSidedFMSAssessment`-tel
 * érdemes építeni, hogy a beszámított pont ne csússzon el a nyers oldalaktól.
 */
export function makeFMSAssessment(overrides: Partial<FMSAssessment> = {}): FMSAssessment {
  return {
    id: 'fms-1',
    user_id: 'user-1',
    date: '2026-07-01',
    deep_squat: 3,
    hurdle_step: 3,
    inline_lunge: 3,
    shoulder_mobility: 3,
    active_straight_leg_raise: 3,
    trunk_stability_pushup: 3,
    rotary_stability: 3,
    hurdle_step_left: null,
    hurdle_step_right: null,
    inline_lunge_left: null,
    inline_lunge_right: null,
    shoulder_mobility_left: null,
    shoulder_mobility_right: null,
    active_straight_leg_raise_left: null,
    active_straight_leg_raise_right: null,
    rotary_stability_left: null,
    rotary_stability_right: null,
    sm_clearing: false,
    tspu_clearing: false,
    rs_clearing: false,
    total_score: 21,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Oldalankénti pontokból konzisztens felmérés: a beszámított pontokat a
 * termelési `resolveFMSScores` számolja, így a fixture nem tud a valóságtól
 * elszakadó (bal/jobb ↔ beszámított pont) kombinációt előállítani.
 */
export function makeSidedFMSAssessment(
  draft: FMSAssessmentDraft,
  overrides: Partial<FMSAssessment> = {},
): FMSAssessment {
  const scores = resolveFMSScores(draft);

  return makeFMSAssessment({
    ...draft,
    ...scores,
    total_score: Object.values(scores).reduce((sum, score) => sum + score, 0),
    ...overrides,
  });
}

/** Hibátlan (minden oldal 3 pont, minden clearing teszt negatív) draft. */
export function makeFMSDraft(overrides: Partial<FMSAssessmentDraft> = {}): FMSAssessmentDraft {
  return {
    deep_squat: 3,
    hurdle_step_left: 3,
    hurdle_step_right: 3,
    inline_lunge_left: 3,
    inline_lunge_right: 3,
    shoulder_mobility_left: 3,
    shoulder_mobility_right: 3,
    active_straight_leg_raise_left: 3,
    active_straight_leg_raise_right: 3,
    trunk_stability_pushup: 3,
    rotary_stability_left: 3,
    rotary_stability_right: 3,
    sm_clearing: false,
    tspu_clearing: false,
    rs_clearing: false,
    ...overrides,
  };
}
