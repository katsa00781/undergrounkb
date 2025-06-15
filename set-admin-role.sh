#!/bin/bash

# Script to check and set admin role for a user
# Usage: ./set-admin-role.sh user@example.com

# Display header
echo "=========================================="
echo "Admin Role Setup for AppointmentManager"
echo "=========================================="
echo

# Check if an email was provided
if [ -z "$1" ]; then
    echo "Error: No email address provided."
    echo "Usage: $0 <email>"
    echo "Example: $0 user@example.com"
    exit 1
fi

EMAIL="$1"
echo "Setting admin role for user: $EMAIL"
echo

# Create SQL file for execution
cat > set_admin_role.sql <<EOF
-- Add a note that this SQL is running
DO \$\$
BEGIN
  RAISE NOTICE 'Setting admin role for user with email: ${EMAIL}';
END \$\$;

-- First check if the user exists
DO \$\$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = '${EMAIL}') INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with email % does not exist in the profiles table', '${EMAIL}';
  END IF;
END \$\$;

-- Set admin role in profiles table
UPDATE profiles
SET role = 'admin'
WHERE email = '$EMAIL'
RETURNING id, email, role;

-- Set admin role in users table if it exists
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RAISE NOTICE 'Updating users table as well';
    
    UPDATE users
    SET role = 'admin'
    WHERE email = '$EMAIL';
    
    -- Check if the update affected any rows
    IF NOT FOUND THEN
      RAISE NOTICE 'User not found in users table. Creating entry...';
      
      -- If user doesn't exist in users table, add them
      INSERT INTO users (id, email, role)
      SELECT id, email, 'admin'
      FROM profiles
      WHERE email = '$EMAIL';
    END IF;
  ELSE
    RAISE NOTICE 'Users table does not exist, skipping users table update';
  END IF;
END \$\$;
EOF

echo "SQL file 'set_admin_role.sql' created."
echo
echo "To apply this change:"
echo "1. Go to your Supabase dashboard"
echo "2. Open the SQL Editor"
echo "3. Run the content of set_admin_role.sql file"
echo
echo "Alternative command line method:"
echo "supabase db execute < set_admin_role.sql"
echo
echo "Role setup completed. After applying the SQL, the user should have admin access."
