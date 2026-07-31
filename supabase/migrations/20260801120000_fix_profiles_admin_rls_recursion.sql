-- A 20260731120000_fix_admin_profiles_rls_policy.sql önhivatkozó policy-t hozott
-- létre: a profiles táblán lévő FOR ALL policy USING/WITH CHECK ága magából a
-- profiles táblából olvasott subqueryvel. A Postgres ilyenkor a profiles minden
-- lekérdezésénél "42P17 infinite recursion detected in policy for relation
-- profiles" hibát dob — beleértve a saját profil SELECT-jét is. Emiatt a kliens
-- nem tudta betölteni a profilt, a role ismeretlen maradt, és az admin menüpontok
-- (FMS Felmérés, Gyakorlattár, stb.) eltűntek a sidebarból.
--
-- A javítás ugyanaz a minta, mint az fms_admin_all-nál: a 20260801100000-ben
-- létrehozott public.current_user_is_admin() SECURITY DEFINER helper a tulajdonos
-- jogán fut, így a profiles RLS-e rá nem vonatkozik, és a rekurzió strukturálisan
-- lehetetlen.

DROP POLICY IF EXISTS "Enable all access for specific admin" ON public.profiles;

CREATE POLICY "Enable all access for specific admin" ON public.profiles
FOR ALL
TO authenticated
USING (public.current_user_is_admin())
WITH CHECK (public.current_user_is_admin());
