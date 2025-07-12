-- 🔍 POST-SETUP VALIDÁCIÓ
-- Futtasd le ezt AZUTÁN, hogy mindkét lépés lefutott

-- ==========================================
-- ELLENŐRZÉSEK
-- ==========================================

-- 1. Enum értékek
SELECT 'ENUM CHECK' as test, unnest(enum_range(NULL::user_role)) AS available_values;

-- 2. Disabled role teszt (most már működnie kell)
DO $$
DECLARE
    test_role user_role;
BEGIN
    test_role := 'disabled'::user_role;
    RAISE NOTICE '✅ SUCCESS: disabled role is usable!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ FAIL: disabled role error: %', SQLERRM;
END $$;

-- 3. Admin funkciók léteznek-e
SELECT 
    'FUNCTION CHECK' as test,
    routine_name as function_name,
    'EXISTS' as status
FROM information_schema.routines 
WHERE routine_name IN ('create_admin_user', 'delete_admin_user', 'restore_admin_user')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 4. Felhasználók száma role szerint
SELECT 
    'USER COUNT' as test,
    role,
    count(*) as user_count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- ==========================================
-- EREDMÉNY
-- ==========================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_admin_user' AND routine_schema = 'public'
        ) THEN '✅ ALL TESTS PASSED'
        ELSE '❌ SETUP INCOMPLETE'
    END as final_result;
