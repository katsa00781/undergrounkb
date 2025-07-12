-- PROFILES TÁBLA LÉTREHOZÁSA/FRISSÍTÉSE
-- Ez a script létrehozza vagy frissíti a profiles táblát a ProfileFormData mezőivel
-- Futtasd le ezt a script-et a Supabase SQL editorban

-- ==========================================
-- 1. TÁBLA LÉTREHOZÁSA (ha nem létezik)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. OSZLOPOK HOZZÁADÁSA (ha nem léteznek)
-- ==========================================

-- Display name (ProfileFormData.displayName)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Full name (szinkronizálva display_name-mel)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Height (ProfileFormData.height)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS height INTEGER;

-- Weight (ProfileFormData.weight)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);

-- Birthdate (ProfileFormData.birthdate)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Gender (ProfileFormData.gender)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT 
CHECK (gender IN ('male', 'female', 'other', ''));

-- Fitness Goals (ProfileFormData.fitnessGoals)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fitness_goals JSONB DEFAULT '[]'::jsonb;

-- Experience Level (ProfileFormData.experienceLevel)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience_level TEXT 
CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', ''));

-- ==========================================
-- 3. INDEXEK LÉTREHOZÁSA
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_profiles_experience_level 
ON public.profiles(experience_level);

CREATE INDEX IF NOT EXISTS idx_profiles_gender 
ON public.profiles(gender);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_at 
ON public.profiles(updated_at);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) BEÁLLÍTÁSA
-- ==========================================

-- RLS engedélyezése
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy-k létrehozása (DROP IF EXISTS + CREATE)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ==========================================
-- 5. TRIGGER FÜGGVÉNY ÉS TRIGGER
-- ==========================================

-- Trigger függvény a name mezők szinkronizálásához
CREATE OR REPLACE FUNCTION sync_display_name_to_full_name()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT esetén
    IF TG_OP = 'INSERT' THEN
        -- Ha display_name van megadva, másoljuk full_name-be is
        IF NEW.display_name IS NOT NULL AND NEW.display_name != '' THEN
            NEW.full_name = NEW.display_name;
        -- Ha full_name van megadva és display_name üres, másoljuk display_name-be
        ELSIF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND 
              (NEW.display_name IS NULL OR NEW.display_name = '') THEN
            NEW.display_name = NEW.full_name;
        END IF;
    END IF;
    
    -- UPDATE esetén
    IF TG_OP = 'UPDATE' THEN
        -- Ha display_name változik, frissítjük a full_name-t is
        IF NEW.display_name IS DISTINCT FROM OLD.display_name THEN
            NEW.full_name = NEW.display_name;
        END IF;
        
        -- Ha full_name változik és display_name üres, frissítjük a display_name-t
        IF NEW.full_name IS DISTINCT FROM OLD.full_name AND 
           (NEW.display_name IS NULL OR NEW.display_name = '') THEN
            NEW.display_name = NEW.full_name;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger létrehozása
DROP TRIGGER IF EXISTS sync_names_trigger ON public.profiles;
CREATE TRIGGER sync_names_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_display_name_to_full_name();

-- ==========================================
-- 6. HELPER FUNCTION PROFIL LÉTREHOZÁSÁHOZ
-- ==========================================

CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID)
RETURNS void AS $$
BEGIN
    -- Csak akkor hozzunk létre profilt, ha még nem létezik
    INSERT INTO public.profiles (id, created_at, updated_at)
    VALUES (user_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. MEGJEGYZÉSEK (DOKUMENTÁCIÓ)
-- ==========================================

COMMENT ON TABLE public.profiles IS 'Felhasználói profilok táblája - ProfileFormData alapján';
COMMENT ON COLUMN public.profiles.id IS 'UUID referencia az auth.users táblából';
COMMENT ON COLUMN public.profiles.display_name IS 'Megjelenítendő név (ProfileFormData.displayName)';
COMMENT ON COLUMN public.profiles.full_name IS 'Teljes név (szinkronizálva display_name-mel)';
COMMENT ON COLUMN public.profiles.height IS 'Magasság centiméterben (ProfileFormData.height)';
COMMENT ON COLUMN public.profiles.weight IS 'Súly kilogrammban (ProfileFormData.weight)';
COMMENT ON COLUMN public.profiles.birthdate IS 'Születési dátum (ProfileFormData.birthdate)';
COMMENT ON COLUMN public.profiles.gender IS 'Nem: male, female, other vagy üres string (ProfileFormData.gender)';
COMMENT ON COLUMN public.profiles.fitness_goals IS 'Fitness célok JSON array formátumban (ProfileFormData.fitnessGoals)';
COMMENT ON COLUMN public.profiles.experience_level IS 'Tapasztalati szint: beginner, intermediate, advanced (ProfileFormData.experienceLevel)';
COMMENT ON FUNCTION create_user_profile(UUID) IS 'Automatikusan létrehoz egy alapértelmezett profilt új felhasználónak';

-- ==========================================
-- 8. ELLENŐRZŐ LEKÉRDEZÉSEK
-- ==========================================

-- Tábla struktúra ellenőrzése
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- RLS policy-k ellenőrzése  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Indexek ellenőrzése
SELECT indexname, indexdef
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ==========================================
-- 9. SIKER ÜZENET
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: Profiles tábla sikeresen létrehozva/frissítve!';
    RAISE NOTICE 'A tábla tartalmazza az összes ProfileFormData mezőt:';
    RAISE NOTICE '- display_name (TEXT)';
    RAISE NOTICE '- full_name (TEXT) - szinkronizálva display_name-mel';
    RAISE NOTICE '- height (INTEGER)';
    RAISE NOTICE '- weight (DECIMAL)';
    RAISE NOTICE '- birthdate (DATE)';
    RAISE NOTICE '- gender (TEXT with CHECK)';
    RAISE NOTICE '- fitness_goals (JSONB)';
    RAISE NOTICE '- experience_level (TEXT with CHECK)';
    RAISE NOTICE 'RLS policy-k és trigger-ek aktívak.';
END $$;
