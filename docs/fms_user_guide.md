# FMS Assessment User Guide

## Overview

The Functional Movement Screen (FMS) assessment feature allows trainers to evaluate client movement patterns using a standardized 7-point test. This guide explains how to use the feature and troubleshoot common issues.

## Prerequisites

Before using the FMS assessment feature:

1. Make sure the FMS assessments table exists in your Supabase database
2. Ensure you have users (clients) in your profiles table

## Common Issues and Solutions

### "No users available" in dropdown

If you see "No users available - Please add users first" in the dropdown menu:

1. **Check if profiles table exists and has users**:
   ```bash
   npx ts-node scripts/check-profiles-table.ts
   ```

2. **Add a test user** (if needed for testing):
   ```bash
   npx ts-node scripts/add-test-user.ts
   ```

### Database permissions issues

If you're getting permission errors when trying to select users:

1. Make sure the correct RLS (Row Level Security) policies are in place for the profiles table
2. Verify that the authenticated user has the correct role/permissions

### Error saving assessment

If you encounter errors when saving an assessment:

1. Ensure the `fms_assessments` table exists:
   ```bash
   npx ts-node scripts/check-fms-table.ts
   ```

2. Make sure all required fields are filled out in the form
3. Check browser console for specific error messages

## Understanding the User Dropdown

The user dropdown in the FMS assessment page:

- Fetches users from the `profiles` table in Supabase
- Displays users using their first and last name (if available) or email
- Requires at least one user in the system to perform an assessment

## Adding New Users

There are two ways to add new users to the system:

1. **Through the application**: Use the user management interface (if available)
2. **Directly in Supabase**:
   - Go to your Supabase dashboard
   - Navigate to the `profiles` table 
   - Click "Insert row" and fill in the required fields:
     - `id`: UUID matching the auth.users ID
     - `email`: User's email
     - `first_name`: User's first name
     - `last_name`: User's last name
     - `role`: User's role (e.g., "client")

## Support

If you continue to experience issues with the FMS assessment feature, please report them with:

1. Specific error messages from the browser console
2. Steps to reproduce the issue
3. Information about your environment (browser, OS)
