-- Cél táblához starting_value oszlop hozzáadása
-- Ez az oszlop tárolja a kiindulási/baseline értéket a célokhoz

-- 1. Oszlop hozzáadása (ha még nem létezik)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'goals' 
        AND column_name = 'starting_value'
    ) THEN
        ALTER TABLE goals 
        ADD COLUMN starting_value DECIMAL(10,2);
        
        RAISE NOTICE 'starting_value oszlop sikeresen hozzáadva';
    ELSE
        RAISE NOTICE 'starting_value oszlop már létezik';
    END IF;
END $$;

-- 2. Komment hozzáadása az oszlophoz
COMMENT ON COLUMN goals.starting_value IS 'Kiindulási/baseline érték - honnan indult a felhasználó (pl. jelenlegi súly)';

-- 3. Meglévő célokhoz alapértelmezett értékek beállítása (opcionális)
-- Azokhoz a célokhoz, ahol még nincs starting_value, de van current_value
UPDATE goals 
SET starting_value = current_value 
WHERE starting_value IS NULL 
  AND current_value IS NOT NULL
  AND created_at::date = start_date::date; -- Csak azokhoz, ahol a létrehozás dátuma megegyezik a kezdő dátummal

-- Ellenőrzés
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
  AND column_name IN ('starting_value', 'current_value', 'target_value')
ORDER BY ordinal_position;
