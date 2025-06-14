-- Ultimate fix for recursion issues - remove all policies and start fresh
-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create the simplest non-recursive policies
CREATE POLICY "allow_public_select" ON public.profiles 
FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "allow_individual_update" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_individual_delete" ON public.profiles
FOR DELETE TO authenticated
USING (auth.uid() = id);

-- Define admin role separately without using profiles table in policy definition
CREATE ROLE admin_role;
GRANT admin_role TO authenticator;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
