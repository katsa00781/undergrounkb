#!/bin/bash

# Script to debug and report user permissions
# This tool is intended for developers to diagnose permission issues

# Display header
echo "============================"
echo "User Permissions Debug Tool"
echo "============================"
echo

# Function to print section header
section() {
  echo
  echo "=== $1 ==="
  echo "---------------------"
}

# Get the email to check
if [ -z "$1" ]; then
  read -p "Enter user email to check: " EMAIL
else
  EMAIL="$1"
  echo "Checking permissions for: $EMAIL"
fi

# Create temporary SQL script
TMP_SQL="debug_permissions_$(date +%s).sql"

cat > "$TMP_SQL" <<EOF
-- Debug script for user permissions
-- Generated on $(date)

section() {
  \$\$ BEGIN RAISE NOTICE '
=== % ===
---------------------', \$1; END; \$\$;
}

-- Get user information
SELECT section('User Info');
SELECT id, email, role FROM profiles WHERE email = '$EMAIL';

-- Check users table if it exists
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'users') THEN
    RAISE NOTICE 'Users table entry:';
    PERFORM id, email, role FROM users WHERE email = '$EMAIL';
  ELSE
    RAISE NOTICE 'Users table does not exist.';
  END IF;
END \$\$;

-- Check if RPC functions exist
SELECT section('RPC Functions');
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'get_user_role'
) AS get_user_role_exists;

SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'get_current_user_role'
) AS get_current_user_role_exists;

SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'is_admin'
) AS is_admin_exists;

-- Check appointment tables
SELECT section('Appointment Tables');
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'appointments'
) AS appointments_table_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'appointment_bookings'
) AS appointment_bookings_table_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'appointments_participants'
) AS appointments_participants_table_exists;

-- Check if the user has appointments or bookings
SELECT section('User Appointments');
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'appointment_bookings') THEN
    RAISE NOTICE 'User bookings:';
    PERFORM * FROM appointment_bookings
    JOIN profiles ON profiles.id = appointment_bookings.user_id
    WHERE profiles.email = '$EMAIL';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'appointments_participants') THEN
    RAISE NOTICE 'User participants:';
    PERFORM * FROM appointments_participants
    JOIN profiles ON profiles.id = appointments_participants.user_id
    WHERE profiles.email = '$EMAIL';
  END IF;
END \$\$;
EOF

echo "SQL debug script created: $TMP_SQL"
echo
echo "To check permissions:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Run the SQL from $TMP_SQL"
echo
echo "The output will show:"
echo "- User information from profiles and users tables"
echo "- Whether necessary RPC functions exist"
echo "- What appointment tables exist in the database" 
echo "- Any appointments or bookings for this user"
echo
echo "This information will help diagnose permission issues in the application."
