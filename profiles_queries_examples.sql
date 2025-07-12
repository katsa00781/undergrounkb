-- Példa INSERT/UPDATE műveletek a profiles táblához ProfileFormData alapján

-- 1. Új profil beszúrása (pl. regisztráció után)
INSERT INTO public.profiles (
    id,
    email,
    role,
    full_name,
    display_name,
    height,
    weight,
    birthdate,
    gender,
    fitness_goals,
    experience_level,
    avatar_url,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- User UUID az auth.users táblából
    'user@example.com',                      -- Email az auth.users táblából
    'user',                                  -- Alapértelmezett szerep
    'John Doe',                              -- Teljes név
    'John Doe',                              -- Megjelenítendő név (displayName)
    180,                                     -- Magasság cm-ben
    75.5,                                    -- Súly kg-ban
    '1990-01-15',                           -- Születési dátum
    'male',                                  -- Nem
    '["Weight Loss", "Strength"]'::jsonb,    -- Fitness célok JSON array-ben
    'intermediate',                          -- Tapasztalati szint
    NULL,                                    -- Avatar URL (opcionális)
    NOW(),                                   -- Létrehozás időpontja
    NOW()                                    -- Utolsó frissítés időpontja
);

-- 2. Meglévő profil frissítése
UPDATE public.profiles 
SET 
    full_name = 'Jane Smith',
    display_name = 'Jane Smith',
    height = 165,
    weight = 60.0,
    birthdate = '1985-03-22',
    gender = 'female',
    fitness_goals = '["Muscle Gain", "Endurance", "Flexibility"]'::jsonb,
    experience_level = 'advanced',
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 3. Specifikus mezők frissítése (fitness célok hozzáadása)
UPDATE public.profiles 
SET 
    fitness_goals = fitness_goals || '["Flexibility"]'::jsonb,
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 4. Fitness célok eltávolítása
UPDATE public.profiles 
SET 
    fitness_goals = fitness_goals - 'Weight Loss',
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 5. Profil adatok lekérdezése
SELECT 
    id,
    email,
    role,
    full_name,
    display_name,
    height,
    weight,
    birthdate,
    gender,
    fitness_goals,
    experience_level,
    avatar_url,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 6. Fitness célok lekérdezése (JSON műveletek)
SELECT 
    display_name,
    fitness_goals,
    jsonb_array_length(fitness_goals) as goals_count,
    fitness_goals ? 'Weight Loss' as has_weight_loss_goal
FROM public.profiles 
WHERE fitness_goals IS NOT NULL;

-- 7. Statisztikák lekérdezése
SELECT 
    experience_level,
    COUNT(*) as user_count,
    AVG(height) as avg_height,
    AVG(weight) as avg_weight
FROM public.profiles 
WHERE experience_level IS NOT NULL
GROUP BY experience_level;

-- 8. UPSERT művelet (beszúrás vagy frissítés)
INSERT INTO public.profiles (
    id, email, role, display_name, height, weight, 
    birthdate, gender, fitness_goals, experience_level, 
    created_at, updated_at
) VALUES (
    $1, $2, 'user', $3, $4, $5, 
    $6, $7, $8, $9, 
    NOW(), NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    display_name = EXCLUDED.display_name,
    height = EXCLUDED.height,
    weight = EXCLUDED.weight,
    birthdate = EXCLUDED.birthdate,
    gender = EXCLUDED.gender,
    fitness_goals = EXCLUDED.fitness_goals,
    experience_level = EXCLUDED.experience_level,
    updated_at = NOW();
