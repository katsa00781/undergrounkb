# FMS Assessments Table Documentation

The FMS (Functional Movement Screen) assessments table stores evaluation data for client movement patterns.

## Table Structure

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | UUID | Primary key, auto-generated |
| user_id | UUID | Foreign key to auth.users, identifies the assessed user |
| date | DATE | Date when the assessment was conducted |
| deep_squat | INTEGER | Score for Deep Squat movement (0-3) |
| hurdle_step | INTEGER | Score for Hurdle Step movement (0-3) |
| inline_lunge | INTEGER | Score for Inline Lunge movement (0-3) |
| shoulder_mobility | INTEGER | Score for Shoulder Mobility movement (0-3) |
| active_straight_leg_raise | INTEGER | Score for Active Straight Leg Raise movement (0-3) |
| trunk_stability_pushup | INTEGER | Score for Trunk Stability Pushup movement (0-3) |
| rotary_stability | INTEGER | Score for Rotary Stability movement (0-3) |
| total_score | INTEGER | Auto-calculated sum of all movement scores (0-21) |
| notes | TEXT | Additional notes about the assessment |
| created_at | TIMESTAMPTZ | Auto-generated creation timestamp |
| updated_at | TIMESTAMPTZ | Auto-generated update timestamp |

## Scoring System

- **0**: Pain during movement
- **1**: Unable to complete movement pattern
- **2**: Completes movement with compensation
- **3**: Perfect form, no compensation

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
