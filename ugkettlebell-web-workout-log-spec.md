# Specification: Workout Completion Status from `workout_logs`

## Context

The Underground KB platform consists of two apps sharing a single Supabase project:

- **Web app (undergrounkb)** – creates and manages workout plans in the `workouts` table.
- **Mobile app** – lets users execute workouts and logs the results in the `workout_logs` table.

**The problem:** the web app currently has no visibility into whether a workout has been completed. The mobile app saves every finished workout to `workout_logs`, but the web app never reads this table, so workouts always appear as "planned" even after the user finishes them on mobile.

**The goal:** the web app must read `workout_logs` and use its data to mark workouts as completed, and optionally surface the logged details (sets, reps, weight, duration).

---

## Supabase project

- **Project ID:** `iipcpjczjjkwwifwzmut`
- **Region:** eu-central-1
- **URL:** `https://iipcpjczjjkwwifwzmut.supabase.co`

---

## Relevant tables

### `workouts` (already used by the web app)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | RLS-filtered |
| title | text | |
| date | date | Planned date |
| duration | integer | Minutes |
| sections | jsonb | Exercise plan |
| program_id | uuid | Optional program link |
| program_week | integer | |
| program_day_label | text | e.g. "A nap" |
| program_sequence | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**There is no `status`, `completed`, or `finished_at` column on `workouts`.** Completion is determined entirely by the presence of a `workout_logs` row.

---

### `workout_logs` (new – must be read by the web app)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | |
| user_id | uuid FK → auth.users ON DELETE CASCADE | NO | |
| workout_id | uuid FK → workouts(id) ON DELETE CASCADE | NO | Links to the planned workout |
| date | date | NO | Calendar date when the workout was done |
| started_at | timestamptz | NO | Session start timestamp |
| finished_at | timestamptz | YES | Session end timestamp |
| sections | jsonb | NO | Actual exercise execution data (see below) |
| notes | text | YES | Free-text user note |
| created_at | timestamptz | NO | |

**RLS policies (already in place):**
- `SELECT` – `auth.uid() = user_id`
- `INSERT` – `auth.uid() = user_id`
- `UPDATE` – `auth.uid() = user_id`
- `DELETE` – `auth.uid() = user_id`

The web app can read rows using the Supabase client with the user's session – no extra migration needed.

---

### `sections` JSON structure in `workout_logs`

The `sections` field mirrors the `workouts.sections` structure, extended with actual execution fields:

```json
[
  {
    "id": "1",
    "name": "Első pár",
    "exercises": [
      {
        "id": "1",
        "name": "Elől guggolás",
        "sets": 3,
        "reps": "8-10",
        "weight": null,
        "exerciseId": "a382a492-7206-4454-a7e8-309d5d14b049",
        "restPeriod": 90,
        "notes": "",
        "completed": true,
        "actualSets": 3,
        "actualReps": 8,
        "actualWeight": 24,
        "actualSetLogs": [
          { "reps": 8, "weight": 24 },
          { "reps": 8, "weight": 24 },
          { "reps": 8, "weight": 24 }
        ]
      }
    ]
  }
]
```

Key fields added by the mobile logger:
| Field | Type | Meaning |
|-------|------|---------|
| `completed` | boolean | true if user logged at least one set |
| `actualSets` | number | Sets actually completed |
| `actualReps` | number | Reps on the last completed set |
| `actualWeight` | number | Weight (kg) on the last completed set |
| `actualSetLogs` | array of `{reps, weight}` | Per-set actual data |

---

## Logic: when is a workout "completed"?

A workout is **completed** if `workout_logs` contains at least one row where `workout_id = workouts.id`.

A single workout may have multiple log entries (user can repeat the same planned workout). Use the most recent one (`ORDER BY finished_at DESC LIMIT 1`) for display purposes.

```sql
-- Example: fetch workouts with their latest log for a user
SELECT
  w.*,
  wl.id            AS log_id,
  wl.date          AS log_date,
  wl.started_at,
  wl.finished_at,
  wl.sections      AS log_sections,
  wl.notes         AS log_notes
FROM workouts w
LEFT JOIN LATERAL (
  SELECT *
  FROM workout_logs
  WHERE workout_id = w.id
    AND user_id = w.user_id
  ORDER BY finished_at DESC
  LIMIT 1
) wl ON true
WHERE w.user_id = <current_user_id>
ORDER BY w.date;
```

Or with the Supabase JS client:

```ts
const { data } = await supabase
  .from('workouts')
  .select(`
    *,
    workout_logs (
      id,
      date,
      started_at,
      finished_at,
      sections,
      notes
    )
  `)
  .eq('user_id', userId)
  .order('date');

// A workout is done if workout_logs array is non-empty
const withStatus = data.map(w => ({
  ...w,
  isCompleted: w.workout_logs.length > 0,
  latestLog: w.workout_logs[0] ?? null,
}));
```

> Note: Supabase returns related rows for `workout_logs` ordered by insertion by default. If you need the most recent log, add `.order('finished_at', { ascending: false })` on the nested relation, or filter in JS.

---

## What to implement in the web app

### 1. Fetch `workout_logs` alongside workouts

Wherever the web app lists or displays a user's workouts, extend the query to include the related `workout_logs` rows (as shown above).

### 2. Show completion status in the UI

Use `isCompleted` (log exists) to drive the UI:
- Mark the workout row/card as "Teljesítve" / "Completed"
- Show the completion date (`latestLog.date`)
- Show the elapsed time: `finished_at - started_at`

Example duration calculation:
```ts
const durationMs =
  new Date(log.finished_at).getTime() - new Date(log.started_at).getTime();
const durationMin = Math.round(durationMs / 60_000);
```

### 3. Optionally display logged details

From `latestLog.sections` you can derive:
- **Total volume (kg):** sum of `reps × weight` across all `actualSetLogs` where `weight > 0`
- **Exercises completed:** count of exercises where `completed === true`
- **Per-exercise actuals:** `actualSets`, `actualWeight`, `actualReps`

```ts
function computeTotalVolume(sections: LogSection[]): number {
  let total = 0;
  for (const section of sections) {
    for (const ex of section.exercises ?? []) {
      for (const s of ex.actualSetLogs ?? []) {
        if (s.weight > 0 && s.reps > 0) total += s.weight * s.reps;
      }
    }
  }
  return total;
}
```

### 4. Do NOT write to `workout_logs` from the web app

The `workout_logs` table is **write-only from the mobile app**. The web app is a read-only consumer of this table. Do not add insert/update logic for workout completion in the web app – the source of truth is the mobile logger.

---

## No migrations needed

The `workout_logs` table already exists in production with the correct schema and RLS policies. The web app only needs to update its data-fetching queries.

---

## Summary of changes

| Location | Change |
|----------|--------|
| Workout list query | Add `workout_logs (id, date, started_at, finished_at, sections, notes)` join |
| Workout list UI | Show "Teljesítve" badge + date when `workout_logs.length > 0` |
| Workout detail page | Show log summary: duration, total volume, notes |
| No DB changes | Table and RLS already exist |
