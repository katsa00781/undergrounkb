# Appointments Table Fix

## Probléma

Az időpontfoglalási rendszer (időpontok kezelése oldal) nem működik megfelelően, mert a kód az `appointment_bookings` táblát használja, de az adatbázisban `appointments_participants` néven lett létrehozva a tábla.

## Megoldás

Létrehoztunk egy új migrációs fájlt (`20250615000001_fix_appointments_tables.sql`), amely:

1. Létrehozza az `appointment_bookings` táblát a megfelelő mezőkkel
2. Átmásolja az adatokat a régi `appointments_participants` táblából, ha az létezik
3. Létrehozza a szükséges indexeket és jogosultságokat
4. Létrehozza a `decrement_participants` nevű RPC függvényt a foglalások törléséhez

## Telepítés

A javítás telepítéséhez:

1. Futtasd a `./fix-appointments-tables.sh` scriptet:

   ```bash
   ./fix-appointments-tables.sh
   ```

2. Indítsd újra az alkalmazást

## Ellenőrzés

A javítás ellenőrzéséhez:

1. Nyisd meg az alkalmazást
2. Navigálj az "Időpontok" oldalra
3. Ellenőrizd, hogy az oldal megfelelően betöltődik

Alternatív módon futtathatod a következő ellenőrző scriptet:

```bash
npx ts-node ./scripts/check-appointment-bookings.ts
```

## Technikai részletek

- Az új tábla mezői:
  - id: UUID (elsődleges kulcs)
  - appointment_id: UUID (külső kulcs az appointments táblához)
  - user_id: UUID (külső kulcs a users táblához)
  - status: TEXT ('confirmed' vagy 'cancelled')
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP

- A migrációs fájl új oszlopot is hozzáad: status mező a foglalási állapot követéséhez
- A tábla elnevezése konzisztens a kóddal, ahol mindenhol az `appointment_bookings` nevet használjuk
