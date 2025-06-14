-- Simplify all policies to avoid recursion issues

-- Fix profiles policies
DROP POLICY IF EXISTS "Admin access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Simplified policies
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- First bootstrap admin - this needs to be done outside RLS
INSERT INTO public.profiles (id, email, role, full_name)
SELECT id, email, 'admin', 'Administrator'
FROM auth.users 
WHERE email = 'admin@example.com' -- Az első admin email címe
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Create a special manual function to grant admin access
CREATE OR REPLACE FUNCTION public.grant_admin_access(target_user_id UUID)
RETURNS void AS $$
DECLARE
    current_user_role user_role;
BEGIN
    -- Get the current user's role directly without using EXISTS
    SELECT role INTO current_user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Only an admin can execute this function
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can grant admin access';
    END IF;

    -- Update the user role to admin
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- We need a special policy for admins that doesn't cause recursion
CREATE POLICY "Admin can manage all profiles"
ON public.profiles
FOR ALL
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
    )
);