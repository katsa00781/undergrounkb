#!/bin/bash

# 🔧 Két lépéses Admin User Management javítás
# Ez a script segít a két lépéses telepítési folyamatban

echo "🚀 Admin User Management Fix - Két lépéses telepítés"
echo "=================================================="

# Színes kimenetek
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${RED}${BOLD}FONTOS: POSTGRES ENUM LIMITATION!${NC}"
echo -e "${RED}Az enum értékek hozzáadása és használata külön tranzakciókban kell történjen!${NC}"
echo ""

echo -e "${BLUE}${BOLD}LÉPÉS 1: MINIMÁLIS ENUM JAVÍTÁS${NC}"
echo "==================================="
echo -e "${YELLOW}1. Nyisd meg a Supabase Dashboard > SQL Editor${NC}"
echo -e "${YELLOW}2. Másold be és futtasd le:${NC}"
echo ""
echo -e "${GREEN}   step1-minimal-enum.sql${NC}"
echo ""
echo -e "${RED}3. VÁRJ amíg a script lefut (csak enum hozzáadás)!${NC}"
echo ""

read -p "Nyomj ENTER-t, ha lefuttattad a STEP 1-et és várj 10-15 másodpercet..."

echo ""
echo -e "${YELLOW}⏳ VÁRAKOZÁS PostgreSQL COMMIT-ra...${NC}"
sleep 3
echo -e "${BLUE}Most már használható a disabled enum érték!${NC}"

echo ""
echo -e "${BLUE}${BOLD}LÉPÉS 2: ADMIN FUNKCIÓK${NC}"
echo "=========================="
echo -e "${YELLOW}1. Ugyanott a Supabase SQL Editor-ben${NC}"
echo -e "${YELLOW}2. Másold be és futtasd le:${NC}"
echo ""
echo -e "${GREEN}   step2-admin-functions.sql${NC}"
echo ""

read -p "Nyomj ENTER-t, ha lefuttattad a STEP 2-t..."

echo ""
echo -e "${BLUE}${BOLD}LÉPÉS 3: FRONTEND ÚJRAINDÍTÁS${NC}"
echo "================================"

# Cache törlés
echo "🧹 Törlöm a frontend cache fájlokat..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next/cache 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf .nuxt 2>/dev/null || true
rm -rf .svelte-kit 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -rf .vite 2>/dev/null || true
rm -rf .tsbuildinfo 2>/dev/null || true

echo -e "${GREEN}✅ Cache törölve${NC}"

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
    npm run dev &
    DEV_PID=$!
    echo -e "${BLUE}Dev server PID: $DEV_PID${NC}"
    echo -e "${YELLOW}A szerver a háttérben fut...${NC}"
elif grep -q '"start"' package.json; then
    echo -e "${GREEN}Running: npm start${NC}"
    npm start &
    DEV_PID=$!
    echo -e "${BLUE}Server PID: $DEV_PID${NC}"
else
    echo -e "${YELLOW}❓ Nincs dev script, futtasd kézzel:${NC}"
    echo "npm run dev"
fi

echo ""
echo -e "${GREEN}${BOLD}============================================${NC}"
echo -e "${GREEN}${BOLD}🎉 TELEPÍTÉS BEFEJEZVE!${NC}"
echo -e "${GREEN}${BOLD}============================================${NC}"
echo ""
echo -e "${BLUE}${BOLD}TESZTELÉS:${NC}"
echo "1. Böngészőben menj a User Management oldalra"
echo "2. Ellenőrizd, hogy a felhasználók betöltődnek"
echo "3. Tesztel egy admin funkciót (pl. Create User)"
echo ""
echo -e "${YELLOW}${BOLD}TROUBLESHOOTING:${NC}"
echo "- Ha még mindig enum hiba van: várj 1-2 percet és frissítsd az oldalt"
echo "- Ha RPC hibák vannak: ellenőrizd a funkciók létrejöttét"
echo "- Console-ban nézd a Supabase RPC hívásokat"
echo ""
echo -e "${GREEN}${BOLD}Sikeres telepítés! 🚀${NC}"

# Ha dev server fut, monitorozzuk
if [ ! -z "$DEV_PID" ]; then
    echo ""
    echo -e "${BLUE}Dev server fut (PID: $DEV_PID). Nyomj Ctrl+C a leállításhoz.${NC}"
    wait $DEV_PID
fi
