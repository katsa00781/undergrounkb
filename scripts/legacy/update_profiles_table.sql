-- Profiles tábla frissítése a ProfileFormData alapján
-- Ez az SQL kód hozzáadja a hiányzó oszlopokat a profiles táblához

-- 1. Magasság (height) oszlop hozzáadása
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS height INTEGER;

-- 2. Súly (weight) oszlop hozzáadása (decimal a pontosabb értékekhez)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);

-- 3. Születési dátum (birthdate) oszlop hozzáadása
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthdate DATE;

-- 4. Nem (gender) oszlop hozzáadása
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', ''));

-- 5. Fitness célok (fitness_goals) oszlop hozzáadása - JSON array formátumban
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fitness_goals JSONB DEFAULT '[]'::jsonb;

-- 6. Tapasztalati szint (experience_level) oszlop hozzáadása
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', ''));

-- 7. Display name oszlop hozzáadása (ha a full_name helyett/mellett ezt használjuk)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Megjegyzések hozzáadása az oszlopokhoz a jobb dokumentációért
COMMENT ON COLUMN public.profiles.height IS 'Magasság centiméterben';
COMMENT ON COLUMN public.profiles.weight IS 'Súly kilogrammban (decimal formátum)';
COMMENT ON COLUMN public.profiles.birthdate IS 'Születési dátum';
COMMENT ON COLUMN public.profiles.gender IS 'Nem: male, female, other vagy üres string';
COMMENT ON COLUMN public.profiles.fitness_goals IS 'Fitness célok JSON array formátumban';
COMMENT ON COLUMN public.profiles.experience_level IS 'Tapasztalati szint: beginner, intermediate, advanced';
COMMENT ON COLUMN public.profiles.display_name IS 'Megjelenítendő név (teljes név)';

-- Index létrehozása a gyakran keresett mezőkhöz
CREATE INDEX IF NOT EXISTS idx_profiles_experience_level ON public.profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);

-- RLS (Row Level Security) policy frissítése, ha szükséges
-- (feltételezve, hogy már van alapvető RLS a profiles táblán)

-- Ellenőrző lekérdezés a tábla struktúrájához
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND table_schema = 'public'
-- ORDER BY ordinal_position;
