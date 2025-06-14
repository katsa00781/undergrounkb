# UGKettlebellPro App Fejlesztői Dokumentáció

## Projekt áttekintés

Az UGKettlebellPro egy komplexebb webalkalmazás, amely személyi edzők és klienseik számára készült. A következő fő funkcionalitásokat tartalmazza:

1. Felhasználói fiókok kezelése (regisztráció, bejelentkezés)
2. Időpont foglalás és kezelés (edzésekre jelentkezés)
3. Functional Movement Screen (FMS) értékelés
4. Gyakorlat könyvtár
5. Edzésterv készítés és követés
6. Haladás követése

## Architektúra

### Frontend

- **React 18+**: Funkcionális komponensek, hookok
- **TypeScript**: Típusbiztonságért
- **Vite**: Gyors fejlesztői szerver és buildhez
- **Tailwind CSS**: Stílushoz
- **React Router**: Navigációhoz
- **Zustand**: Állapotkezeléshez

### Backend

- **Supabase**: 
  - PostgreSQL adatbázis
  - Autentikáció
  - Row Level Security (RLS)
  - Valós idejű adatfrissítés

## Adatfolyam

1. A felhasználók a React frontenden keresztül lépnek kapcsolatba
2. A kérések a Supabase kliens könyvtáron keresztül érkeznek
3. Supabase kezeli a jogosultságokat a Row Level Security segítségével
4. Az adatok PostgreSQL adatbázisban tárolódnak

```
[React Frontend] <---> [Supabase Client] <---> [Supabase Backend] <---> [PostgreSQL DB]
```

## Folder struktúra

- **src/components/**: Újrafelhasználható komponensek
- **src/pages/**: Teljes oldalak, route-okhoz kapcsolva
- **src/contexts/**: React Context-ek (auth, theme, stb.)
- **src/hooks/**: Egyedi React hookok
- **src/lib/**: Üzleti logika, API hívások, segédfüggvények
- **src/utils/**: Általános segédfüggvények és tesztelő eszközök
- **src/config/**: Konfigurációs fájlok (Supabase, Firebase)

## Autentikáció

A rendszer Supabase Auth szolgáltatást használ:

1. Email/jelszó alapú regisztráció és bejelentkezés
2. JWT tokenek kezelése
3. Jogosultságok kezelése (user vs admin)
4. Profil kezelés

## Ismert problémák és megoldásaik

### Adatbázis kapcsolati problémák

Korábban voltak problémák a Row Level Security policy-k rekurzív definíciói miatt. Ezeket javítottuk migrációs szkriptekkel. Részletes információ a `docs/database_fixes.md` fájlban található.

## Deployment

Az alkalmazás Vercel platformra van tervezve deployolásra:

1. Build: `npm run build`
2. A létrejövő `dist` mappa tartalmaz minden szükséges fájlt
3. Supabase production környezet szükséges

## Tesztelés

1. **Adatbázis kapcsolat**: `npm run validate:db`
2. **Supabase hitelesítés**: `npm run test:supabase`

## Továbbfejlesztési lehetőségek

1. Mobilalkalmazás React Native-vel
2. Bővített analitikai lehetőségek
3. Offline mód bevezetése
4. Fizetési rendszer integrálása
5. Automatizált e-mail értesítések
