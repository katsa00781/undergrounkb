-- 🔧 ULTRA MINIMÁLIS ENUM JAVÍTÁS
-- Másolj be ezt a kódot ELŐSZÖR a Supabase Dashboard > SQL Editor-be
-- Ez csak hozzáadja a disabled értéket, semmi mást!

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
        RAISE NOTICE 'SUCCESS: disabled value added to user_role enum';
    ELSE
        RAISE NOTICE 'INFO: disabled value already exists in user_role enum';
    END IF;
END $$;

-- Kész! Most várj 10-15 másodpercet és futtasd a step2-admin-functions.sql-t
