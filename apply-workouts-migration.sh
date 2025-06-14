#!/bin/bash

# Script to apply the workouts table migration to Supabase

# ANSI color codes
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo -e "${YELLOW}This script will apply the workouts table migration to your Supabase project.${NC}"
echo "Make sure you have the Supabase CLI installed and are logged in."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI is not installed.${NC}"
    echo "Please install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Prompt for confirmation
read -p "Do you want to apply the migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled.${NC}"
    echo
    echo -e "${YELLOW}Alternative methods to create the workouts table:${NC}"
    echo "1. Run the following SQL in the Supabase SQL Editor:"
    echo
    cat ./supabase/migrations/20250614144100_create_workouts_table.sql
    exit 0
fi

# Apply the migration
echo -e "${GREEN}Applying migration...${NC}"
supabase db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Migration applied successfully!${NC}"
    echo "The workouts table has been created in your Supabase project."
else
    echo -e "${RED}Failed to apply migration.${NC}"
    echo "You can manually run the SQL in the Supabase SQL Editor:"
    echo
    cat ./supabase/migrations/20250614144100_create_workouts_table.sql
fi
