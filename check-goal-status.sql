-- Ellenőrizzük a célok státuszát és dátumait

SELECT 
    id,
    title,
    status,
    start_date,
    end_date,
    CASE 
        WHEN end_date < CURRENT_DATE THEN 'Lejárt'
        WHEN end_date = CURRENT_DATE THEN 'Ma jár le'
        ELSE 'Aktív időszak'
    END as date_status,
    created_at,
    updated_at
FROM goals
ORDER BY created_at DESC
LIMIT 10;

-- Ellenőrizzük hogy van-e olyan trigger ami módosítja a status-t
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('goals', 'goal_completions')
ORDER BY event_object_table, trigger_name;
