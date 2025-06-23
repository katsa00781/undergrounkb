-- Ellenőrizzük, hogy a tábla létezik-e, ha nem, akkor létrehozzuk
CREATE TABLE IF NOT EXISTS public.user_weights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    weight DECIMAL(5,2) NOT NULL,  -- Két tizedes pontosság, max 999.99
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', now()),
    date DATE,
    notes TEXT,
    
    -- Külső kulcs a felhasználói azonosítóhoz
    CONSTRAINT fk_user_weights_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Biztonsági beállítások: csak a saját súlyadataihoz férhet hozzá a felhasználó
ALTER TABLE public.user_weights ENABLE ROW LEVEL SECURITY;

-- Alapértelmezett policy: csak a saját adataikat láthatják a felhasználók
CREATE POLICY IF NOT EXISTS "Users can view own weight data" 
ON public.user_weights 
FOR SELECT
USING (auth.uid() = user_id);

-- A felhasználók csak a saját adataikat módosíthatják
CREATE POLICY IF NOT EXISTS "Users can insert own weight data" 
ON public.user_weights 
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- A felhasználók csak a saját adataikat törölhetik
CREATE POLICY IF NOT EXISTS "Users can delete own weight data" 
ON public.user_weights 
FOR DELETE
USING (auth.uid() = user_id);

-- Index a felhasználói azonosítóra a gyorsabb lekérdezések érdekében
CREATE INDEX IF NOT EXISTS idx_user_weights_user_id ON public.user_weights (user_id);

-- Index a dátumra a kronológiai lekérdezések gyorsítása érdekében
CREATE INDEX IF NOT EXISTS idx_user_weights_created_at ON public.user_weights (created_at);

-- Admin szerepköröknek teljes hozzáférés
CREATE POLICY IF NOT EXISTS "Admins have full access" 
ON public.user_weights 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Komment a táblához
COMMENT ON TABLE public.user_weights IS 'Tábla a felhasználók testsúly adatainak tárolására';
