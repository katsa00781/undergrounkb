-- Fix broken admin RLS policy on public.profiles.
-- The old "Enable all access for specific admin" policy queried auth.users
-- directly, which the `authenticated` role has no SELECT grant on, causing
-- every admin UPDATE on another user's profile to fail with
-- "permission denied for table users" (42501). Replace it with a check
-- against the existing profiles.role column instead.

DROP POLICY IF EXISTS "Enable all access for specific admin" ON public.profiles;

CREATE POLICY "Enable all access for specific admin" ON public.profiles
FOR ALL
USING (
  (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'admin'
);
