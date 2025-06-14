#!/bin/bash
# filepath: /Users/kacsorzsolt/Downloads/ugkettlebellpro/fix-profile-database.sh

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}Kettlebell Pro Profile Database Fix Utility${NC}"
echo -e "${YELLOW}This script will fix database schema issues with the profiles table${NC}"
echo -e "${YELLOW}It combines multiple fix scripts for maximum effectiveness${NC}"

# Check if running as a user with sufficient permissions
echo -e "${BLUE}Step 1: Checking environment...${NC}"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo -e "${GREEN}✓ Loading environment variables from .env file${NC}"
  source .env
else
  echo -e "${YELLOW}⚠️ No .env file found. Will try to use environment variables.${NC}"
fi

# Check if required environment variables are set
SUPABASE_URL=${VITE_SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}
SUPABASE_KEY=${VITE_SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}✗ Error: Supabase URL or key not found in environment variables${NC}"
  echo -e "${YELLOW}Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Supabase environment variables found${NC}"
echo -e "${YELLOW}Using Supabase endpoint: ${SUPABASE_URL}${NC}"

# Function to run a script if it exists
run_script() {
  local script=$1
  if [ -f "$script" ]; then
    echo -e "${YELLOW}Running $script...${NC}"
    bash "$script"
    return $?
  else
    echo -e "${RED}✗ Script not found: $script${NC}"
    return 1
  fi
}

# Step 2: Check profile structure
echo -e "\n${BLUE}Step 2: Checking current profile structure...${NC}"
if [ -f "./check-profile-structure.sh" ]; then
  ./check-profile-structure.sh
else
  echo -e "${YELLOW}⚠️ check-profile-structure.sh not found, skipping check${NC}"
fi

# Step 3: Apply the first name column fix
echo -e "\n${BLUE}Step 3: Adding first_name and last_name columns...${NC}"
./fix-first-name-column.sh

# Step 4: Apply the full profile fields migration
echo -e "\n${BLUE}Step 4: Adding all required profile fields...${NC}"
./fix-profile-columns.sh

# Step 5: Verify the changes
echo -e "\n${BLUE}Step 5: Verifying changes...${NC}"

echo -e "${YELLOW}Testing first_name column...${NC}"
VERIFY=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/profiles?select=first_name&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if [[ "$VERIFY" != *"error"* || "$VERIFY" == "[]" ]]; then
  echo -e "${GREEN}✓ first_name column exists and is accessible${NC}"
  FIRST_NAME_OK=true
else
  echo -e "${RED}✗ first_name column verification failed: $VERIFY${NC}"
  FIRST_NAME_OK=false
fi

echo -e "${YELLOW}Testing fitness_goals column...${NC}"
VERIFY=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/profiles?select=fitness_goals&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if [[ "$VERIFY" != *"error"* || "$VERIFY" == "[]" ]]; then
  echo -e "${GREEN}✓ fitness_goals column exists and is accessible${NC}"
  FITNESS_GOALS_OK=true
else
  echo -e "${RED}✗ fitness_goals column verification failed: $VERIFY${NC}"
  FITNESS_GOALS_OK=false
fi

# Final status report
echo -e "\n${BLUE}${BOLD}Final Status Report:${NC}"
if [ "$FIRST_NAME_OK" = true ] && [ "$FITNESS_GOALS_OK" = true ]; then
  echo -e "${GREEN}✅ All fixes applied successfully!${NC}"
  echo -e "${GREEN}✅ The profile database schema should now be working correctly.${NC}"
else
  echo -e "${RED}⚠️ Some issues remain:${NC}"
  [ "$FIRST_NAME_OK" != true ] && echo -e "${RED}  - first_name column issue${NC}"
  [ "$FITNESS_GOALS_OK" != true ] && echo -e "${RED}  - fitness_goals column issue${NC}"
  echo -e "${YELLOW}Please contact the development team for further assistance.${NC}"
fi

echo -e "\n${BOLD}${BLUE}Next Steps:${NC}"
echo -e "1. ${YELLOW}Restart your application to refresh the schema cache${NC}"
echo -e "2. ${YELLOW}If problems persist, try running the following command:${NC}"
echo -e "   ${GREEN}npm run dev -- --force${NC} (to force a full rebuild)"
echo -e "3. ${YELLOW}Check the browser console for any remaining errors${NC}"

echo -e "\n${BOLD}${BLUE}Need Help?${NC}"
echo -e "${YELLOW}Check the troubleshooting guide in docs/profile_system_fix.md${NC}"
