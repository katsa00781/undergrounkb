-- Fix recursive policy for admin role
-- Delete the existing recursive policy first
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Use a simpler, non-recursive approach for admin policy
CREATE POLICY "Admin access all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (
    (SELECT role FROM auth.users 
     LEFT JOIN public.profiles ON auth.users.id = public.profiles.id
     WHERE auth.users.id = auth.uid()
    ) = 'admin'
);