-- Fix recursive policy for admin role
-- Delete the existing recursive policy first
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Use a simpler, non-recursive approach for admin policy
CREATE POLICY "Admin access all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
    (
        SELECT p.role
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE au.id = auth.uid()
    ) = 'admin'
);