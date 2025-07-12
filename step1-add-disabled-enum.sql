-- 🔧 LÉPÉS 1: ENUM JAVÍTÁS - DISABLED ROLE HOZZÁADÁSA
-- Másolj be ezt a kódot ELŐSZÖR a Supabase Dashboard > SQL Editor-be

-- ==========================================
-- USER_ROLE ENUM JAVÍTÁS - DISABLED ROLE HOZZÁADÁSA
-- ==========================================

-- Ellenőrizzük az enum jelenlegi értékeit
SELECT 'BEFORE enum update' as step, unnest(enum_range(NULL::user_role)) AS current_role_values;

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
SELECT 'AFTER enum update' as step, unnest(enum_range(NULL::user_role)) AS updated_role_values;

-- Dokumentáljuk a változtatást
COMMENT ON TYPE user_role IS 'User roles: admin, user, disabled (soft deleted)';

-- ==========================================
-- VALIDÁCIÓ
-- ==========================================

-- Teszteljük, hogy tudunk-e disabled role-lal dolgozni
DO $$
BEGIN
    -- Próbáljunk meg egy tesztet csinálni disabled role-lal
    PERFORM 'disabled'::user_role;
    RAISE NOTICE 'SUCCESS: disabled role can be cast to user_role enum';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: disabled role cannot be cast: %', SQLERRM;
END $$;

-- ==========================================
-- KÖVETKEZŐ LÉPÉS
-- ==========================================

SELECT 
    '✅ ENUM JAVÍTÁS KÉSZ!' as status,
    'Most futtasd le a supabase-sql-functions-only.sql fájlt!' as next_step;
