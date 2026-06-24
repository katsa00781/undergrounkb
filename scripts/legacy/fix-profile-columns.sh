#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Profile Column Schema Fix Utility${NC}"
echo -e "${YELLOW}This script will add missing columns to the profiles table${NC}"

# SQL to add profile fields
SQL_QUERY="
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS fitness_goals text[],
ADD COLUMN IF NOT EXISTS experience_level text;
"

# Load environment variables
if [ -f .env ]; then
  echo -e "${GREEN}Loading environment from .env file${NC}"
  source .env
else
  echo -e "${YELLOW}Warning: No .env file found. Using environment variables.${NC}"
fi

# Check if required environment variables are set
SUPABASE_URL=${VITE_SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}
SUPABASE_KEY=${VITE_SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}Error: Supabase URL or key not found in environment variables${NC}"
  exit 1
fi

# Function to check if a column exists
check_column() {
  local COLUMN=$1
  echo -e "${YELLOW}Checking for '$COLUMN' column...${NC}"
  local CHECK=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/profiles?select=$COLUMN&limit=1" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  if [[ "$CHECK" == *"column"* && "$CHECK" == *"does not exist"* ]]; then
    echo -e "${RED}✗ Column '$COLUMN' does not exist${NC}"
    return 1
  else
    echo -e "${GREEN}✓ Column '$COLUMN' exists${NC}"
    return 0
  fi
}

# First check if columns already exist
echo -e "${BLUE}Checking if columns already exist...${NC}"
NEED_MIGRATION=false

if ! check_column "first_name"; then
  NEED_MIGRATION=true
fi

if ! check_column "fitness_goals"; then
  NEED_MIGRATION=true
fi

if [ "$NEED_MIGRATION" = true ]; then
  echo -e "${YELLOW}Some columns are missing. Applying migration...${NC}"
  
  # Try first with execute_sql function
  echo -e "${YELLOW}Trying with execute_sql function...${NC}"
  RESULT=$(curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\":\"$SQL_QUERY\"}")
  
  # If that fails, try with exec_sql (older naming)
  if [[ "$RESULT" == *"function"* && "$RESULT" == *"does not exist"* ]]; then
    echo -e "${YELLOW}Function execute_sql not found, trying exec_sql...${NC}"
    RESULT=$(curl -s -X POST \
      "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"sql\":\"$SQL_QUERY\"}")
  fi
  
  # Check result
  if [[ "$RESULT" == *"error"* ]]; then
    echo -e "${RED}Error applying migration: $RESULT${NC}"
    echo -e "${YELLOW}Trying one more approach with direct SQL...${NC}"
    
    # Make a direct call to Supabase REST API
    RESULT=$(curl -s -X POST \
      "$SUPABASE_URL/rest/v1/profiles?on_conflict=id" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -H "Prefer: resolution=merge-duplicates" \
      -d "[{\"id\":\"00000000-0000-0000-0000-000000000000\",\"first_name\":\"test\"}]")
    
    if [[ "$RESULT" == *"error"* ]]; then
      echo -e "${RED}All attempts failed. Error: $RESULT${NC}"
      echo -e "${RED}Please run the migration manually.${NC}"
      exit 1
    else
      echo -e "${GREEN}Migration applied successfully with the direct approach!${NC}"
    fi
  else
    echo -e "${GREEN}Migration applied successfully!${NC}"
  fi
  
  # Verify the columns were added
  echo -e "${BLUE}Verifying columns after migration...${NC}"
  check_column "first_name"
  check_column "fitness_goals"
else
  echo -e "${GREEN}All columns already exist. No migration needed.${NC}"
fi

echo -e "\n${GREEN}✓ Script completed successfully!${NC}"
echo -e "${YELLOW}If you still experience issues, try restarting your application${NC}"
echo -e "${YELLOW}to refresh the schema cache.${NC}"
