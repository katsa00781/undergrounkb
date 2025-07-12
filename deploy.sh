#!/bin/bash

# 🚀 UG KettleBell Pro - Gyors Deployment Script
# Futtasd ezt a script-et a web deployment-hez

echo "🏋️ UG KettleBell Pro - Web Deployment"
echo "====================================="

# 1. Build ellenőrzés
echo "📦 Production build készítése..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Deployment megszakítva."
    exit 1
fi

echo "✅ Build sikeres!"

# 2. Platform választás
echo ""
echo "🌐 Válassz deployment platformot:"
echo "1) Vercel (Ajánlott - gyors és egyszerű)"
echo "2) Netlify (Jó alternatíva)"
echo "3) Manual deployment instructions"

read -p "Válassz (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Vercel deployment..."
        
        # Vercel CLI telepítése ha nincs
        if ! command -v vercel &> /dev/null; then
            echo "📦 Vercel CLI telepítése..."
            npm install -g vercel
        fi
        
        echo "🔐 Jelentkezz be Vercel-be a megnyíló böngészőben..."
        vercel login
        
        echo "🚀 Deployment indítása..."
        vercel --prod
        
        echo ""
        echo "✅ Vercel deployment kész!"
        echo "🌐 Az alkalmazás elérhető a megadott URL-en"
        echo ""
        echo "📋 Next steps:"
        echo "1. Vercel dashboard-ban állítsd be a környezeti változókat:"
        echo "   - VITE_SUPABASE_URL"
        echo "   - VITE_SUPABASE_ANON_KEY"
        echo "2. Teszteld az alkalmazást"
        echo "3. Opcionális: custom domain beállítás"
        ;;
        
    2)
        echo ""
        echo "🚀 Netlify deployment..."
        
        # Netlify CLI telepítése ha nincs
        if ! command -v netlify &> /dev/null; then
            echo "📦 Netlify CLI telepítése..."
            npm install -g netlify-cli
        fi
        
        echo "🔐 Jelentkezz be Netlify-be..."
        netlify login
        
        echo "🚀 Deployment indítása..."
        netlify deploy --prod --dir=dist
        
        echo ""
        echo "✅ Netlify deployment kész!"
        echo "🌐 Az alkalmazás elérhető a megadott URL-en"
        echo ""
        echo "📋 Next steps:"
        echo "1. Netlify dashboard-ban állítsd be a környezeti változókat"
        echo "2. Teszteld az alkalmazást"
        ;;
        
    3)
        echo ""
        echo "📖 Manual deployment instructions:"
        echo ""
        echo "🔸 GitHub Pages:"
        echo "1. Push kód GitHub-ra"
        echo "2. Repository Settings → Pages → Source: GitHub Actions"
        echo "3. Hozz létre .github/workflows/deploy.yml fájlt"
        echo ""
        echo "🔸 Egyéb platformok:"
        echo "1. Zip-eld a dist/ mappa tartalmát"
        echo "2. Töltsd fel a választott platformra"
        echo "3. Állítsd be a környezeti változókat"
        echo ""
        echo "📂 A dist/ mappa tartalmazza a kész alkalmazást"
        ;;
        
    *)
        echo "❌ Érvénytelen választás. Futtasd újra a script-et."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process befejezve!"
echo "📚 További info: DEPLOYMENT_GUIDE.md"
