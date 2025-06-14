# User Profile Management Guide

This guide explains how to update user profiles in the system, specifically for the FMS assessment feature.

## Viewing User Profiles

To see all user profiles in the system:

```bash
node scripts/update-user-profile.cjs list
```

This will display all users with their IDs, emails, and names.

## Updating User Names

To update a user's first and last name:

```bash
node scripts/update-user-profile.cjs <userId> <firstName> <lastName>
```

Example:
```bash
node scripts/update-user-profile.cjs 5500b878-4c7b-436d-a5fc-ac044915e8ec "John" "Doe"
```

To update only the first name:
```bash
node scripts/update-user-profile.cjs <userId> <firstName>
```

## Common Issues with User Selection in FMS Assessment

If the user dropdown in the FMS assessment page isn't showing users correctly:

1. **Empty Dropdown**: This means no users were found in the profiles table. Add users through the application's user management interface or use the script above.

2. **No Names Displayed**: If users appear but only show email addresses, update their profiles with first and last names using the script.

3. **Refresh Issues**: Use the refresh button next to the dropdown to reload the user list if changes were made to user profiles.

## User Profile Structure

In the database, user profiles have these important fields:

- `id`: The user's unique identifier
- `email`: The user's email address
- `first_name`: The user's first name (may be null)
- `last_name`: The user's last name (may be null)

The system will attempt to display users in this priority:
1. First name + Last name (if both exist)
2. First name only (if last name doesn't exist)
3. Email address (if no name exists)
4. User ID (truncated, if no other information exists)

## Troubleshooting

If you're experiencing issues with user management:

1. Check that your database connection is working
2. Verify that the profiles table exists and has proper permissions
3. Ensure users have been created in the auth system and have corresponding profiles
4. Look for errors in the browser console or server logs

For further assistance, refer to the full documentation or contact technical support.
