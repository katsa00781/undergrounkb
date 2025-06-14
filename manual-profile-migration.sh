#!/bin/bash

echo "Applying profile fields migration manually..."

# Function to execute supabase SQL command
execute_sql() {
  local sql="$1"
  echo "Executing SQL: $sql"
  
  # Use curl to directly execute the SQL query against the Supabase database
  # Replace with your actual connection method
  echo $sql | curl -s -X POST \
    -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    "${VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -d "{\"sql\": \"$sql\"}"
}

# Main script
source .env 2>/dev/null || echo "Warning: .env file not found"

# Create migration SQL
MIGRATION_SQL="
-- Add basic name fields if they don't exist
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Add other fields needed for profile form
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS fitness_goals text[],
ADD COLUMN IF NOT EXISTS experience_level text;

-- Update schemas to ensure frontend components work correctly
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
"

# Execute the migration
execute_sql "$MIGRATION_SQL"

echo "Profile fields migration completed."
