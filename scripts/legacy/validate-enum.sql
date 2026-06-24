-- 🔍 ENUM VALIDÁCIÓ - FUTTASD LE A KÉT LÉPÉS KÖZÖTT
-- Ez ellenőrzi, hogy a disabled érték használható-e már

-- Ellenőrizzük az enum értékeket (ez biztonságos)
SELECT 'Available enum values:' as info, unnest(enum_range(NULL::user_role)) AS enum_values;

-- Teszteljük a disabled casting-ot
DO $$
DECLARE
    test_role user_role;
BEGIN
    -- Próbáljuk meg cast-olni a disabled értéket
    test_role := 'disabled'::user_role;
    RAISE NOTICE '✅ SUCCESS: disabled role is now usable!';
    RAISE NOTICE 'You can now run step2-admin-functions.sql';
EXCEPTION
    WHEN invalid_text_representation THEN
        RAISE NOTICE '❌ ERROR: disabled role not found in enum!';
        RAISE NOTICE 'Please run step1-ultra-minimal.sql first!';
    WHEN others THEN
        RAISE NOTICE '⚠️ WARNING: disabled role not committed yet!';
        RAISE NOTICE 'Wait 10-30 more seconds and try again!';
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;
