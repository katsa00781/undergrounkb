# FMS Assessment User Selection Fix

## The Issue

The FMS Assessment page was having issues loading and displaying users because:

1. The `getAllUsers()` function was trying to select a `name` field from the `profiles` table, but this field doesn't exist
2. The profiles table has `first_name` and `last_name` fields instead
3. Some users in the database may have null values for first_name and last_name fields

## What Was Fixed

1. Updated the `getAllUsers()` function in `src/lib/fms.ts` to:
   - Select the correct fields: `id, email, first_name, last_name`
   - Format the data to create a display name using first name, last name, and email
   - Add better error handling and logging
   - Handle cases where name fields might be null

2. Enhanced the `loadUsers()` function in `FMSAssessment.tsx` to:
   - Provide better error messages
   - Handle the case when no users are found
   - Log more detailed information for debugging
   - Show success notifications when users are loaded

3. Updated the user selection dropdown to:
   - Show a message when no users are available
   - Disable the dropdown when empty
   - Provide better visual feedback
   - Add a refresh button to reload user list
   - Improve handling of missing user data

4. Added helper scripts:
   - `scripts/check-profiles.cjs`: Checks if the profiles table exists and has users
   - `scripts/update-user-profile.cjs`: Tool to update user profiles with names

## How To Test The Fix

1. Check if your profiles table has users:

   ```bash
   node scripts/check-profiles.cjs
   ```

2. View all user profiles in the system:

   ```bash
   node scripts/update-user-profile.cjs list
   ```

3. If needed, update a user's profile with a name:

   ```bash
   node scripts/update-user-profile.cjs <userId> "FirstName" "LastName"
   ```

4. Open the FMS assessment page and click the refresh button next to the user dropdown

## Future Improvements

- Add ability to create new users directly from the FMS assessment page
- Add search functionality to the user dropdown for easier selection
- Show additional user information next to the dropdown (e.g., profile picture, contact info)
- Implement a user profile management interface in the application
- Add validation to ensure profiles have proper name information

## Documentation

For more information, see:
- [FMS Assessment User Guide](fms_user_guide.md)
- [User Profile Management Guide](user_profile_management.md)
