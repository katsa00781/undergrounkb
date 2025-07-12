-- 🔧 LÉPÉS 2: ADMIN FUNKCIÓK LÉTREHOZÁSA
-- Másolj be ezt a kódot MÁSODIKKÉNT a Supabase Dashboard > SQL Editor-be
-- (Csak AZUTÁN, hogy az step1-enum-fix-only.sql lefutott és committed!)

-- ==========================================
-- ELŐZETES ELLENŐRZÉS - BIZTONSÁGOS
-- ==========================================

-- Ellenőrizzük az enum értékeket (ez biztonságos)
SELECT 'Available enum values' as info, unnest(enum_range(NULL::user_role)) AS enum_values;

-- ==========================================
-- MEGLÉVŐ FUNKCIÓK TÖRLÉSE
-- ==========================================

-- Töröljük a meglévő admin funkciókat (ha léteznek)
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT, user_role);
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT, TEXT, user_role);
DROP FUNCTION IF EXISTS delete_admin_user(UUID);
DROP FUNCTION IF EXISTS restore_admin_user(UUID, user_role);
DROP FUNCTION IF EXISTS restore_admin_user(UUID);

-- ==========================================
-- ADMIN FUNKCIÓK LÉTREHOZÁSA
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
    
    -- Ellenőrizzük, hogy az email még nem létezik
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE email = create_admin_user.email
    ) THEN
        RAISE EXCEPTION 'User with email % already exists', create_admin_user.email;
    END IF;
    
    -- Generálunk egy új UUID-t a felhasználóhoz
    new_user_id := gen_random_uuid();
    
    -- Beszúrjuk a profilt (auth.users-t nem módosítjuk)
    INSERT INTO public.profiles (
        id, 
        email, 
        display_name, 
        full_name, 
        role,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        create_admin_user.email,
        COALESCE(create_admin_user.display_name, split_part(create_admin_user.email, '@', 1)),
        COALESCE(create_admin_user.full_name, create_admin_user.display_name, split_part(create_admin_user.email, '@', 1)),
        create_admin_user.role,
        NOW(),
        NOW()
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
        updated_at = NOW()
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
        updated_at = NOW()
    WHERE id = user_id AND role = 'disabled'
    RETURNING *;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Disabled user not found with ID: %', user_id;
    END IF;
    
    RAISE NOTICE 'User restored with ID: % to role: %', user_id, new_role;
END $$;

-- ==========================================
-- JOGOSULTSÁGOK BEÁLLÍTÁSA
-- ==========================================

-- RPC funkciók publikus elérhetősége
GRANT EXECUTE ON FUNCTION create_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION delete_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION restore_admin_user TO authenticated;

-- ==========================================
-- VALIDÁCIÓS LEKÉRDEZÉSEK - BIZTONSÁGOS
-- ==========================================

-- Ellenőrizzük az enum értékeket (biztonságos)
SELECT 'Final enum check' as step, unnest(enum_range(NULL::user_role)) AS available_roles;

-- Ellenőrizzük a funkciókat
SELECT 
    'Functions check' as check_type,
    routine_name as function_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('create_admin_user', 'delete_admin_user', 'restore_admin_user')
AND routine_schema = 'public'
ORDER BY routine_name;

-- ==========================================
-- BEFEJEZÉS
-- ==========================================

SELECT 
    '✅ ADMIN FUNKCIÓK LÉTREHOZVA!' as status,
    'Most indítsd újra a frontend alkalmazást!' as next_step;

-- DEBUG INFO - jelenlegi felhasználók role szerint
SELECT 
    'Current users by role' as info,
    role,
    count(*) as user_count
FROM public.profiles 
GROUP BY role
ORDER BY role;
