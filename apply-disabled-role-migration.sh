#!/bin/bash

# Script to apply the disabled role migration

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Applying disabled role migration...${NC}"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo -e "${GREEN}Loading environment variables from .env file...${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Check if required environment variables are set
SUPABASE_URL=${SUPABASE_URL:-$VITE_SUPABASE_URL}
if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}Error: SUPABASE_URL (or VITE_SUPABASE_URL) must be set${NC}"
  echo "Please set these environment variables or add them to your .env file"
  exit 1
fi

echo -e "${GREEN}Environment variables loaded successfully${NC}"
echo "SUPABASE_URL: $SUPABASE_URL"
echo "Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: psql is not installed${NC}"
  echo "Please install PostgreSQL client tools"
  exit 1
fi

# Extract database connection details from Supabase URL
DB_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|http://||' | cut -d'.' -f1)
DB_FULL_HOST="${DB_HOST}.supabase.co"
DB_NAME="postgres"
DB_PORT="5432"
DB_USER="postgres"

echo -e "${YELLOW}Connecting to database...${NC}"
echo "Host: $DB_FULL_HOST"
echo "Database: $DB_NAME"
echo "Port: $DB_PORT"

# If service role key is not set, we'll use the anon key and note the limitation
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${YELLOW}Warning: Using ANON key instead of SERVICE_ROLE key${NC}"
  echo -e "${YELLOW}This may not have sufficient permissions for schema changes${NC}"
  PASSWORD=${VITE_SUPABASE_ANON_KEY}
else
  PASSWORD=${SUPABASE_SERVICE_ROLE_KEY}
fi

# Apply the migration
echo -e "${BLUE}Applying disabled role migration...${NC}"

PGPASSWORD="$PASSWORD" psql \
  -h "$DB_FULL_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f add-disabled-role.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Disabled role migration applied successfully!${NC}"
  
  # Verify the enum values
  echo -e "${BLUE}Verifying enum values...${NC}"
  PGPASSWORD="$PASSWORD" psql \
    -h "$DB_FULL_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT unnest(enum_range(NULL::user_role)) AS role_values;"
  
  echo -e "${GREEN}✅ Migration completed successfully!${NC}"
  echo -e "${YELLOW}Note: The 'disabled' role is now available for soft delete functionality${NC}"
else
  echo -e "${RED}❌ Migration failed!${NC}"
  exit 1
fi
