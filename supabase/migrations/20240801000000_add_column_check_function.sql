-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.check_column_exists(
    p_table_name TEXT,
    p_column_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = p_table_name
          AND column_name = p_column_name
    ) INTO column_exists;
    
    RETURN column_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
