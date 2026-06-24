#!/bin/bash

# 🔧 Quick Start - Admin User Management Fix
# Ez a script végigvezet az összes szükséges lépésen

echo "🚀 Admin User Management Fix - Quick Start"
echo "========================================"

# Színes kimenetek
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}LÉPÉS 1: SQL MIGRÁCIÓS SCRIPT${NC}"
echo "-------------------------------"
echo -e "${YELLOW}1. Nyisd meg a Supabase Dashboard${NC}"
echo -e "${YELLOW}2. Menj a SQL Editor-be${NC}"
echo -e "${YELLOW}3. Másold be és futtasd le:${NC}"
echo ""
echo -e "${GREEN}   admin-user-management-complete-fix.sql${NC}"
echo ""
echo -e "${RED}FONTOS: Várj amíg a script lefut, mielőtt folytatnád!${NC}"
echo ""

read -p "Nyomj ENTER-t, ha lefuttattad az SQL script-et..."

echo ""
echo -e "${BLUE}LÉPÉS 2: FRONTEND CACHE TÖRLÉS${NC}"
echo "--------------------------------"

# Cache törlés
echo "🧹 Törlöm a cache fájlokat..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next/cache 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf .nuxt 2>/dev/null || true
rm -rf .svelte-kit 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -rf .vite 2>/dev/null || true
rm -rf .tsbuildinfo 2>/dev/null || true

echo -e "${GREEN}✅ Cache törölve${NC}"

echo ""
echo -e "${BLUE}LÉPÉS 3: FEJLESZTŐI SZERVER INDÍTÁS${NC}"
echo "------------------------------------"

# Ellenőrizzük a package.json-t
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json nem található!${NC}"
    echo "Győződj meg róla, hogy a projekt root könyvtárában vagy!"
    exit 1
fi

# NPM packages ellenőrzése
if [ ! -d "node_modules" ]; then
    echo "📦 Node modules telepítése..."
    npm install
fi

echo ""
echo "🚀 Fejlesztői szerver indítása..."

# Megfelelő script megkeresése és futtatása
if grep -q '"dev"' package.json; then
    echo -e "${GREEN}Running: npm run dev${NC}"
    npm run dev
elif grep -q '"start"' package.json; then
    echo -e "${GREEN}Running: npm start${NC}"
    npm start
elif grep -q '"serve"' package.json; then
    echo -e "${GREEN}Running: npm run serve${NC}"
    npm run serve
else
    echo -e "${YELLOW}❓ Nincsenek felismert dev scriptek. Elérhető scriptek:${NC}"
    npm run 2>/dev/null || echo "Nincsenek scriptek definiálva"
    echo ""
    echo -e "${BLUE}Próbáld kézzel:${NC}"
    echo "npm run dev"
    echo "npm start"
    echo "npm run serve"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 JAVÍTÁS BEFEJEZVE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}TESZTELÉS:${NC}"
echo "1. Menj a User Management oldalra"
echo "2. Ellenőrizd, hogy a felhasználók betöltődnek"
echo "3. Tesztel egy admin funkciót (pl. Create User)"
echo ""
echo -e "${YELLOW}Ha problémába ütközöl, nézd meg:${NC}"
echo "- FINAL_ADMIN_FIX_SUMMARY.md"
echo "- TESTING_GUIDE.md"
echo ""
echo -e "${GREEN}Sikeres telepítés! 🚀${NC}"
