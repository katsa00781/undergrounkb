# Profiles Permission Error Fix - Összefoglaló

## 🚨 Probléma
- **Hiba üzenet**: `403 Forbidden` és `permission denied for table users`
- **Lokáció**: Profile oldal adatmentésénél
- **Kiváltó ok**: A Supabase próbál hozzáférni egy nem létező `users` táblához

## 🔍 Diagnózis
A hiba forrása:
1. **RLS (Row Level Security) policy-k** nem megfelelően vannak beállítva
2. **Foreign key kapcsolat** a `profiles` táblában az `auth.users` táblára hivatkozik
3. A **Supabase client** próbál írni a `users` táblába ahelyett, hogy csak a `profiles` táblát használná

## 💡 Megoldás

### 1. **Azonnali fix - SQL script futtatása**
Futtasd le a **`fix_profiles_permissions.sql`** script-et a Supabase SQL Editor-ben:

```sql
-- RLS policy-k újrakonfigurálása
-- Foreign key kapcsolat javítása  
-- Security Definer function létrehozása
```

### 2. **Kód szintű javítás**
A **`useProfileProvider.ts`** már frissítve lett:
- ✅ **Security Definer function** elsődleges használata
- ✅ **Fallback** direkt tábla frissítésre
- ✅ **Jobb hibakezelés** permission hibákra

### 3. **Ellenőrzés**
A **`check_profiles_table.sql`** script futtatásával ellenőrizheted a javítást.

## 📋 Lépések a megoldáshoz

### 1️⃣ **SQL Fix futtatása**
```bash
# Supabase Dashboard > SQL Editor
# Másold be: fix_profiles_permissions.sql tartalmát
# Kattints: RUN
```

### 2️⃣ **Ellenőrzés**
```bash
# Supabase Dashboard > SQL Editor  
# Másold be: check_profiles_table.sql tartalmát
# Ellenőrizd: minden ✅ zöld-e
```

### 3️⃣ **Tesztelés**
```bash
# Profile oldal megnyitása
# Form kitöltése
# Mentés tesztelése
```

## 🔧 Mi történik a javítás során

### **RLS Policy-k újrakonfigurálása**
```sql
-- Régi policy-k törlése
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Új, biztonságos policy-k
CREATE POLICY "Enable read access for users based on user_id"
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id"  
ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

### **Security Definer Function**
```sql
-- Biztonságos profil frissítő function
CREATE OR REPLACE FUNCTION update_user_profile(
    user_id UUID,
    profile_data JSONB
) RETURNS SETOF public.profiles
SECURITY DEFINER -- Ez a kulcs!
```

### **Foreign Key javítás**
```sql
-- Deferrable constraint a foreign key-re
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
DEFERRABLE INITIALLY DEFERRED;
```

## 🎯 Várt eredmény

### ✅ **Sikeres javítás után**
- Nincs több `403 Forbidden` hiba
- A Profile oldal mentés működik
- Az adatok helyesen mentődnek a `profiles` táblába
- Minden ProfileFormData mező támogatott

### ❌ **Ha még mindig probléma van**
1. Ellenőrizd a **Browser Developer Tools** console-ját
2. Nézd meg a **Supabase Dashboard > Logs** részben a hibákat
3. Futtasd le újra a `fix_profiles_permissions.sql` script-et
4. Ellenőrizd, hogy van-e **aktív felhasználó** bejelentkezve

## 📁 Érintett fájlok

### **SQL Scripts**
- ✅ `fix_profiles_permissions.sql` - **Fő javító script**
- ✅ `check_profiles_table.sql` - Ellenőrző script
- ✅ `create_profiles_table.sql` - Tábla létrehozó script

### **TypeScript kód**
- ✅ `src/hooks/useProfileProvider.ts` - **Frissített mentési logika**
- ✅ `src/types/supabase.ts` - Típus definíciók
- ✅ `src/utils/profileSqlUtils.ts` - SQL utility függvények

### **Dokumentáció**
- ✅ `fix-profiles-permissions.sh` - Útmutató script
- ✅ `PROFILEFORMDATA_SQL_DOCS.md` - Teljes dokumentáció

## 🚀 Következő lépések

1. **Futtasd le a fix script-et** a Supabase-ben
2. **Teszteld a Profile oldalt** - most már működnie kell!
3. **Ellenőrizd az adatokat** a Supabase Table Editor-ben
4. Ha minden rendben, **törölheted a debug log-okat** a console-ból

## 🔒 Biztonsági megjegyzések

- A **RLS policy-k** biztosítják, hogy minden felhasználó csak saját profilját láthatja/módosíthatja
- A **Security Definer function** csak authentikált felhasználók számára elérhető
- A **Foreign key constraint** megőrzi az adatok integritását
- Minden művelet **audit log**-olva van a `updated_at` mezővel

---

**TL;DR**: Futtasd le a `fix_profiles_permissions.sql` script-et a Supabase SQL Editor-ben, és a Profile oldal mentés működni fog! 🎉
