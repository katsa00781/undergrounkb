# Testing the Profile Form Functionality

This guide explains how to test the profile form functionality to ensure data is properly saved to the database.

## Prerequisites
- Make sure you have access to the application and a user account
- Ensure the profile table has the necessary columns (height, weight, etc.)

## Test Instructions

### Option 1: Testing in the Webapp
1. Log in to the application
2. Navigate to the Profile page
3. Fill out the form with test data:
   - Full Name: [Test value]
   - Birth Date: [Select a date]
   - Height: [Enter a number]
   - Weight: [Enter a number]
   - Gender: [Select an option]
   - Experience Level: [Select an option]
   - Fitness Goals: [Select multiple checkboxes]
4. Click "Save Changes"
5. Verify that a success message appears
6. Refresh the page and verify that the entered data is still there

### Option 2: Supabase CLI ellenőrzés
Ha a háttérben szeretnéd validálni a mezőket:

```bash
supabase db push
```

Ez lefuttatja a `supabase/migrations` alatt található migrációkat, így minden szükséges oszlop és policy létrejön.

### Option 3: Directly Running SQL
To verify at the database level:

```sql
-- Check profile structure
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles';

-- Find a specific profile
SELECT *
FROM profiles
WHERE email = 'your-email@example.com';
```

## Troubleshooting
If the form doesn't save correctly, check:

1. **Database Schema Issues**
   - Run `./check-profile-structure.sh` to verify table columns
   - If columns are missing, futtasd a `supabase db push` parancsot, vagy manuálisan alkalmazd a `supabase/migrations/20250614214500_add_profile_fields.sql` fájl tartalmát

2. **Auth Context**
   - Make sure you're properly logged in
   - Check browser console for auth-related errors

3. **Network Issues**
   - Check browser network tab for failed requests
   - Verify Supabase URL and API keys are correct

## Reporting Issues
If you encounter persistent issues with the profile form, please include:
- Steps to reproduce the issue
- The specific data you're trying to save
- Any error messages displayed or logged to console
- Browser and OS information
