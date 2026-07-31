-- Az fms_admin_all policy soha nem illeszkedett: `auth.jwt() ->> 'user_role'`-t
-- vizsgált, de egyetlen usernél sincs beállítva a raw_app_meta_data.user_role,
-- és custom access token hook sincs az adatbázisban. Emiatt az admin sem olvasni,
-- sem beszúrni nem tudott más felhasználó FMS felmérését (a /assessment oldal
-- `user_id: linkedUserId`-vel szúr be, amit az fms_insert_own blokkolt).
--
-- A javítás a profiles.role oszlopra épül, de SECURITY DEFINER helper függvényen
-- keresztül: a profiles táblán van egy önhivatkozó FOR ALL policy
-- (20260731120000_fix_admin_profiles_rls_policy.sql), így egy másik tábla
-- policy-jébe írt inline profiles-subquery a klasszikus
-- "42P17 infinite recursion detected in policy" hibaformát adná. A SECURITY
-- DEFINER függvény a tulajdonos jogán fut, tehát a profiles RLS-e rá nem
-- vonatkozik, és a rekurzió strukturálisan lehetetlen.

-- Külön névvel, nem `is_admin`-ként: a sémában már van egy régi
-- `public.is_admin(uuid)` → `get_user_role(uuid)` páros, ami VOLATILE plpgsql és
-- nincs rögzített search_path-ja. RLS policy-ben az STABLE + search_path-pinned
-- SQL változat a helyes, a névütközés pedig félrevezető lenne.
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
-- Kötelező SECURITY DEFINER mellett: search_path hijack elleni védelem.
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- A service_role Supabase-ben BYPASSRLS, ezért a régi
-- `auth.jwt() ->> 'role' = 'service_role'` ág elhagyható.
DROP POLICY IF EXISTS fms_admin_all ON public.fms_assessments;

CREATE POLICY fms_admin_all ON public.fms_assessments
FOR ALL
TO authenticated
USING (public.current_user_is_admin())
WITH CHECK (public.current_user_is_admin());

-- A riport oldal user_id + date szerint kérdez le.
CREATE INDEX IF NOT EXISTS fms_assessments_user_date_idx
  ON public.fms_assessments (user_id, date DESC);
