-- FMS Assessment Table Fix
-- Ez az SQL script javítja az fms_assessments tábla szerkezetét
-- Hajtsd végre ezt a Supabase SQL Editor-ban

-- Első lépés: Ellenőrzés és régi tábla törlése ha létezik
DROP TABLE IF EXISTS public.fms_assessments CASCADE;

-- Új FMS assessment tábla létrehozása a jelenlegi kód alapján
CREATE TABLE public.fms_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deep_squat INTEGER NOT NULL CHECK (deep_squat BETWEEN 0 AND 3),
  hurdle_step INTEGER NOT NULL CHECK (hurdle_step BETWEEN 0 AND 3),
  inline_lunge INTEGER NOT NULL CHECK (inline_lunge BETWEEN 0 AND 3),
  shoulder_mobility INTEGER NOT NULL CHECK (shoulder_mobility BETWEEN 0 AND 3),
  active_straight_leg_raise INTEGER NOT NULL CHECK (active_straight_leg_raise BETWEEN 0 AND 3),
  trunk_stability_pushup INTEGER NOT NULL CHECK (trunk_stability_pushup BETWEEN 0 AND 3),
  rotary_stability INTEGER NOT NULL CHECK (rotary_stability BETWEEN 0 AND 3),
  total_score INTEGER GENERATED ALWAYS AS (
    deep_squat + hurdle_step + inline_lunge + shoulder_mobility + 
    active_straight_leg_raise + trunk_stability_pushup + rotary_stability
  ) STORED,
  notes TEXT DEFAULT '',
  assessed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexek létrehozása a jobb teljesítményért
CREATE INDEX idx_fms_assessments_user_id ON public.fms_assessments (user_id);
CREATE INDEX idx_fms_assessments_assessed_by ON public.fms_assessments (assessed_by);
CREATE INDEX idx_fms_assessments_created_at ON public.fms_assessments (created_at);

-- Row Level Security (RLS) engedélyezése
ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;

-- RLS szabályok létrehozása
CREATE POLICY "fms_select_own" 
  ON public.fms_assessments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "fms_insert_own" 
  ON public.fms_assessments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fms_update_own" 
  ON public.fms_assessments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "fms_delete_own" 
  ON public.fms_assessments FOR DELETE 
  USING (auth.uid() = user_id);

-- Admin hozzáférés (ha van admin szerepkör)
CREATE POLICY "fms_admin_all" 
  ON public.fms_assessments FOR ALL 
  USING (
    auth.jwt() ->> 'role' = 'service_role' OR 
    auth.jwt() ->> 'user_role' = 'admin'
  );

-- Updated_at automatikus frissítése
CREATE OR REPLACE FUNCTION update_fms_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fms_assessments_updated_at
    BEFORE UPDATE ON public.fms_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_fms_assessments_updated_at();

-- Jogosultságok megadása
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fms_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fms_assessments TO service_role;

-- Komment hozzáadása
COMMENT ON TABLE public.fms_assessments IS 'FMS (Functional Movement Screen) assessment eredmények - egyszerűsített szerkezet';

-- Ellenőrzés: tábla szerkezet megjelenítése
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fms_assessments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
