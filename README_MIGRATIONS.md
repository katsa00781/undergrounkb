# Kettlebell Pro Database Migrations

## Recommended Workflow
1. **Run the Supabase CLI migrations**
   ```bash
   supabase db push
   ```
   This applies every SQL file inside `supabase/migrations` to your project (profiles, FMS, workouts, goals, etc.).
2. **Verify the schema** with the helper scripts:
   ```bash
   ./check-profile-structure.sh
   ./check-fms-table-structure.sql
   ```
3. **Restart the app** (`npm run dev`) and re-test the affected feature.

## Key Migration Files
- `supabase/migrations/20250614214500_add_profile_fields.sql` – Profile form columns + policies
- `supabase/migrations/20250614000001_create_fms_assessments.sql` – FMS assessment table
- `supabase/migrations/20250614144100_create_workouts_table.sql` – Workouts planner storage
- `supabase/migrations/20250615000002_create_appointment_bookings.sql` – Booking tables
- `supabase/migrations/20250616144455_create_user_weights_table.sql` – Progress tracking data

_All migrations now live under `supabase/migrations`. The legacy `apply-*.sh` scripts and `backup/all_migrations` directory have been removed to avoid drift._

## Manual Application
If you cannot run `supabase db push` (e.g. production hotfix):
1. Open the required SQL file from `supabase/migrations`.
2. Copy the contents into the Supabase Dashboard → SQL Editor.
3. Execute the statement(s) and review the Results pane.
4. Run the relevant `check-*` script to confirm the schema. For example:
   ```bash
   ./check-profile-structure.sh
   ```

## Contributing
1. Generate a new migration with the Supabase CLI:
   ```bash
   supabase migration new 20260207_add_example_table
   ```
2. Commit the generated SQL file inside `supabase/migrations`.
3. Document any special verification steps in this README or the feature-specific markdown file.

## Support
For help with migrations, ping the backend team or check `FINAL_PROJECT_STATUS.md` for the latest contact info.
