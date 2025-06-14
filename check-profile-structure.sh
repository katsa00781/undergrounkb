#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Checking profile table for FMS fixes...${NC}"

# SQL query to check if specific columns exist
SQL_CHECK="
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN ('first_name', 'last_name', 'height', 'weight', 'birthdate', 'gender', 'fitness_goals', 'experience_level')
  ORDER BY column_name;
"

# Format results with nice colors
FORMAT_RESULTS() {
  while read -r COLUMN; do
    echo -e "${GREEN}✓ $COLUMN${NC}"
  done
}

# Export SQL via curl
EXECUTE_QUERY() {
  curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\":\"$SQL_CHECK\"}" | grep -o '"[^"]*"' | tr -d '"' | grep -v "column_name" | FORMAT_RESULTS
}

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo -e "${YELLOW}Loading environment from .env file${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Set variables from environment or from Next.js variables
SUPABASE_URL=${VITE_SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}
SUPABASE_KEY=${VITE_SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}Error: Supabase URL or key not found in environment variables${NC}"
  exit 1
fi

echo -e "${BLUE}Checking profile table structure...${NC}"
echo -e "${YELLOW}Looking for required columns:${NC}"

# Execute the query
EXECUTE_QUERY

echo -e "${BLUE}Check completed.${NC}"
echo -e "${YELLOW}If you don't see some columns, you'll need to run migrations to add them.${NC}"
echo -e "${YELLOW}Our typecast implementation provides fallbacks for missing columns.${NC}"
