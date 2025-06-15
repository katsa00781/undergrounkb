#!/bin/bash

# Script to fix user role management issues
# This script will add necessary RPC functions to Supabase

echo "=========================================="
echo "User Role Management Fix Script"
echo "=========================================="
echo

echo "This script will add necessary RPC functions to your Supabase database."
echo "These functions are needed for proper authorization and access control."
echo

# Create SQL file with the required functions
cat > fix_role_functions.sql <<EOF
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
EOF

echo "Generated SQL file with necessary functions."
echo
echo "To apply these fixes:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Open the fix_role_functions.sql file that was just created"
echo "4. Execute the SQL to create the functions"
echo
echo "Alternatively, you can use the Supabase CLI to apply this directly:"
echo "supabase db execute < fix_role_functions.sql"
echo
echo "After applying the fix, restart your application"
echo

# Provide guidance for directly testing if the user is an admin
echo "For testing, you can add this code to a component to debug your role:"
echo "-----------------------------------------------------------------"
echo "useEffect(() => {"
echo "  const checkRole = async () => {"
echo "    try {"
echo "      const { data, error } = await supabase.rpc('is_current_user_admin');"
echo "      console.log('Is admin:', data);"
echo "      if (error) console.error('Role check error:', error);"
echo "    } catch (err) {"
echo "      console.error('Error checking role:', err);"
echo "    }"
echo "  };"
echo "  checkRole();"
echo "}, []);"
echo "-----------------------------------------------------------------"
echo

echo "User Role Management Fix Script completed!"
