-- ProfileFormData konverziója SQL műveletekre
-- Ez a fájl tartalmazza az SQL kódot, amely a ProfileFormData TypeScript típus alapján
-- végrehajtja az adatbázis műveleteket a profiles táblában

-- ==========================================
-- 0. PROFILES TÁBLA LÉTREHOZÁSA/FRISSÍTÉSE
-- ==========================================

-- Tábla létrehozása, ha nem létezik
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oszlopok hozzáadása, ha nem léteznek
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS height INTEGER;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthdate DATE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', ''));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fitness_goals JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', ''));

-- Indexek létrehozása a gyakran keresett mezőkhöz
CREATE INDEX IF NOT EXISTS idx_profiles_experience_level ON public.profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- RLS (Row Level Security) engedélyezése
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy-k létrehozása
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

-- Megjegyzések hozzáadása az oszlopokhoz
COMMENT ON TABLE public.profiles IS 'Felhasználói profilok táblája - ProfileFormData alapján';
COMMENT ON COLUMN public.profiles.id IS 'UUID referencia az auth.users táblából';
COMMENT ON COLUMN public.profiles.display_name IS 'Megjelenítendő név (ProfileFormData.displayName)';
COMMENT ON COLUMN public.profiles.full_name IS 'Teljes név (szinkronizálva display_name-mel)';
COMMENT ON COLUMN public.profiles.height IS 'Magasság centiméterben';
COMMENT ON COLUMN public.profiles.weight IS 'Súly kilogrammban (decimal formátum)';
COMMENT ON COLUMN public.profiles.birthdate IS 'Születési dátum';
COMMENT ON COLUMN public.profiles.gender IS 'Nem: male, female, other vagy üres string';
COMMENT ON COLUMN public.profiles.fitness_goals IS 'Fitness célok JSON array formátumban';
COMMENT ON COLUMN public.profiles.experience_level IS 'Tapasztalati szint: beginner, intermediate, advanced';

-- ==========================================
-- 1. UPSERT művelet ProfileFormData alapján
-- ==========================================

-- Példa ProfileFormData objektum:
-- {
--   displayName: "John Doe",
--   height: 180,
--   weight: 75.5,
--   birthdate: "1990-05-15",
--   gender: "male",
--   fitnessGoals: ["Weight Loss", "Strength"],
--   experienceLevel: "intermediate"
-- }

-- SQL UPSERT parancs (INSERT ON CONFLICT)
INSERT INTO public.profiles (
    id,
    display_name,
    full_name, -- sync with display_name
    height,
    weight,
    birthdate,
    gender,
    fitness_goals,
    experience_level,
    updated_at
) VALUES (
    $1, -- user_id (auth.users.id)
    $2, -- displayName
    $2, -- full_name = displayName (szinkronizálás)
    $3, -- height (integer vagy NULL)
    $4, -- weight (decimal vagy NULL)
    $5::DATE, -- birthdate (string to DATE)
    $6, -- gender (enum string)
    $7::JSONB, -- fitnessGoals (array to JSONB)
    $8, -- experienceLevel (enum string)
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.display_name, -- sync with display_name
    height = EXCLUDED.height,
    weight = EXCLUDED.weight,
    birthdate = EXCLUDED.birthdate,
    gender = EXCLUDED.gender,
    fitness_goals = EXCLUDED.fitness_goals,
    experience_level = EXCLUDED.experience_level,
    updated_at = NOW();

-- ==========================================
-- 2. SELECT lekérdezés ProfileFormData formátumban
-- ==========================================

SELECT 
    id,
    COALESCE(display_name, full_name, '') as "displayName",
    height,
    weight,
    TO_CHAR(birthdate, 'YYYY-MM-DD') as birthdate, -- DATE to string
    COALESCE(gender, '') as gender,
    COALESCE(fitness_goals, '[]'::jsonb) as "fitnessGoals", -- JSONB to array
    COALESCE(experience_level, '') as "experienceLevel"
FROM public.profiles 
WHERE id = $1; -- user_id

-- ==========================================
-- 3. UPDATE művelet részleges ProfileFormData alapján
-- ==========================================

-- Csak a megadott mezők frissítése (NULL értékek nem változtatják meg a mezőt)
UPDATE public.profiles SET
    display_name = CASE WHEN $2 IS NOT NULL THEN $2 ELSE display_name END,
    full_name = CASE WHEN $2 IS NOT NULL THEN $2 ELSE full_name END, -- sync
    height = CASE WHEN $3 IS NOT NULL THEN $3 ELSE height END,
    weight = CASE WHEN $4 IS NOT NULL THEN $4 ELSE weight END,
    birthdate = CASE WHEN $5 IS NOT NULL THEN $5::DATE ELSE birthdate END,
    gender = CASE WHEN $6 IS NOT NULL THEN $6 ELSE gender END,
    fitness_goals = CASE WHEN $7 IS NOT NULL THEN $7::JSONB ELSE fitness_goals END,
    experience_level = CASE WHEN $8 IS NOT NULL THEN $8 ELSE experience_level END,
    updated_at = NOW()
WHERE id = $1; -- user_id

-- ==========================================
-- 4. INSERT új profil létrehozásához
-- ==========================================

INSERT INTO public.profiles (
    id,
    display_name,
    full_name,
    height,
    weight,
    birthdate,
    gender,
    fitness_goals,
    experience_level,
    created_at,
    updated_at
) VALUES (
    $1, -- user_id (auth.users.id-ből)
    $2, -- displayName
    $2, -- full_name = displayName
    $3, -- height
    $4, -- weight
    $5::DATE, -- birthdate
    $6, -- gender
    $7::JSONB, -- fitnessGoals
    $8, -- experienceLevel
    NOW(),
    NOW()
);

-- ==========================================
-- 5. Fitness Goals specifikus műveletek
-- ==========================================

-- Fitness goal hozzáadása (ha még nincs benne)
UPDATE public.profiles 
SET fitness_goals = fitness_goals || $2::jsonb,
    updated_at = NOW()
WHERE id = $1 
  AND NOT (fitness_goals ? $3); -- csak ha még nincs benne

-- Fitness goal eltávolítása
UPDATE public.profiles 
SET fitness_goals = fitness_goals - $2,
    updated_at = NOW()
WHERE id = $1;

-- Összes fitness goal lecserélése
UPDATE public.profiles 
SET fitness_goals = $2::jsonb,
    updated_at = NOW()
WHERE id = $1;

-- ==========================================
-- 6. Validációs lekérdezések
-- ==========================================

-- Ellenőrizni, hogy létezik-e a profil
SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = $1
) as profile_exists;

