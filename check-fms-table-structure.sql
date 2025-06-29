-- Check the actual structure of the fms_assessments table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fms_assessments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
