# FMS Assessments Table Documentation

The FMS (Functional Movement Screen) assessments table stores evaluation data for client movement patterns.

## Table Structure

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | UUID | Primary key, auto-generated |
| user_id | UUID | Foreign key to auth.users, identifies the assessed user |
| date | DATE | Date when the assessment was conducted |
| deep_squat | INTEGER | **Scored** value for Deep Squat (0-3) |
| hurdle_step | INTEGER | **Scored** value for Hurdle Step (0-3) — the weaker side |
| inline_lunge | INTEGER | **Scored** value for Inline Lunge (0-3) — the weaker side |
| shoulder_mobility | INTEGER | **Scored** value for Shoulder Mobility (0-3) — weaker side, or 0 if `sm_clearing` |
| active_straight_leg_raise | INTEGER | **Scored** value for ASLR (0-3) — the weaker side |
| trunk_stability_pushup | INTEGER | **Scored** value for TSPU (0-3) — 0 if `tspu_clearing` |
| rotary_stability | INTEGER | **Scored** value for Rotary Stability (0-3) — weaker side, or 0 if `rs_clearing` |
| hurdle_step_left / _right | SMALLINT NULL | Raw per-side score (0-3) |
| inline_lunge_left / _right | SMALLINT NULL | Raw per-side score (0-3) |
| shoulder_mobility_left / _right | SMALLINT NULL | Raw per-side score (0-3) |
| active_straight_leg_raise_left / _right | SMALLINT NULL | Raw per-side score (0-3) |
| rotary_stability_left / _right | SMALLINT NULL | Raw per-side score (0-3) |
| sm_clearing | BOOLEAN | Shoulder impingement clearing test — `true` = painful |
| tspu_clearing | BOOLEAN | Spinal extension (press-up) clearing test — `true` = painful |
| rs_clearing | BOOLEAN | Spinal flexion (posterior rocking) clearing test — `true` = painful |
| total_score | INTEGER | Auto-calculated sum of the seven **scored** columns (0-21) |
| notes | TEXT | Additional notes about the assessment |
| created_at | TIMESTAMPTZ | Auto-generated creation timestamp |
| updated_at | TIMESTAMPTZ | Auto-generated update timestamp |

## Scoring System

- **0**: Pain during movement
- **1**: Unable to complete movement pattern
- **2**: Completes movement with compensation
- **3**: Perfect form, no compensation

## Per-side scoring and clearing tests

Five tests are scored **per side** (hurdle step, inline lunge, shoulder
mobility, ASLR, rotary stability). The raw sides live in the `_left` / `_right`
columns; the seven legacy columns hold the **scored** value, which is the
weaker side — this is what `total_score` (a generated column) sums. A
left/right difference (asymmetry) is a corrective indication on its own, even
when the scored value is acceptable, so the raw sides are surfaced in the
report and the PDF.

Three **clearing tests** (`sm_clearing`, `tspu_clearing`, `rs_clearing`) are
pain-provocation screens. A positive result forces the associated test's scored
value to 0 regardless of movement quality, and calls for medical referral.

The derivation lives in `src/lib/fmsScoring.ts` (`resolveFMSScores`,
`buildFMSAssessmentPayload`) and is unit-tested in `fmsScoring.test.ts` — do
not reimplement it at a call site.

Assessments recorded before migration `20260801130000` have `NULL` in the
per-side columns. That is deliberate: the scored value does not tell us which
side was weaker, so it must not be back-filled.

## Total Score Interpretation

- **14-21**: Good functional movement
- **10-13**: Acceptable movement patterns, may benefit from targeted correctives
- **<10**: Poor movement patterns, high risk of injury, needs corrective strategies

## Total Score Interpretation in code

These bands are no longer documentation-only — they live in
`src/lib/fmsReport/constants.ts` (`FMS_SCORE_BANDS`) and drive both the report
page and the generated PDF. Keep the two in sync.

## Row Level Security

Access to this table is secured through Row Level Security (RLS) policies.
Permissive policies combine with OR, so a user matches either the "own row"
policy or the admin policy:

1. Users can view / insert / update / delete **their own** assessment records
   (`fms_select_own`, `fms_insert_own`, `fms_update_own`, `fms_delete_own` —
   all `auth.uid() = user_id`)
2. Admins have full access to **all** records (`fms_admin_all`)

The admin policy calls `public.current_user_is_admin()`, a `STABLE`
`SECURITY DEFINER` SQL function with a pinned `search_path` that checks
`profiles.role = 'admin'` for `auth.uid()`. See migration
`20260801100000_fix_fms_admin_rls_policy.sql`.

Two things to know about that migration:

- It replaced an earlier `fms_admin_all` policy that tested
  `auth.jwt() ->> 'user_role' = 'admin'`. That claim was never populated (no
  custom access token hook exists), so the policy never matched — admins could
  neither read nor write another user's assessment, even though the FMS
  Assessment page inserts with `user_id = linkedUserId`.
- The helper is deliberately **not** named `is_admin`: the schema already has an
  older `public.is_admin(uuid)` → `get_user_role(uuid)` pair which is `VOLATILE`
  plpgsql without a pinned `search_path`, and is not suitable for use in an RLS
  policy.

## Usage in Application

The table is primarily used by the FMS Assessment page to:

1. Record movement pattern evaluations
2. Track movement quality over time
3. Identify mobility/stability limitations
4. Guide corrective exercise programming
