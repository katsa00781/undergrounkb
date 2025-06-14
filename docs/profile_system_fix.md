# Profile System Troubleshooting

## Overview of the Issue

The profile management system has been experiencing issues with database schema mismatches, particularly:

1. **Missing Columns Error** - The error "Could not find the 'first_name' column of 'profiles' in the schema cache" indicates that either:
   - The column doesn't exist in the database
   - The column exists but the client's schema cache is outdated
   - There's a type mismatch between the TypeScript definitions and the actual database schema

2. **Array Data Issues** - The `fitness_goals` array is not properly saved to the database because:
   - It may not be properly initialized as an array
   - There could be conversion issues between string and array types
   - The database column might not be properly defined as an array type

## Solution Implemented

We've taken a multi-faceted approach to fix these issues:

### 1. Database Schema Verification

We've added a function in `useProfileProvider.ts` to verify the database schema at runtime:

```typescript
async function verifyProfileSchema(): Promise<boolean> {
  try {
    // Just attempt a query that uses first_name
    const { error } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .limit(1);
    
    return !error;
  } catch (err) {
    console.error('Error verifying profile schema:', err);
    return false;
  }
}
```

### 2. Improved Error Handling

The profile update function now has better error handling:

```typescript
// First try to verify if the schema is valid before attempting update
const schemaValid = await verifyProfileSchema();
if (!schemaValid) {
  toast.error('Database schema issue detected. Please run database migrations.');
  return null;
}
```

### 3. Type Safety Improvements

We've enhanced type safety in the code:

```typescript
// Safely check for property existence
const hasFirstName = profile && 'first_name' in profile;

// Ensure fitness_goals is always an array
const fitnessGoalsArray = Array.isArray(data.fitnessGoals) ? data.fitnessGoals : [];
```

### 4. Migration Scripts

We've created or improved several scripts:

- **fix-profile-columns.sh** - Shell script to add missing columns
- **reset-schema-cache.ts** - TypeScript script to reset the client's schema cache
- **diagnose-profile-issue.ts** - Comprehensive diagnostic tool

## How to Fix the Issue

If you encounter the "first_name column not found" error or issues with fitness goals not saving, the simplest solution is to use our comprehensive fix script:

### Quick Fix (Recommended)

```bash
npm run fix:profile:all
```

This script will:
1. Check the current profile structure
2. Add missing first_name and last_name columns 
3. Add all other required profile fields
4. Verify the changes were successfully applied

### Manual Step-by-Step Fix

If the quick fix doesn't work, you can try the individual steps:

1. **Run the diagnostic script**:
   ```bash
   npm run diagnose:profile
   ```

2. **Fix the first_name column specifically**:
   ```bash
   npm run fix:first-name
   ```

3. **Apply the full database migration**:
   ```bash
   npm run fix:profile
   ```

4. **Reset the schema cache**:
   ```bash
   npm run reset:schema
   ```

5. **Restart your application** to ensure the schema cache is fully refreshed

## Prevention for Future Issues

1. **Always run migrations** before deploying new code that depends on schema changes
2. **Type check database operations** at compile time using TypeScript
3. **Handle array fields explicitly** - always ensure arrays are properly initialized
4. **Verify schema at runtime** for critical features

## Technical Details

### The Profile Schema

The profiles table should have these columns:

- `id` (UUID, primary key)
- `email` (text)
- `first_name` (text)
- `last_name` (text)
- `height` (numeric)
- `weight` (numeric)
- `birthdate` (date)
- `gender` (text)
- `fitness_goals` (text array)
- `experience_level` (text)

### Handling Array Fields

When dealing with the fitness_goals array:

1. **Always verify it's an array before operations**:
   ```typescript
   const fitnessGoalsArray = Array.isArray(data.fitnessGoals) ? data.fitnessGoals : [];
   ```

2. **Provide fallback values** when necessary:
   ```typescript
   const backupGoals = ['Strength', 'Flexibility'].filter(g => !fitnessGoalsArray.includes(g));
   ```

3. **Use type-safe database operations**:
   ```typescript
   fitness_goals: fitnessGoalsArray.length > 0 ? fitnessGoalsArray : backupGoals,
   ```
