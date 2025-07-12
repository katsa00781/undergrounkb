-- FULL_NAME FIX ONLY
-- Ez a script csak az update_user_profile function javítását tartalmazza

CREATE OR REPLACE FUNCTION update_user_profile(
    user_id UUID,
    profile_data JSONB
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ellenőrizzük, hogy a felhasználó csak saját profilját frissíti
    IF auth.uid() != user_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot update another user''s profile';
    END IF;
    
    -- Frissítjük a profilt
    RETURN QUERY
    UPDATE public.profiles
    SET 
        display_name = COALESCE(
            NULLIF((profile_data->>'display_name')::TEXT, ''), 
            display_name
        ),
        full_name = COALESCE(
            NULLIF((profile_data->>'full_name')::TEXT, ''), 
            NULLIF((profile_data->>'display_name')::TEXT, ''),
            display_name,
            full_name
        ),
        height = COALESCE(
            CASE 
                WHEN profile_data ? 'height' AND (profile_data->>'height') != 'null'
                THEN (profile_data->>'height')::INTEGER 
                ELSE NULL 
            END, 
            height
        ),
        weight = COALESCE(
            CASE 
                WHEN profile_data ? 'weight' AND (profile_data->>'weight') != 'null'
                THEN (profile_data->>'weight')::DECIMAL 
                ELSE NULL 
            END, 
            weight
        ),
        birthdate = COALESCE(
            CASE 
                WHEN profile_data ? 'birthdate' AND (profile_data->>'birthdate') != 'null' AND (profile_data->>'birthdate') != ''
                THEN (profile_data->>'birthdate')::DATE 
                ELSE NULL 
            END, 
            birthdate
        ),
        gender = COALESCE(
            NULLIF((profile_data->>'gender')::TEXT, ''), 
            gender
        ),
        fitness_goals = COALESCE(
            CASE 
                WHEN profile_data ? 'fitness_goals' 
                THEN (profile_data->'fitness_goals')::JSONB 
                ELSE NULL 
            END, 
            fitness_goals
        ),
        experience_level = COALESCE(
            NULLIF((profile_data->>'experience_level')::TEXT, ''), 
            experience_level
        ),
        updated_at = NOW()
    WHERE id = user_id
    RETURNING *;
END $$;

-- Function komment
COMMENT ON FUNCTION update_user_profile(UUID, JSONB) IS 'Biztonságosan frissíti a felhasználó profilját - full_name fix';

-- SUCCESS üzenet
DO $$
BEGIN
    RAISE NOTICE '✅ update_user_profile function frissítve full_name fix-el!';
    RAISE NOTICE '📝 Most már a full_name mező helyesen töltődik fel displayName-ből';
END $$;
