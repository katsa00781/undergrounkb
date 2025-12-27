-- Visszaállítjuk az aktív időszakban lévő célokat 'active' státuszra

-- 1. Ellenőrzés: mely célok vannak completed státuszban de még nem járt le az end_date
SELECT 
    id,
    title,
    status,
    end_date,
    CURRENT_DATE as today,
    (end_date >= CURRENT_DATE) as still_active
FROM goals
WHERE status = 'completed' 
  AND end_date >= CURRENT_DATE;

-- 2. Frissítés: állítsuk vissza active státuszra azokat amelyek még nem jártak le
UPDATE goals
SET 
    status = 'active',
    updated_at = NOW()
WHERE status = 'completed' 
  AND end_date >= CURRENT_DATE;

-- 3. Ellenőrzés: hány cél lett frissítve
SELECT 
    status,
    COUNT(*) as count
FROM goals
GROUP BY status
ORDER BY status;
