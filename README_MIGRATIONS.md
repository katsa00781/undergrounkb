# Kettlebell Pro Database Migration Scripts

This directory contains migration scripts for the Kettlebell Pro application.

## Available Scripts

### Profile Table Migration
Adds necessary columns to the profiles table for user profiles:
```
./apply-profile-migration.sh
```

This script will add:
- `height` (numeric)
- `weight` (numeric)
- `birthdate` (date)
- `gender` (text)
- `fitness_goals` (text[])
- `experience_level` (text)

### FMS Table Migration
Ensures the FMS assessments table is properly structured:
```
./apply-fms-migration.sh
```

### Workouts Table Migration
Creates and configures the workouts table:
```
./apply-workouts-migration.sh
```

## Checking Table Structure
To verify the structure of tables:
```
./check-profile-structure.sh
```

## Common Issues

### Execute SQL Error
If you see an error like:
```
{"code":"PGRST202","details":"Searched for the function public.execute_sql with parameter sql or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.","hint":null,"message":"Could not find the function public.execute_sql..."}
```

This means your database doesn't have the `execute_sql` function. You will need to manually apply the migration.

### Manually Applying Migrations
1. Open the SQL file in `backup/all_migrations/` directory
2. Copy the SQL content
3. Execute it directly in your Supabase SQL editor or using your preferred database client

## Contributing
When adding new migrations:
1. Create SQL file in `backup/all_migrations/` with format `YYYYMMDDHHmmSS_descriptive_name.sql`
2. Add a corresponding shell script to run the migration
3. Document the migration in this README

## Support
For help with these scripts, contact the development team.
