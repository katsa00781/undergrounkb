-- SUPABASE KOMPATIBILIS RLS ÉS PERMISSION FIX
-- Ez a script javítja a 403 Forbidden hibát a profiles tábla frissítésénél
-- Supabase PostgreSQL verzióhoz optimalizálva

-- ==========================================
-- 1. JELENLEGI ÁLLAPOT ELLENŐRZÉSE
-- ==========================================

-- Tábla létezésének ellenőrzése
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'profiles'
        ) 
        THEN '✅ PROFILES TÁBLA LÉTEZIK'
        ELSE '❌ PROFILES TÁBLA NEM LÉTEZIK!'
    END as table_status;

-- Meglévő RLS policy-k listázása
SELECT 
    policyname as "Policy Name",
    cmd as "Operation",
    qual as "Condition"
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ==========================================
-- 2. RLS POLICY-K ÚJRALÉTREHOZÁSA
-- ==========================================

-- RLS engedélyezése (ha még nincs)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Régi policy-k törlése
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.profiles;

-- Új, biztonságos policy-k létrehozása
-- SELECT policy - felhasználó láthatja saját profilját
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- INSERT policy - felhasználó létrehozhatja saját profilját
CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE policy - felhasználó frissítheti saját profilját
CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE policy - felhasználó törölheti saját profilját
CREATE POLICY "profiles_delete_policy"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- ==========================================
-- 3. TÁBLA JOGOSULTSÁGOK BEÁLLÍTÁSA
-- ==========================================

-- Authenticated felhasználók jogosultságai
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Anon felhasználók jogosultságai (csak olvasás, ha szükséges)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.profiles TO anon;

-- ==========================================
-- 4. SECURITY DEFINER FUNCTION
-- ==========================================

-- Biztonságos profil frissítő function
CREATE OR REPLACE FUNCTION update_user_profile(
    user_id UUID,
    profile_data JSONB
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Biztonsági ellenőrzés: csak saját profil frissíthető
    IF auth.uid() != user_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot update another user profile';
    END IF;
    
    -- Profil frissítése
    RETURN QUERY
    UPDATE public.profiles
    SET 
        display_name = COALESCE(
            NULLIF((profile_data->>'display_name')::TEXT, ''), 
            display_name
        ),
        full_name = COALESCE(
            NULLIF((profile_data->>'display_name')::TEXT, ''), 
            full_name
        ),
        height = COALESCE(
            CASE 
                WHEN profile_data ? 'height' AND (profile_data->>'height') != 'null'
                THEN (profile_data->>'height')::INTEGER 
                ELSE NULL 
            END, 
            height
        ),
        weight = COALESCE(
            CASE 
                WHEN profile_data ? 'weight' AND (profile_data->>'weight') != 'null'
                THEN (profile_data->>'weight')::DECIMAL 
                ELSE NULL 
            END, 
            weight
        ),
        birthdate = COALESCE(
            CASE 
                WHEN profile_data ? 'birthdate' AND (profile_data->>'birthdate') != 'null' AND (profile_data->>'birthdate') != ''
                THEN (profile_data->>'birthdate')::DATE 
                ELSE NULL 
            END, 
            birthdate
        ),
        gender = COALESCE(
            NULLIF((profile_data->>'gender')::TEXT, ''), 
            gender
        ),
        fitness_goals = COALESCE(
            CASE 
                WHEN profile_data ? 'fitness_goals' 
                THEN (profile_data->'fitness_goals')::JSONB 
                ELSE NULL 
            END, 
            fitness_goals
        ),
        experience_level = COALESCE(
            NULLIF((profile_data->>'experience_level')::TEXT, ''), 
            experience_level
        ),
        updated_at = NOW()
    WHERE id = user_id
    RETURNING *;
END $$;

-- Function komment
COMMENT ON FUNCTION update_user_profile(UUID, JSONB) IS 'Biztonságosan frissíti a felhasználó profilját RLS megkerülésével';

-- ==========================================
-- 5. HELPER FUNCTION PROFIL LÉTREHOZÁSÁHOZ
-- ==========================================

CREATE OR REPLACE FUNCTION create_user_profile_if_not_exists(user_id UUID)
RETURNS void AS $$
BEGIN
    -- Ellenőrizzük, hogy létezik-e már a profil
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        -- Ha nem létezik, létrehozzuk alapértelmezett értékekkel
        INSERT INTO public.profiles (id, created_at, updated_at)
        VALUES (user_id, NOW(), NOW());
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. ELLENŐRZŐ LEKÉRDEZÉSEK
-- ==========================================

-- RLS policy-k ellenőrzése
SELECT 
    policyname as "Policy Name",
    cmd as "Operation",
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Olvasás'
        WHEN cmd = 'INSERT' THEN '➕ Beszúrás'
        WHEN cmd = 'UPDATE' THEN '✏️ Frissítés'
        WHEN cmd = 'DELETE' THEN '🗑️ Törlés'
        ELSE '❓ Egyéb'
    END as "Operation Type"
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd;

-- Jogosultságok ellenőrzése
SELECT 
    grantee as "Role",
    privilege_type as "Permission",
    is_grantable as "Can Grant"
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY grantee, privilege_type;

-- Functions ellenőrzése
SELECT 
    routine_name as "Function Name",
    routine_type as "Type"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_user_profile', 'create_user_profile_if_not_exists');

-- ==========================================
-- 7. TESZT PROFIL CREATION (OPCIONÁLIS)
-- ==========================================

-- Ez csak akkor fog működni, ha van aktív auth session
-- Uncomment if needed:
/*
SELECT create_user_profile_if_not_exists(auth.uid());
*/

-- ==========================================
-- 8. SUCCESS NOTIFICATION
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '✅ PROFILES PERMISSION FIX SUCCESSFULLY APPLIED!';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Changes made:';
    RAISE NOTICE '   • RLS policies recreated with correct auth.uid() checks';
    RAISE NOTICE '   • Table permissions granted to authenticated/anon roles';
    RAISE NOTICE '   • Security Definer function created: update_user_profile()';
    RAISE NOTICE '   • Helper function created: create_user_profile_if_not_exists()';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Test the Profile page - it should work now!';
    RAISE NOTICE '   2. Check the browser console for any remaining errors';
    RAISE NOTICE '   3. Verify data is saved in the profiles table';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 If you still get 403 errors:';
    RAISE NOTICE '   • Make sure you are logged in (auth.uid() returns a value)';
    RAISE NOTICE '   • Check the Supabase Logs in the Dashboard';
    RAISE NOTICE '   • The useProfileProvider.ts will try the security function first';
    RAISE NOTICE '';
    RAISE NOTICE '✨ Happy coding!';
END $$;
