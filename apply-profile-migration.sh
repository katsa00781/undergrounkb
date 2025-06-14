#!/bin/bash

# Script to apply the profile fields migration

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Applying profile fields migration...${NC}"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo -e "${GREEN}Loading environment variables from .env file...${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}Error: Supabase URL or key not found in environment variables${NC}"
    exit 1
  else
    # Use Next.js env vars if Vite ones are not available
    export VITE_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
    export VITE_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  fi
fi

# Read migration SQL to string variable
MIGRATION_SQL=$(<./backup/all_migrations/20250614214500_add_profile_fields.sql)

# Apply the migration
echo -e "${YELLOW}Running profile fields migration SQL...${NC}"

# Try with curl first (direct approach)
echo -e "${YELLOW}Applying migration using direct SQL execution...${NC}"
curl -s -X POST \
  "$VITE_SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\":\"$MIGRATION_SQL\"}"

# Check if curl command was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Profile fields migration applied successfully.${NC}"
  
  # Verify the columns exist by checking one column
  VERIFY=$(curl -s -X GET \
    "$VITE_SUPABASE_URL/rest/v1/profiles?select=height&limit=1" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")
  
  if [[ "$VERIFY" != *"error"* ]]; then
    echo -e "${GREEN}✓ Verified columns were created successfully.${NC}"
    # Run our check script if it exists
    if [ -f ./check-profile-structure.sh ]; then
      echo -e "${BLUE}Running profile structure check script...${NC}"
      ./check-profile-structure.sh
    fi
    exit 0
  else
    echo -e "${YELLOW}Warning: Could not verify column creation.${NC}"
    echo -e "${YELLOW}The migration may have been applied but couldn't be verified.${NC}"
    echo -e "${YELLOW}Error response: $VERIFY${NC}"
    exit 1
  fi
else
  echo -e "${RED}Error: Failed to apply profile fields migration.${NC}"
  echo -e "${RED}Please apply the migration manually.${NC}"
  exit 1
fi

npm run fix:profile:all
