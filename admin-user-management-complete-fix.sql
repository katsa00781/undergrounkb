-- 🔧 ADMIN USER MANAGEMENT - TELJES JAVÍTÁS
-- Másolj be ezt a kódot a Supabase Dashboard > SQL Editor-be
-- És futtasd le egy lépésben

-- ==========================================
-- 1. ENUM JAVÍTÁS - DISABLED ROLE HOZZÁADÁSA
-- ==========================================

-- Ellenőrizzük az enum jelenlegi értékeit
SELECT 'STEP 1 - BEFORE enum update' as step, unnest(enum_range(NULL::user_role)) AS current_role_values;

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
        RAISE NOTICE 'SUCCESS: Added ''disabled'' to user_role enum';
    ELSE
        RAISE NOTICE 'INFO: ''disabled'' already exists in user_role enum';
    END IF;
END $$;

-- Ellenőrizzük az enum frissített értékeit
SELECT 'STEP 1 - AFTER enum update' as step, unnest(enum_range(NULL::user_role)) AS updated_role_values;

-- ==========================================
-- 2. ADMIN FUNKCIÓK LÉTREHOZÁSA
-- ==========================================

-- CREATE ADMIN USER funkció
CREATE OR REPLACE FUNCTION create_admin_user(
    email TEXT,
    display_name TEXT DEFAULT NULL,
    full_name TEXT DEFAULT NULL,
    role user_role DEFAULT 'user'
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id UUID;
    new_profile public.profiles;
BEGIN
    -- Ellenőrizzük az admin jogosultságokat
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can create users';
    END IF;
    
    -- Generálunk egy új UUID-t a felhasználóhoz
    new_user_id := gen_random_uuid();
    
    -- Beszúrjuk a profilt (auth.users-t nem módosítjuk)
    INSERT INTO public.profiles (
        id, 
        email, 
        display_name, 
        full_name, 
        role
    ) VALUES (
        new_user_id,
        email,
        COALESCE(display_name, split_part(email, '@', 1)),
        COALESCE(full_name, display_name, split_part(email, '@', 1)),
        role
    ) RETURNING * INTO new_profile;
    
    RAISE NOTICE 'Admin user created with ID: %', new_user_id;
    RETURN NEXT new_profile;
END $$;

-- DELETE ADMIN USER funkció (soft delete)
CREATE OR REPLACE FUNCTION delete_admin_user(user_id UUID)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ellenőrizzük az admin jogosultságokat
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    END IF;
    
    -- Ellenőrizzük, hogy nem saját magát próbálja törölni
    IF auth.uid() = user_id THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;
    
    -- Soft delete: role-t 'disabled'-re állítjuk
    RETURN QUERY
    UPDATE public.profiles
    SET 
        role = 'disabled',
        updated_at = now()
    WHERE id = user_id
    RETURNING *;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found with ID: %', user_id;
    END IF;
    
    RAISE NOTICE 'User disabled with ID: %', user_id;
END $$;

-- RESTORE ADMIN USER funkció
CREATE OR REPLACE FUNCTION restore_admin_user(
    user_id UUID,
    new_role user_role DEFAULT 'user'
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ellenőrizzük az admin jogosultságokat
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can restore users';
    END IF;
    
    -- Visszaállítjuk a felhasználót
    RETURN QUERY
    UPDATE public.profiles
    SET 
        role = new_role,
        updated_at = now()
    WHERE id = user_id AND role = 'disabled'
    RETURNING *;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Disabled user not found with ID: %', user_id;
    END IF;
    
    RAISE NOTICE 'User restored with ID: % to role: %', user_id, new_role;
END $$;

-- ==========================================
-- 3. JOGOSULTSÁGOK BEÁLLÍTÁSA
-- ==========================================

-- RPC funkciók publikus elérhetősége
GRANT EXECUTE ON FUNCTION create_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION delete_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION restore_admin_user TO authenticated;

-- ==========================================
-- 4. VALIDÁCIÓS LEKÉRDEZÉSEK
-- ==========================================

-- Ellenőrizzük az enum értékeket
SELECT 'STEP 2 - Final enum check' as step, unnest(enum_range(NULL::user_role)) AS available_roles;

-- Ellenőrizzük a funkciókat
SELECT 
    routine_name as function_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('create_admin_user', 'delete_admin_user', 'restore_admin_user')
AND routine_schema = 'public';

-- Teszteljük az enum casting-ot
DO $$
BEGIN
    PERFORM 'disabled'::user_role;
    RAISE NOTICE 'SUCCESS: disabled role casting works!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: disabled role casting failed: %', SQLERRM;
END $$;

-- ==========================================
-- 5. BEFEJEZÉS
-- ==========================================

SELECT 
    '✅ ADMIN USER MANAGEMENT JAVÍTÁS KÉSZ!' as status,
    'Most indítsd újra a frontend alkalmazást!' as next_step;

-- DEBUG INFO
SELECT 
    'User count by role' as info,
    role,
    count(*) as user_count
FROM public.profiles 
GROUP BY role;
