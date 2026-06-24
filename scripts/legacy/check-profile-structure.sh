#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Checking profile table for FMS fixes...${NC}"

# Columns we expect on the profiles table
COLUMNS=(
  first_name
  last_name
  height
  weight
  birthdate
  gender
  fitness_goals
  experience_level
)

check_column() {
  local column=$1
  local response

  response=$(curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/check_column_exists" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"p_table_name\":\"profiles\",\"p_column_name\":\"$column\"}")

  if echo "$response" | grep -qi "true"; then
    echo -e "${GREEN}✓ $column${NC}"
  else
    echo -e "${RED}✗ $column missing${NC}"
  fi
}

# Load environment variables from .env if available
if [ -f .env ]; then
  echo -e "${YELLOW}Loading environment from .env file${NC}"
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Pull credentials from available environment variables
SUPABASE_URL=${VITE_SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}
SUPABASE_KEY=${VITE_SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}Error: Supabase URL or key not found in environment variables${NC}"
  exit 1
fi

echo -e "${BLUE}Checking profile table structure...${NC}"
echo -e "${YELLOW}Looking for required columns:${NC}"

for column in "${COLUMNS[@]}"; do
  check_column "$column"
done

echo -e "${BLUE}Check completed.${NC}"
echo -e "${YELLOW}If you don't see some columns, you'll need to run migrations to add them.${NC}"
echo -e "${YELLOW}Our typecast implementation provides fallbacks for missing columns.${NC}"
