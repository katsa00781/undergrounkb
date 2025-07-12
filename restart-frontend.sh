#!/bin/bash

# 🔧 Frontend Cache Clear & Restart Script
# Ezzel tisztítod a cache-t és indítod újra a frontend-et

echo "🧹 Clearing frontend cache and restarting..."

# 1. Töröljük a node_modules cache-t
echo "📦 Clearing node_modules cache..."
rm -rf node_modules/.cache
rm -rf .next/cache
rm -rf dist

# 2. Töröljük a browser cache specifikus fájlokat
echo "🌐 Clearing browser cache files..."
rm -rf .nuxt
rm -rf .svelte-kit
rm -rf build
rm -rf .vite

# 3. TypeScript cache törlése
echo "📝 Clearing TypeScript cache..."
rm -rf .tsbuildinfo
rm -rf tsconfig.tsbuildinfo

# 4. NPM cache clean
echo "📦 Cleaning npm cache..."
npm cache clean --force 2>/dev/null || echo "NPM cache clean skipped"

# 5. Ha van package-lock.json, frissítjük
if [ -f "package-lock.json" ]; then
    echo "🔒 Refreshing package-lock.json..."
    rm package-lock.json
    npm install
fi

# 6. Újraindítjuk a dev server-t
echo "🚀 Starting development server..."

# Ellenőrizzük a package.json-t a megfelelő script-ért
if [ -f "package.json" ]; then
    if grep -q '"dev"' package.json; then
        echo "📋 Running: npm run dev"
        npm run dev
    elif grep -q '"start"' package.json; then
        echo "📋 Running: npm start"
        npm start
    elif grep -q '"serve"' package.json; then
        echo "📋 Running: npm run serve"
        npm run serve
    else
        echo "❓ No recognized dev script found. Available scripts:"
        npm run
    fi
else
    echo "❌ package.json not found!"
    exit 1
fi
