-- Function to execute arbitrary SQL (use with caution - restricted to schema admins)
CREATE OR REPLACE FUNCTION public.create_execute_sql_function()
RETURNS void AS $$
BEGIN
  CREATE OR REPLACE FUNCTION public.execute_sql(sql_string TEXT)
  RETURNS void AS $inner$
  BEGIN
    EXECUTE sql_string;
  END;
  $inner$ LANGUAGE plpgsql SECURITY DEFINER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions as needed
-- GRANT EXECUTE ON FUNCTION public.create_execute_sql_function() TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;
