#!/bin/bash
# Reset Supabase Schema Cache for the Kettlebell Pro application

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}Kettlebell Pro - Schema Cache Reset Tool${NC}"
echo -e "${YELLOW}This script will reset the Supabase schema cache to fix schema issues${NC}"

# Check browser localStorage cache
echo -e "\n${BLUE}Step 1: Instructions for clearing browser cache${NC}"
echo -e "${YELLOW}To completely fix schema issues, follow these steps:${NC}"
echo -e "1. ${BOLD}Open your browser's developer tools${NC} (F12 or right-click > Inspect)"
echo -e "2. Go to the ${BOLD}Application${NC} tab"
echo -e "3. Select ${BOLD}Local Storage${NC} on the left sidebar"
echo -e "4. Find entries for ${BOLD}supabase${NC} or your app domain"
echo -e "5. Delete any entries with ${BOLD}supabase_schema${NC} in the name"
echo -e "6. Refresh the page"

# Reset schema cache in the application
echo -e "\n${BLUE}Step 2: Update your .env file to force schema reload${NC}"
echo -e "${YELLOW}Add the following to your .env file:${NC}"
echo -e "${BOLD}VITE_SUPABASE_SCHEMA_CACHE=false${NC}"

# Update the .env file if it exists
if [ -f .env ]; then
  echo -e "\n${BLUE}Updating .env file...${NC}"
  
  if grep -q "VITE_SUPABASE_SCHEMA_CACHE" .env; then
    # Replace existing setting
    sed -i '' 's/VITE_SUPABASE_SCHEMA_CACHE=.*/VITE_SUPABASE_SCHEMA_CACHE=false/' .env
  else
    # Add new setting
    echo "VITE_SUPABASE_SCHEMA_CACHE=false" >> .env
  fi
  
  echo -e "${GREEN}✓ Updated .env file successfully${NC}"
else
  echo -e "${YELLOW}⚠️ No .env file found. Create one with:${NC}"
  echo -e "${BOLD}VITE_SUPABASE_SCHEMA_CACHE=false${NC}"
fi

echo -e "\n${GREEN}${BOLD}Schema Cache Reset Steps Complete${NC}"
echo -e "${YELLOW}Please restart your application and refresh your browser${NC}"
echo -e "${YELLOW}If you still encounter issues, try running the fix-profile-database.sh script${NC}"
