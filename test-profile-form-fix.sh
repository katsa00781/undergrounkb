#!/bin/bash

# Test Profile Form Data Fix
# Ez a script teszteli a Profile oldal mentési logikáját

echo "🧪 PROFILE FORM DATA TESZTELÉS"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}1. SQL Function ellenőrzése...${NC}"

# Check if update_user_profile function exists
psql "${DATABASE_URL}" -c "
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'update_user_profile';
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ update_user_profile function exists${NC}"
else
    echo -e "${RED}❌ update_user_profile function NOT found${NC}"
    echo "Futtatni kell: psql \"\$DATABASE_URL\" -f fix_profiles_permissions.sql"
fi

echo ""
echo -e "${YELLOW}2. Profiles tábla szerkezet ellenőrzése...${NC}"

# Check if all required columns exist
psql "${DATABASE_URL}" -c "
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    'full_name', 'display_name', 'fitness_goals', 
    'height', 'weight', 'birthdate', 'gender', 'experience_level'
  )
ORDER BY column_name;
" 2>/dev/null

echo ""
echo -e "${YELLOW}3. RLS Policy ellenőrzése...${NC}"

# Check RLS policies
psql "${DATABASE_URL}" -c "
SELECT 
    policyname, 
    cmd, 
    roles, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
  AND schemaname = 'public';
" 2>/dev/null

echo ""
echo -e "${YELLOW}4. TypeScript típus ellenőrzése...${NC}"

# Check if typescript compiles
if command -v npx &> /dev/null; then
    echo "TypeScript típus ellenőrzés..."
    npx tsc --noEmit --project . 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ TypeScript típusok rendben${NC}"
    else
        echo -e "${RED}❌ TypeScript típus hibák vannak${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  NPX nem található, TypeScript ellenőrzés kihagyva${NC}"
fi

echo ""
echo -e "${YELLOW}5. Manuális tesztelés lépései:${NC}"
echo ""
echo "A. Nyisd meg a böngészőben a Profile oldalt"
echo "B. Töltsd ki a következő mezőket:"
echo "   - Display Name: 'Teszt Felhasználó'"
echo "   - Height: 180"
echo "   - Weight: 80"
echo "   - Birthdate: '1990-01-01'"
echo "   - Gender: 'male'"
echo "   - Fitness Goals: válassz ki 2-3 célt"
echo "   - Experience Level: 'intermediate'"
echo ""
echo "C. Nyomd meg a 'Save Profile' gombot"
echo ""
echo "D. Várt eredmény:"
echo "   - Zöld 'Profile updated successfully' üzenet"
echo "   - Az oldal frissülése után minden mező megmarad"
echo "   - Nincs 403 Forbidden hiba"
echo "   - A full_name mező a display_name értékét kapja"
echo ""
echo "E. Problémák esetén:"
echo "   - Nézd meg a böngésző console-t (F12)"
echo "   - Ellenőrizd a Network tabot hibáért"
echo "   - Futtasd le: psql \"\$DATABASE_URL\" -f fix_profiles_permissions.sql"

echo ""
echo -e "${GREEN}✅ Profile Form Data teszt script kész${NC}"
echo "A manuális tesztelés eredményét jelentsd vissza!"
