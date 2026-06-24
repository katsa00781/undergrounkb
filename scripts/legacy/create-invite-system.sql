-- 🔧 MEGHÍVÓ RENDSZER - ADATBÁZIS STRUKTÚRA
-- Másolj be ezt a Supabase Dashboard > SQL Editor-be

-- ==========================================
-- PENDING INVITES TÁBLA
-- ==========================================

-- Meghívó táblázat létrehozása
CREATE TABLE IF NOT EXISTS public.pending_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invite_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index-ek a jobb teljesítményért
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON public.pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON public.pending_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_pending_invites_expires ON public.pending_invites(expires_at);

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- RLS engedélyezése
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

-- Admin policy - adminok mindent láthatnak és kezelhetnek
CREATE POLICY "Admins can manage all invites" ON public.pending_invites
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Saját meghívók megtekintése policy
CREATE POLICY "Users can view their own invites" ON public.pending_invites
FOR SELECT USING (invited_by = auth.uid());

-- Public select policy a token validáláshoz (invite oldalakon)
CREATE POLICY "Public can validate invite tokens" ON public.pending_invites
FOR SELECT USING (
    invite_token IS NOT NULL 
    AND expires_at > NOW() 
    AND used_at IS NULL
);

-- ==========================================
-- MEGHÍVÓ FUNKCIÓK
-- ==========================================

-- Meghívó létrehozási funkció
CREATE OR REPLACE FUNCTION create_user_invite(
    invite_email TEXT,
    invite_role user_role DEFAULT 'user'
)
RETURNS SETOF public.pending_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_invite public.pending_invites;
BEGIN
    -- Admin jogosultság ellenőrzése
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can create invites';
    END IF;
    
    -- Ellenőrizzük, hogy már létezik-e felhasználó ezzel az email címmel
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE email = invite_email
    ) THEN
        RAISE EXCEPTION 'User with email % already exists', invite_email;
    END IF;
    
    -- Ellenőrizzük, hogy van-e aktív meghívó
    IF EXISTS (
        SELECT 1 FROM public.pending_invites 
        WHERE email = invite_email 
        AND expires_at > NOW() 
        AND used_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Active invite already exists for email %', invite_email;
    END IF;
    
    -- Új meghívó létrehozása
    INSERT INTO public.pending_invites (
        email,
        role,
        invited_by,
        invite_token,
        expires_at
    ) VALUES (
        invite_email,
        invite_role,
        auth.uid(),
        gen_random_uuid(),
        NOW() + INTERVAL '7 days'
    ) RETURNING * INTO new_invite;
    
    RAISE NOTICE 'Invite created for % with token %', invite_email, new_invite.invite_token;
    RETURN NEXT new_invite;
END $$;

-- Meghívó érvényesítési funkció
CREATE OR REPLACE FUNCTION validate_invite_token(token UUID)
RETURNS SETOF public.pending_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.pending_invites
    WHERE invite_token = token
    AND expires_at > NOW()
    AND used_at IS NULL;
END $$;

-- Meghívó felhasználási funkció
CREATE OR REPLACE FUNCTION use_invite_token(
    token UUID,
    new_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record public.pending_invites;
BEGIN
    -- Meghívó keresése és validálása
    SELECT * INTO invite_record
    FROM public.pending_invites
    WHERE invite_token = token
    AND expires_at > NOW()
    AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invite token';
    END IF;
    
    -- Profil létrehozása/frissítése az új felhasználóhoz
    INSERT INTO public.profiles (
        id,
        email,
        role,
        display_name,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        invite_record.email,
        invite_record.role,
        split_part(invite_record.email, '@', 1),
        split_part(invite_record.email, '@', 1),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    -- Meghívó felhasználva jelölése
    UPDATE public.pending_invites
    SET 
        used_at = NOW(),
        updated_at = NOW()
    WHERE id = invite_record.id;
    
    RETURN TRUE;
END $$;

-- ==========================================
-- JOGOSULTSÁGOK
-- ==========================================

-- Funkciók publikus elérhetősége
GRANT EXECUTE ON FUNCTION create_user_invite TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invite_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION use_invite_token TO anon, authenticated;

-- ==========================================
-- CLEANUP FUNKCIÓ (LEJÁRT MEGHÍVÓK TÖRLÉSE)
-- ==========================================

CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.pending_invites
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % expired invites', deleted_count;
    
    RETURN deleted_count;
END $$;

-- ==========================================
-- VALIDÁCIÓ
-- ==========================================

-- Ellenőrizzük a tábla létrejöttét
SELECT 
    'pending_invites table created' as status,
    COUNT(*) as invite_count
FROM public.pending_invites;

-- Ellenőrizzük a funkciókat
SELECT 
    'Functions created' as status,
    routine_name as function_name
FROM information_schema.routines 
WHERE routine_name IN ('create_user_invite', 'validate_invite_token', 'use_invite_token')
AND routine_schema = 'public'
ORDER BY routine_name;

SELECT '✅ INVITE SYSTEM DATABASE SETUP COMPLETE!' as result;
