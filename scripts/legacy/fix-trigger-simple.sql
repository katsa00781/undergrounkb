-- Simplified trigger that only sets basic fields
-- full_name will be set later on the profile page
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        new.id, 
        new.email, 
        'user'
    );
    RETURN new;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
