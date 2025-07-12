-- 🔧 LÉPÉS 2: ADMIN FUNKCIÓK - CLEAN VERSION
-- Másolj be ezt a kódot MÁSODIKKÉNT a Supabase Dashboard > SQL Editor-be
-- (Csak AZUTÁN, hogy az step1-ultra-minimal.sql lefutott!)

-- ==========================================
-- MEGLÉVŐ FUNKCIÓK TÖRLÉSE
-- ==========================================

-- Töröljük a meglévő admin funkciókat minden lehetséges signature-rel
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT, user_role);
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT, TEXT, user_role);
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS delete_admin_user(UUID);
DROP FUNCTION IF EXISTS restore_admin_user(UUID, user_role);
DROP FUNCTION IF EXISTS restore_admin_user(UUID);

-- ==========================================
-- ADMIN FUNKCIÓK LÉTREHOZÁSA
-- ==========================================

-- CREATE ADMIN USER funkció
CREATE FUNCTION create_admin_user(
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
    
    -- Beszúrjuk a profilt
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
    
    RETURN NEXT new_profile;
END $$;

-- DELETE ADMIN USER funkció (soft delete)
CREATE FUNCTION delete_admin_user(user_id UUID)
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
END $$;

-- RESTORE ADMIN USER funkció
CREATE FUNCTION restore_admin_user(
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
END $$;

-- ==========================================
-- JOGOSULTSÁGOK BEÁLLÍTÁSA
-- ==========================================

-- RPC funkciók publikus elérhetősége
GRANT EXECUTE ON FUNCTION create_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION delete_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION restore_admin_user TO authenticated;

-- ==========================================
-- BEFEJEZÉS
-- ==========================================

SELECT 
    '✅ ADMIN FUNKCIÓK LÉTREHOZVA!' as status,
    'Functions created successfully' as result,
    'Now restart your frontend application!' as next_step;

-- Funkciók listája
SELECT 
    routine_name as function_name,
    'SUCCESS' as status
FROM information_schema.routines 
WHERE routine_name IN ('create_admin_user', 'delete_admin_user', 'restore_admin_user')
AND routine_schema = 'public'
ORDER BY routine_name;
