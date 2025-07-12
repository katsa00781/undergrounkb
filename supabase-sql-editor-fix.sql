-- 🔧 FULL_NAME JAVÍTÁS - SUPABASE SQL EDITOR-BEN FUTTATHATÓ
-- Másolj be ezt a kódot a Supabase Dashboard > SQL Editor-be

-- ==========================================
-- CSAK A FUNCTION JAVÍTÁS (EGYSZERŰSÍTETT)
-- ==========================================

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
        RAISE EXCEPTION 'Unauthorized: Cannot update another user profile';
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
COMMENT ON FUNCTION update_user_profile(UUID, JSONB) IS 'Frissített function full_name javításokkal';

-- ==========================================
-- ADMIN FELHASZNÁLÓ KEZELÉSI FUNKCIÓK
-- ==========================================

-- Funkció admin felhasználók létrehozásához profiles táblában
CREATE OR REPLACE FUNCTION create_admin_user(
    user_email TEXT,
    user_full_name TEXT,
    user_role user_role DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
    existing_user_id UUID;
BEGIN
    -- Ellenőrizzük, hogy a jelenlegi felhasználó admin-e
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can create users';
    END IF;
    
    -- Ellenőrizzük, hogy már létezik-e felhasználó ezzel az email címmel
    SELECT id INTO existing_user_id
    FROM public.profiles
    WHERE email = user_email;
    
    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'User with email % already exists', user_email;
    END IF;
    
    -- Generálunk egy új UUID-t
    new_user_id := gen_random_uuid();
    
    -- Létrehozzuk a felhasználót a profiles táblában
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        display_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        user_email,
        user_full_name,
        user_full_name, -- display_name ugyanaz mint full_name
        user_role,
        NOW(),
        NOW()
    );
    
    -- Visszaadjuk az új felhasználó ID-jét
    RETURN new_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END $$;

-- Felhasználó törlési funkció (soft delete)
CREATE OR REPLACE FUNCTION delete_admin_user(
    target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ellenőrizzük, hogy a jelenlegi felhasználó admin-e
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    END IF;
    
    -- Ellenőrizzük, hogy a célzott felhasználó létezik-e
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = target_user_id
    ) THEN
        RAISE EXCEPTION 'User with ID % does not exist', target_user_id;
    END IF;
    
    -- Ellenőrizzük, hogy nem próbálja magát törölni
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;
    
    -- Soft delete: role beállítása 'disabled'-re
    UPDATE public.profiles
    SET 
        role = 'disabled',
        updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
END $$;

-- Felhasználó visszaállítási funkció
CREATE OR REPLACE FUNCTION restore_admin_user(
    target_user_id UUID,
    new_role user_role DEFAULT 'user'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ellenőrizzük, hogy a jelenlegi felhasználó admin-e
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can restore users';
    END IF;
    
    -- Ellenőrizzük, hogy a célzott felhasználó létezik-e és disabled-e
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = target_user_id AND role = 'disabled'
    ) THEN
        RAISE EXCEPTION 'User with ID % does not exist or is not disabled', target_user_id;
    END IF;
    
    -- Visszaállítjuk a felhasználót
    UPDATE public.profiles
    SET 
        role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error restoring user: %', SQLERRM;
END $$;

-- Function kommentek
COMMENT ON FUNCTION update_user_profile(UUID, JSONB) IS 'Frissített function full_name javításokkal';
COMMENT ON FUNCTION create_admin_user(TEXT, TEXT, user_role) IS 'Admin function to create users in profiles table';
COMMENT ON FUNCTION delete_admin_user(UUID) IS 'Admin function to soft delete users (set role to disabled)';
COMMENT ON FUNCTION restore_admin_user(UUID, user_role) IS 'Admin function to restore disabled users';

-- ==========================================
-- ELLENŐRZŐ LEKÉRDEZÉSEK ÉS VALIDÁCIÓ
-- ==========================================

-- 1. Ellenőrizzük az enum értékeket
SELECT 
    'user_role enum check' as check_type,
    unnest(enum_range(NULL::user_role)) AS available_roles;

-- 2. Ellenőrizzük, hogy a functionök létrejöttek
SELECT 
    'function check' as check_type,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    'Function successfully created' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('update_user_profile', 'create_admin_user', 'delete_admin_user', 'restore_admin_user')
ORDER BY p.proname;

-- 3. Ellenőrizzük a profiles tábla szerkezetét
SELECT 
    'profiles table check' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Minta adatok a profiles táblából (első 3 rekord)
SELECT 
    'sample data' as check_type,
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- ==========================================
-- USER_ROLE ENUM JAVÍTÁS - DISABLED ROLE HOZZÁADÁSA
-- ==========================================

-- Ellenőrizzük az enum jelenlegi értékeit
SELECT unnest(enum_range(NULL::user_role)) AS current_role_values;

-- Hozzáadjuk a 'disabled' értéket az enum-hoz (ha még nincs benne)
DO $$
BEGIN
    -- Ellenőrizzük, hogy a 'disabled' érték már létezik-e
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'disabled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        -- Hozzáadjuk a 'disabled' értéket
        ALTER TYPE user_role ADD VALUE 'disabled';
        RAISE NOTICE 'Added ''disabled'' to user_role enum';
    ELSE
        RAISE NOTICE '''disabled'' already exists in user_role enum';
    END IF;
END $$;

-- Ellenőrizzük az enum frissített értékeit
SELECT unnest(enum_range(NULL::user_role)) AS updated_role_values;

-- Dokumentáljuk a változtatást
COMMENT ON TYPE user_role IS 'User roles: admin, user, disabled (soft deleted)';

-- ==========================================
-- PROFILE UPDATE FUNCTION
-- ==========================================
