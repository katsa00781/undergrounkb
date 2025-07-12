# 🎯 Meghívó Rendszer Telepítési Útmutató

## 1. Lépés: Database Schema Frissítés

### A. Enum javítás (KÖTELEZŐ ELSŐ!)
Másold be a `step1-ultra-minimal.sql` tartalmát a **Supabase Dashboard > SQL Editor**-be és futtasd le:

```sql
-- 🔧 ULTRA MINIMÁLIS ENUM JAVÍTÁS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'disabled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'disabled';
        RAISE NOTICE 'SUCCESS: disabled value added to user_role enum';
    ELSE
        RAISE NOTICE 'INFO: disabled value already exists in user_role enum';
    END IF;
END $$;
```

### B. Admin Funkciók Helyreállítása
Másold be a `step2-clean-functions.sql` tartalmát és futtasd le a Supabase-ben.

### C. Meghívó Rendszer Telepítése
Másold be a `create-invite-system.sql` tartalmát és futtasd le a Supabase-ben.

## 2. Lépés: Frontend Tesztelés

### A. Admin oldal ellenőrzése
1. Navigálj a `/users` oldalra (admin jogosultság szükséges)
2. Kattints az "Invite User" gombra
3. Töltsd ki az email címet és válassz szerepkört
4. Kattints "Send Invite"-ra

### B. Meghívó elfogadása
1. Az admin oldal generál egy meghívó linket
2. Másold ki a linket (vagy küldd el emailben)
3. Nyisd meg a linket egy inkognitó ablakban
4. Regisztrálj a meghívóval

## 3. Lépés: Funkciók

### ✅ Működő funkciók:
- ✅ Admin meghívó létrehozás
- ✅ Meghívó link generálás  
- ✅ Meghívó elfogadó oldal
- ✅ Automatikus profil létrehozás regisztrációkor
- ✅ Meghívó admin kezelés (törlés, listázás)
- ✅ Lejárat kezelés (7 nap)
- ✅ Egyszeri használat biztosítása

### 🔄 Fejlesztendő:
- 📧 Email küldés automatizálása
- 🎨 UI/UX finomítások
- 📊 Statisztikák és riportok

## 4. Hibaelhárítás

### Enum hibák:
```
invalid input value for enum user_role: 'disabled'
```
**Megoldás**: Futtasd le a `step1-ultra-minimal.sql` scriptet.

### Permission hibák:
```
permission denied for table profiles
```
**Megoldás**: Futtasd le a `step2-clean-functions.sql` scriptet.

### Meghívó hibák:
```
table "pending_invites" does not exist
```
**Megoldás**: Futtasd le a `create-invite-system.sql` scriptet.

## 5. Használat

### Admin meghívó küldés:
1. `/users` oldal → "Invite User"
2. Email cím + szerepkör megadása
3. Link másolása vagy email küldés

### Felhasználó regisztráció:
1. Meghívó link megnyitása
2. Jelszó megadása
3. Automatikus bejelentkezés

---

🎉 **Gratulálunk!** A meghívó rendszer most már teljes mértékben működőképes!
