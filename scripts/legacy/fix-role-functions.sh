#!/bin/bash

# Script to fix RPC functions for user role management

# Display header
echo "============================"
echo "Role Management Fix Script"
echo "============================"
echo

# Create migrations directory for the RPC functions if it doesn't exist
MIGRATIONS_DIR="supabase/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Creating migrations directory..."
    mkdir -p "$MIGRATIONS_DIR"
fi

# Create a new migration file for RPC functions
TIMESTAMP=$(date '+%Y%m%d%H%M%S')
MIGRATION_FILE="$MIGRATIONS_DIR/${TIMESTAMP}_add_role_functions.sql"

echo "Creating migration file: $MIGRATION_FILE"

# Write SQL to migration file
cat > "$MIGRATION_FILE" <<EOF
-- Migration to add user role management RPC functions
-- This ensures proper role checking across the application

-- Function to get a user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS \$\$
DECLARE
    user_role text;
BEGIN
    -- First try the profiles table
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    
    -- If not found, try the users table
    IF user_role IS NULL THEN
        SELECT role INTO user_role FROM public.users WHERE id = user_id;
    END IF;
    
    -- Return 'user' as default if no role found
    RETURN COALESCE(user_role, 'user');
END;
\$\$;

-- Function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS \$\$
DECLARE
    user_role text;
BEGIN
    -- First try the profiles table
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    
    -- If not found, try the users table
    IF user_role IS NULL THEN
        SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
    END IF;
    
    -- Return 'user' as default if no role found
    RETURN COALESCE(user_role, 'user');
END;
\$\$;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS \$\$
DECLARE
    user_role text;
BEGIN
    -- Get the user role 
    SELECT public.get_user_role(user_id) INTO user_role;
    
    -- Check if it's admin
    RETURN user_role = 'admin';
END;
\$\$;

-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS \$\$
BEGIN
    RETURN public.is_admin(auth.uid());
END;
\$\$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
EOF

echo "Migration file created successfully."
echo
echo "To apply this migration:"
echo "1. Run the following command to push the migration to your Supabase project:"
echo "   supabase db push"
echo
echo "2. Alternatively, you can apply the SQL manually:"
echo "   a. Go to your Supabase dashboard"
echo "   b. Navigate to the SQL Editor"
echo "   c. Run the SQL from $MIGRATION_FILE"
echo
echo "3. For local development, you can also apply the migration with:"
echo "   psql -f $MIGRATION_FILE yourdb"
echo
echo "After applying the migration, restart the application."
echo
echo "Role Management Fix completed!"
