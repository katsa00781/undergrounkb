-- RLS ÉS PERMISSION PROBLÉMA JAVÍTÁSA
-- Ez a script javítja a 403 Forbidden hibát a profiles tábla frissítésénél

-- ==========================================
-- 1. JELENLEGI RLS POLICY-K ELLENŐRZÉSE
-- ==========================================

-- Meglévő policy-k listázása
SELECT 
    policyname,
    cmd as operation,
    permissive,
    roles,
    qual as condition,
    with_check as check_condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ==========================================
-- 2. TÁBLA JOGOSULTSÁGOK ELLENŐRZÉSE
-- ==========================================

-- Tábla owner ellenőrzése
SELECT 
    tableowner,
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Tábla jogosultságok ellenőrzése (information_schema használatával)
SELECT 
    grantee,
    privilege_type,
    is_grantable,
    grantor
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY grantee, privilege_type;

-- RLS állapot ellenőrzése
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ==========================================
-- 3. FOREIGN KEY KAPCSOLATOK ELLENŐRZÉSE
-- ==========================================

-- Ellenőrizzük, hogy van-e foreign key kapcsolat users táblára
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'profiles';

-- ==========================================
-- 4. RLS POLICY-K ÚJRALÉTREHOZÁSA
-- ==========================================

-- Régi policy-k törlése
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Biztonságos policy-k létrehozása
-- VIEW policy - felhasználó láthatja saját profilját
CREATE POLICY "Enable read access for users based on user_id"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- INSERT policy - felhasználó létrehozhatja saját profilját
CREATE POLICY "Enable insert for users based on user_id"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE policy - felhasználó frissítheti saját profilját
CREATE POLICY "Enable update for users based on user_id"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE policy - felhasználó törölheti saját profilját (opcionális)
CREATE POLICY "Enable delete for users based on user_id"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- ==========================================
-- 5. TÁBLA JOGOSULTSÁGOK BEÁLLÍTÁSA
-- ==========================================

-- Alapértelmezett jogosultságok megadása authenticated felhasználóknak
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Anon felhasználóknak csak olvasási jog (ha szükséges)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.profiles TO anon;

-- ==========================================
-- 6. FOREIGN KEY MÓDOSÍTÁSA (ha szükséges)
-- ==========================================

-- Ellenőrizzük és javítsuk a foreign key kapcsolatokat
DO $$
BEGIN
    -- Ellenőrizzük, hogy létezik-e a profiles_id_fkey constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'profiles_id_fkey constraint exists, checking if modification needed';
        
        -- Supabase-ben általában már jól van beállítva, de ellenőrizzük
        -- Ha problémák vannak, akkor módosíthatjuk
        
    ELSE
        RAISE NOTICE 'No profiles_id_fkey constraint found - this is OK for Supabase';
    END IF;
    
    -- Ellenőrizzük, hogy van-e auth.users tábla referencia probléma
    -- Supabase-ben ez általában automatikusan kezelve van
    RAISE NOTICE 'Foreign key check completed';
END $$;

-- ==========================================
-- 7. SECURITY DEFINER FUNCTION (ALTERNATÍV MEGOLDÁS)
-- ==========================================

-- Létrehozunk egy security definer function-t a biztonságos frissítéshez
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
    -- Ellenőrizzük, hogy a felhasználó csak saját profilját frissíti
    IF auth.uid() != user_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot update another user''s profile';
    END IF;
    
    -- Frissítjük a profilt
    RETURN QUERY
    UPDATE public.profiles
    SET 
        display_name = COALESCE(
            NULLIF((profile_data->>'display_name')::TEXT, ''), 
            display_name
        ),
        full_name = COALESCE(
            NULLIF((profile_data->>'full_name')::TEXT, ''), 
            NULLIF((profile_data->>'display_name')::TEXT, ''),
            display_name,
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
-- 8. TESZT LEKÉRDEZÉSEK
-- ==========================================

-- Teszteljük a policy-kat egy meglévő felhasználóval
-- (Ezt csak akkor futtasd, ha van aktív felhasználó)
/*
-- SELECT teszt
SELECT * FROM public.profiles WHERE id = auth.uid();

-- UPDATE teszt
UPDATE public.profiles 
SET updated_at = NOW() 
WHERE id = auth.uid();
*/

-- ==========================================
-- 9. ELLENŐRZŐ LEKÉRDEZÉSEK
-- ==========================================

-- Új policy-k ellenőrzése
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Olvasás'
        WHEN cmd = 'INSERT' THEN '➕ Beszúrás'
        WHEN cmd = 'UPDATE' THEN '✏️ Frissítés'
        WHEN cmd = 'DELETE' THEN '🗑️ Törlés'
        ELSE '❓ Egyéb'
    END as operation_type,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd;

-- Jogosultságok ellenőrzése
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, privilege_type;

-- SUCCESS üzenet
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policy-k és jogosultságok sikeresen frissítve!';
    RAISE NOTICE '🔧 Ha továbbra is 403 hibát kapsz, használd az update_user_profile() function-t';
    RAISE NOTICE '📝 Tesztelés: próbáld ki újra a Profile oldal mentését';
END $$;
