CREATE TABLE IF NOT EXISTS public.manual_guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    linked_fms_user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_guests_owner_name_unique
    ON public.manual_guests (owner_user_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_manual_guests_owner_user_id
    ON public.manual_guests (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_manual_guests_linked_fms_user_id
    ON public.manual_guests (linked_fms_user_id);

ALTER TABLE public.manual_guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own manual guests" ON public.manual_guests;
CREATE POLICY "Users can view own manual guests"
ON public.manual_guests
FOR SELECT
USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can insert own manual guests" ON public.manual_guests;
CREATE POLICY "Users can insert own manual guests"
ON public.manual_guests
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can update own manual guests" ON public.manual_guests;
CREATE POLICY "Users can update own manual guests"
ON public.manual_guests
FOR UPDATE
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can delete own manual guests" ON public.manual_guests;
CREATE POLICY "Users can delete own manual guests"
ON public.manual_guests
FOR DELETE
USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Admins have full access to manual guests" ON public.manual_guests;
CREATE POLICY "Admins have full access to manual guests"
ON public.manual_guests
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);

CREATE OR REPLACE FUNCTION public.update_manual_guests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('UTC', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_manual_guests_updated_at ON public.manual_guests;
CREATE TRIGGER trigger_update_manual_guests_updated_at
    BEFORE UPDATE ON public.manual_guests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_manual_guests_updated_at();

COMMENT ON TABLE public.manual_guests IS 'Planner-specific manual guest list, decoupled from shared auth/profile users.';