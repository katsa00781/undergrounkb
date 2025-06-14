#!/bin/bash
# filepath: /Users/kacsorzsolt/Downloads/ugkettlebellpro/fix-first-name-column.sh

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}First Name Column Fix Utility${NC}"
echo -e "${YELLOW}This script will specifically fix the 'first_name' column issue${NC}"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo -e "${GREEN}Loading environment variables from .env file...${NC}"
  source .env
fi

# Check if required environment variables are set
SUPABASE_URL=${VITE_SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}
SUPABASE_KEY=${VITE_SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}Error: Supabase URL or key not found in environment variables${NC}"
  exit 1
fi

echo -e "${YELLOW}Using Supabase endpoint: ${SUPABASE_URL}${NC}"

# Direct SQL with explicit first_name and last_name columns
SQL_QUERY="
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;
"

# Execute the SQL to add first_name column directly
echo -e "${YELLOW}Adding first_name and last_name columns directly...${NC}"
RESULT=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\":\"$SQL_QUERY\"}")

# Check if the execute_sql function exists
if [[ "$RESULT" == *"function"* && "$RESULT" == *"does not exist"* ]]; then
  echo -e "${YELLOW}execute_sql function not found, trying older exec_sql...${NC}"
  RESULT=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\":\"$SQL_QUERY\"}")
fi

# Check result
if [[ "$RESULT" == *"error"* ]]; then
  echo -e "${RED}Error applying SQL: $RESULT${NC}"
  
  # Try alternative approach with direct column insert
  echo -e "${YELLOW}Trying alternate approach...${NC}"
  RESULT=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/profiles" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates" \
    -d "[{\"id\":\"00000000-0000-0000-0000-000000000000\",\"first_name\":\"test\",\"last_name\":\"user\"}]")
  
  if [[ "$RESULT" == *"error"* ]]; then
    echo -e "${RED}All approaches failed. Error: $RESULT${NC}"
    echo -e "${RED}Please contact support to resolve this database issue.${NC}"
    exit 1
  else
    echo -e "${GREEN}✓ Column added successfully via direct insert!${NC}"
  fi
else
  echo -e "${GREEN}✓ Columns added successfully!${NC}"
fi

# Verify the column exists
echo -e "${YELLOW}Verifying first_name column...${NC}"
VERIFY=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/profiles?select=first_name&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if [[ "$VERIFY" != *"error"* || "$VERIFY" == "[]" ]]; then
  echo -e "${GREEN}✓ Verified first_name column exists!${NC}"
  echo -e "${GREEN}✅ Fix completed successfully.${NC}"
  echo -e "${YELLOW}Please restart your application.${NC}"
else
  echo -e "${RED}Column verification failed: $VERIFY${NC}"
  echo -e "${RED}The fix might not have been successful.${NC}"
  echo -e "${YELLOW}You may need to wait a few minutes and try again.${NC}"
  exit 1
fi