-- Profil adatok validálása
SELECT 
    id,
    display_name IS NOT NULL as has_display_name,
    height BETWEEN 100 AND 250 as valid_height,
    weight BETWEEN 30 AND 300 as valid_weight,
    birthdate IS NOT NULL AND birthdate <= CURRENT_DATE as valid_birthdate,
    gender IN ('male', 'female', 'other', '') as valid_gender,
    jsonb_array_length(COALESCE(fitness_goals, '[]'::jsonb)) >= 0 as valid_fitness_goals,
    experience_level IN ('beginner', 'intermediate', 'advanced', '') as valid_experience_level
FROM public.profiles 
WHERE id = $1;

-- ==========================================
-- 7. TypeScript paraméter mapping
-- ==========================================

/*
TypeScript form submit function példa:

const onSubmit = async (data: ProfileFormData) => {
    const params = [
        userId,                                    // $1
        data.displayName || null,                  // $2
        data.height || null,                       // $3
        data.weight || null,                       // $4
        data.birthdate || null,                    // $5
        data.gender || null,                       // $6
        JSON.stringify(data.fitnessGoals || []),   // $7
        data.experienceLevel || null              // $8
    ];
    
    // Execute UPSERT query with params
};
*/

-- ==========================================
-- 9. TRIGGER LÉTREHOZÁSA INSERT-re is
-- ==========================================

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

-- Trigger létrehozása INSERT és UPDATE műveletekre
DROP TRIGGER IF EXISTS sync_names_trigger ON public.profiles;
CREATE TRIGGER sync_names_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_display_name_to_full_name();

-- ==========================================
-- 10. ELLENŐRZŐ LEKÉRDEZÉSEK
-- ==========================================

-- Tábla struktúra ellenőrzése
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
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
-- 11. TESZT PROFIL LÉTREHOZÁSI FUNCTION
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

-- Function komment
COMMENT ON FUNCTION create_user_profile(UUID) IS 'Automatikusan létrehoz egy alapértelmezett profilt új felhasználónak';

-- ==========================================
-- 12. MINTA HASZNÁLAT (MEGJEGYZÉSKÉNT)
-- ==========================================

/*
-- Új felhasználó profiljának létrehozása:
SELECT create_user_profile('550e8400-e29b-41d4-a716-446655440000');

-- Profil adatok frissítése ProfileFormData alapján:
INSERT INTO public.profiles (
    id, display_name, height, weight, birthdate, gender, 
    fitness_goals, experience_level, updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'John Doe', 180, 75.5, '1990-05-15'::DATE, 'male',
    '["Weight Loss", "Strength"]'::jsonb, 'intermediate', NOW()
) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.display_name,
    height = EXCLUDED.height,
    weight = EXCLUDED.weight,
    birthdate = EXCLUDED.birthdate,
    gender = EXCLUDED.gender,
    fitness_goals = EXCLUDED.fitness_goals,
    experience_level = EXCLUDED.experience_level,
    updated_at = NOW();
*/
