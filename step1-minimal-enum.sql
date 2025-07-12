-- 🔧 MINIMÁLIS ENUM JAVÍTÁS - CSAK A DISABLED ROLE HOZZÁADÁSA
-- Másolj be ezt a kódot ELŐSZÖR a Supabase Dashboard > SQL Editor-be

-- ==========================================
-- ENUM JAVÍTÁS - CSAK A DISABLED ÉRTÉK
-- ==========================================

-- Ellenőrizzük az enum jelenlegi értékeit
SELECT 'ENUM VALUES BEFORE' as check_step, unnest(enum_range(NULL::user_role)) AS current_values;

-- Hozzáadjuk a 'disabled' értéket az enum-hoz
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
        RAISE NOTICE 'DISABLED value added to user_role enum';
    ELSE
        RAISE NOTICE 'DISABLED value already exists in user_role enum';
    END IF;
END $$;

-- Ellenőrizzük az enum frissített értékeit
SELECT 'ENUM VALUES AFTER' as check_step, unnest(enum_range(NULL::user_role)) AS updated_values;

-- ==========================================
-- CSAK ENUM HOZZÁADÁS - KÉSZ!
-- ==========================================

SELECT 
    'STEP 1 COMPLETE' as status,
    'ENUM VALUE ADDED' as result,
    'Wait 10 seconds then run step2-admin-functions.sql' as next_action;
