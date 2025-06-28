-- Fix the trigger to properly set full_name from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        new.id, 
        new.email, 
        'user', 
        COALESCE(
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'full_name', 
            split_part(new.email, '@', 1)
        )
    );
    RETURN new;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
