-- LÉPÉS 1: FMS és SMR enum értékek hozzáadása
-- ===================================================
-- FONTOS: Ezt a scriptet ELŐSZÖR kell lefuttatni!
-- Másold ki és futtasd le a Supabase SQL Editor-ban
-- ===================================================

-- Új enum értékek hozzáadása
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'fms';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'smr';

-- Ellenőrzés
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'exercise_category'::regtype
ORDER BY enumlabel;
