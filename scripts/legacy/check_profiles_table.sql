-- PROFILES TÁBLA ELLENŐRZÉSE
-- Ez a script ellenőrzi, hogy a profiles tábla megfelelően lett-e létrehozva

-- ==========================================
-- 1. TÁBLA LÉTEZÉSÉNEK ELLENŐRZÉSE
-- ==========================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'profiles'
        ) 
        THEN '✅ PROFILES TÁBLA LÉTEZIK'
        ELSE '❌ PROFILES TÁBLA NEM LÉTEZIK - FUTTASD LE A create_profiles_table.sql SCRIPTET!'
    END as table_status;

-- ==========================================
-- 2. OSZLOPOK ELLENŐRZÉSE
-- ==========================================

-- ProfileFormData mezők ellenőrzése
SELECT 
    'display_name' as expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
        ) 
        THEN '✅ LÉTEZIK' 
        ELSE '❌ HIÁNYZIK' 
    END as status
UNION ALL
SELECT 
    'full_name' as expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
        ) 
        THEN '✅ LÉTEZIK' 
        ELSE '❌ HIÁNYZIK' 
    END as status
UNION ALL
SELECT 
    'height' as expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'height'
        ) 
        THEN '✅ LÉTEZIK' 
        ELSE '❌ HIÁNYZIK' 
    END as status
UNION ALL
SELECT 
    'weight' as expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'weight'
        ) 
        THEN '✅ LÉTEZIK' 
        ELSE '❌ HIÁNYZIK' 
    END as status
UNION ALL
SELECT 
    'birthdate' as expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'birthdate'
        ) 
        THEN '✅ LÉTEZIK' 
        ELSE '❌ HIÁNYZIK' 
    END as status
UNION ALL
SELECT 
    'gender' as expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender'
        ) 
        THEN '✅ LÉTEZIK' 
        ELSE '❌ HIÁNYZIK' 
    END as status
UNION ALL
SELECT 
    'fitness_goals' as expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'fitness_goals'
        ) 
        THEN '✅ LÉTEZIK' 
        ELSE '❌ HIÁNYZIK' 
    END as status
UNION ALL
SELECT 
    'experience_level' as expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'experience_level'
        ) 
        THEN '✅ LÉTEZIK' 
        ELSE '❌ HIÁNYZIK' 
    END as status;

-- ==========================================
-- 3. TELJES TÁBLA STRUKTÚRA
-- ==========================================

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    CASE 
        WHEN column_name IN ('display_name', 'full_name', 'height', 'weight', 'birthdate', 'gender', 'fitness_goals', 'experience_level') 
        THEN '✅ ProfileFormData mező'
        WHEN column_name IN ('id', 'created_at', 'updated_at')
        THEN '⚙️  Rendszer mező'
        ELSE '❓ Egyéb mező'
    END as field_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ==========================================
-- 4. RLS POLICY-K ELLENŐRZÉSE
-- ==========================================

SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%view%' THEN '👁️  Olvasás'
        WHEN policyname LIKE '%update%' THEN '✏️  Módosítás'
        WHEN policyname LIKE '%insert%' THEN '➕ Beszúrás'
        ELSE '🔧 Egyéb'
    END as policy_type,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ==========================================
-- 5. INDEXEK ELLENŐRZÉSE
-- ==========================================

SELECT 
    indexname,
    CASE 
        WHEN indexname LIKE '%experience_level%' THEN '⚡ Experience Level index'
        WHEN indexname LIKE '%gender%' THEN '⚡ Gender index'
        WHEN indexname LIKE '%updated_at%' THEN '⚡ Updated At index'
        WHEN indexname LIKE '%pkey%' THEN '🔑 Primary Key'
        ELSE '📊 Egyéb index'
    END as index_type
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ==========================================
-- 6. TRIGGER ELLENŐRZÉSE
-- ==========================================

SELECT 
    trigger_name,
    event_manipulation as trigger_event,
    action_timing,
    CASE 
        WHEN trigger_name LIKE '%sync_names%' THEN '🔄 Name szinkronizálás'
        ELSE '⚙️  Egyéb trigger'
    END as trigger_purpose
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table = 'profiles';

-- ==========================================
-- 7. FÜGGVÉNYEK ELLENŐRZÉSE
-- ==========================================

SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name LIKE '%sync_display_name%' THEN '🔄 Name szinkronizálás függvény'
        WHEN routine_name LIKE '%create_user_profile%' THEN '👤 Profil létrehozás függvény'
        ELSE '⚙️  Egyéb függvény'
    END as function_purpose
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('sync_display_name_to_full_name', 'create_user_profile');

-- ==========================================
-- 8. ÖSSZESÍTŐ ELLENŐRZÉS
-- ==========================================

SELECT 
    '🎯 PROFILES TÁBLA KÉSZÜLTSÉG' as status_category,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'profiles'
              AND column_name IN ('display_name', 'full_name', 'height', 'weight', 'birthdate', 'gender', 'fitness_goals', 'experience_level')
        ) = 8 
        THEN '✅ MINDEN PROFILEFORMDATA MEZŐ LÉTEZIK'
        ELSE '❌ HIÁNYOZNAK PROFILEFORMDATA MEZŐK'
    END as result
UNION ALL
SELECT 
    '🔐 RLS BIZTONSÁGI SZABÁLYOK' as status_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') >= 3
        THEN '✅ RLS POLICY-K AKTÍVAK'
        ELSE '❌ HIÁNYOZNAK RLS POLICY-K'
    END as result
UNION ALL
SELECT 
    '🔄 NAME SZINKRONIZÁLÁS TRIGGER' as status_category,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE event_object_schema = 'public' 
              AND event_object_table = 'profiles'
              AND trigger_name = 'sync_names_trigger'
        )
        THEN '✅ TRIGGER AKTÍV'
        ELSE '❌ TRIGGER HIÁNYZIK'
    END as result;
