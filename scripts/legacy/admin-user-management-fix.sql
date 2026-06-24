-- 🔧 ADMIN USER CREATION FIX - SUPABASE SQL EDITOR-BEN FUTTATHATÓ
-- Másolj be ezt a kódot a Supabase Dashboard > SQL Editor-be

-- ==========================================
-- ADMIN FELHASZNÁLÓ LÉTREHOZÁSI FUNKCIÓ
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

-- Function komment
COMMENT ON FUNCTION create_admin_user(TEXT, TEXT, user_role) IS 'Admin function to create users in profiles table';

-- ==========================================
-- FELHASZNÁLÓ TÖRLÉSI FUNKCIÓ (SOFT DELETE)
-- ==========================================

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

-- Function komment
COMMENT ON FUNCTION delete_admin_user(UUID) IS 'Admin function to soft delete users (set role to disabled)';

-- ==========================================
-- FELHASZNÁLÓ VISSZAÁLLÍTÁSI FUNKCIÓ
-- ==========================================

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

-- Function komment
COMMENT ON FUNCTION restore_admin_user(UUID, user_role) IS 'Admin function to restore disabled users';

-- ==========================================
-- ELLENŐRZŐ LEKÉRDEZÉSEK
-- ==========================================

-- Ellenőrizzük, hogy a functionök létrejöttek
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    'Function successfully created' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('create_admin_user', 'delete_admin_user', 'restore_admin_user')
ORDER BY p.proname;

-- ==========================================
-- TESZT LEKÉRDEZÉS (KOMMENTELD KI HA HASZNÁLNI AKAROD)
-- ==========================================

/*
-- Példa használat (csak admin felhasználóként futtatható):

-- Új felhasználó létrehozása
SELECT create_admin_user(
    'uj.felhasznalo@example.com',
    'Új Felhasználó',
    'user'
);

-- Felhasználó soft delete
SELECT delete_admin_user('USER_ID_ITT');

-- Felhasználó visszaállítása
SELECT restore_admin_user('USER_ID_ITT', 'user');
*/
