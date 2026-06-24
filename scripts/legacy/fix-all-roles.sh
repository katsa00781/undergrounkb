#!/bin/bash

# Script to fix all user roles in the database
# This script sets all users to admin for emergency access

# Display header
echo "============================"
echo "Emergency Role Fix Script"
echo "============================"
echo

# Create SQL file for execution
cat > emergency_role_fix.sql <<EOF
-- Set all users in profiles to admin role
UPDATE profiles SET role = 'admin';

-- Set all users in users table to admin if it exists
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE users SET role = 'admin';
  END IF;
END \$\$;

-- Display updated user counts
SELECT role, COUNT(*) FROM profiles GROUP BY role;
EOF

echo "SQL file 'emergency_role_fix.sql' created."
echo
echo "WARNING: This is an emergency fix that will set ALL users to admin role."
echo "Use this only when you need immediate access for all users."
echo
echo "To apply this emergency fix:"
echo "1. Go to your Supabase dashboard"
echo "2. Open the SQL Editor"
echo "3. Run the content of emergency_role_fix.sql file"
echo
echo "Alternative command line method:"
echo "supabase db execute < emergency_role_fix.sql"
echo
echo "After resolving the immediate access issues, use the regular role management"
echo "tools to properly assign specific roles to users."
