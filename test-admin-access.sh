#!/bin/bash

# Script to test if admin role settings allow access to AppointmentManager page
# This checks all the required conditions for admin access

# Display header
echo "=========================================="
echo "Admin Access Test for AppointmentManager"
echo "=========================================="
echo

# Check if email is provided
if [ -z "$1" ]; then
    read -p "Enter user email to test: " EMAIL
else
    EMAIL="$1"
fi

echo "Testing admin access for user: $EMAIL"
echo

# Create SQL test file
cat > test_admin_access.sql <<EOF
-- Set client variables
SET LOCAL ROLE authenticated;

-- Test results header
\echo '\n==== ADMIN ACCESS TEST RESULTS ====\n'

-- 1. Check if the user exists in profiles
\echo '1. User Profile Check:'
SELECT id, email, role FROM profiles WHERE email = '$EMAIL';

-- 2. Check if the RPC functions exist
\echo '\n2. RPC Function Check:'
SELECT 
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') AS get_user_role_exists,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'is_admin') AS is_admin_exists;

-- 3. Check if the user has admin role properly set
\echo '\n3. User Role Check:'
SELECT email, role, 
       CASE WHEN role = 'admin' THEN 'YES - Can access /appointments/manage'
            ELSE 'NO - Cannot access admin pages' END AS can_access_admin_pages
FROM profiles WHERE email = '$EMAIL';

-- 4. Check users table if it exists
\echo '\n4. Users Table Check:'
DO \$\$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE NOTICE 'Users table exists. Checking user record:';
    ELSE
        RAISE NOTICE 'Users table does not exist.';
    END IF;
END \$\$;

DO \$\$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM users WHERE email = '$EMAIL') THEN
            RAISE NOTICE 'User record: %', (SELECT row_to_json(u) FROM (SELECT * FROM users WHERE email = '$EMAIL') u);
        ELSE
            RAISE NOTICE 'User not found in users table.';
        END IF;
    END IF;
END \$\$;

-- 5. Check for role inconsistencies
\echo '\n5. Role Consistency Check:'
DO \$\$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM profiles p JOIN users u ON p.id = u.id WHERE p.email = '$EMAIL' AND p.role != u.role) THEN
            RAISE NOTICE 'ISSUE FOUND: Role inconsistency between profiles and users tables!';
            RAISE NOTICE 'Details: %', (
                SELECT json_build_object(
                    'profile_role', p.role,
                    'user_role', u.role
                )
                FROM profiles p JOIN users u ON p.id = u.id 
                WHERE p.email = '$EMAIL'
            );
        ELSE
            RAISE NOTICE 'No role inconsistencies found.';
        END IF;
    END IF;
END \$\$;

-- 6. Summary
\echo '\n6. Access Summary:'
DO \$\$
DECLARE
    user_id uuid;
    user_role text;
BEGIN
    -- Get user ID and role
    SELECT id, role INTO user_id, user_role FROM profiles WHERE email = '$EMAIL';
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found in the database!';
        RETURN;
    END IF;
    
    IF user_role = 'admin' THEN
        RAISE NOTICE 'User has admin role and should be able to access /appointments/manage';
    ELSE
        RAISE NOTICE 'User has role "%", which does not have access to admin pages', user_role;
        RAISE NOTICE 'To fix: Use ./set-admin-role.sh $EMAIL to set admin role';
    END IF;
END \$\$;
EOF

echo "Test SQL script created: test_admin_access.sql"
echo
echo "To run this test:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Run the content of test_admin_access.sql"
echo
echo "The test will check all conditions required for admin access to /appointments/manage"
echo "Follow the recommendations in the test results to fix any access issues"
