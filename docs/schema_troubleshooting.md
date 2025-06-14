# Profile Schema Troubleshooting Guide

This document provides solutions for fixing profile schema issues in the Kettlebell Pro application.

## Common Issues

### Missing Columns Error

If you see the error "Profile schema verification failed. The database might be missing required columns." in your console, this means some required database columns are missing or there's a schema cache issue.

## Quick Fix

Run the comprehensive fix script:

```bash
./fix-profile-database.sh
```

This script will:
1. Check the current profile structure
2. Add missing `first_name` and `last_name` columns
3. Add all other required profile fields
4. Verify the changes were successfully applied

After running the script, refresh your application.

## Resolving Schema Cache Issues

If you're still seeing schema errors after running the fix script, you might need to clear the schema cache:

```bash
./reset-schema-cache.sh
```

This will:
1. Update your environment variables to disable schema caching
2. Provide instructions for clearing browser cache
3. Reset the schema cache in the application

## Manual Fixes

If the automatic scripts don't work, you can manually fix the schema by running:

```sql
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS fitness_goals text[],
ADD COLUMN IF NOT EXISTS experience_level text;
```

## Verification

You can verify if the columns exist by running:

```bash
./check-profile-structure.sh
```

## Still Having Issues?

If you continue to experience problems, try these steps:

1. Restart your development server with a hard reload:
   ```bash
   npm run dev -- --force
   ```

2. Clear your browser cache completely.

3. Check the browser console for specific error messages.
