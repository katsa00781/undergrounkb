# 🔧 ADMIN USER MANAGEMENT JAVÍTÁS - TESZTELÉSI ÚTMUTATÓ

## PROBLÉMA
- Admin felület nem tölti be a felhasználókat
- Enum hiba: "invalid input value for enum user_role: 'disabled'"
- SQL hiba: "unsafe use of new value 'disabled' of enum type user_role"

## MEGOLDÁS LÉPÉSEI

### 1. SQL JAVÍTÁS (SUPABASE DASHBOARD)

1. **Nyisd meg a Supabase Dashboard**
2. **Menj a SQL Editor-be**
3. **Másold be és futtasd le**: `admin-user-management-complete-fix.sql`

```sql
-- A fájl tartalma már tartalmazza:
-- ✅ Enum javítás ('disabled' role hozzáadása)
-- ✅ Admin funkciók (create, delete, restore)
-- ✅ Jogosultságok beállítása
-- ✅ Validációs lekérdezések
```

### 2. FRONTEND ÚJRAINDÍTÁS

1. **Terminálban futtasd**:
```bash
./restart-frontend.sh
```

Vagy manuálisan:
```bash
# Cache törlés
rm -rf node_modules/.cache .next/cache dist

# Dev server újraindítás
npm run dev
```

### 3. TESZTELÉS

#### A. User Management oldal betöltése
1. Böngészőben menj `/admin/users` vagy `/user-management` oldalra
2. **Elvárt eredmény**: A felhasználók listája betöltődik hibák nélkül

#### B. Admin funkciók tesztelése
1. **Új felhasználó létrehozás**:
   - Kattints "Add User" gombra
   - Töltsd ki az email mezőt
   - **Elvárt**: Új felhasználó létrejön

2. **Felhasználó törlése** (soft delete):
   - Kattints "Delete" gombra egy felhasználónál
   - **Elvárt**: Felhasználó role-ja 'disabled'-re változik

3. **Felhasználó visszaállítása**:
   - Disabled felhasználónál kattints "Restore" gombra
   - **Elvárt**: Felhasználó role-ja 'user'-re változik

### 4. HIBAKERESÉS

#### Ha még mindig enum hiba van:
```sql
-- Ellenőrizd az enum értékeket
SELECT unnest(enum_range(NULL::user_role)) AS available_roles;
```

#### Ha a funkciók nem működnek:
```sql
-- Ellenőrizd a funkciókat
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('create_admin_user', 'delete_admin_user', 'restore_admin_user');
```

#### Ha a frontend nem kapcsolódik:
1. Ellenőrizd a `.env` fájlt (Supabase URL és anon key)
2. Hard refresh: `Ctrl+Shift+R` (vagy `Cmd+Shift+R` Mac-en)
3. Dev tools Console-ban nézd a hibákat

### 5. VALIDÁCIÓ

**A javítás sikeres, ha**:
- ✅ User Management oldal betöltődik
- ✅ Felhasználók listája megjelenik
- ✅ Nincsenek enum hibák a Console-ban
- ✅ Admin funkciók (create, delete, restore) működnek
- ✅ 'disabled' role létezik és használható

## DOKUMENTÁCIÓ

- **SQL javítás**: `admin-user-management-complete-fix.sql`
- **Frontend restart**: `restart-frontend.sh`
- **Debug info**: Console-ban nézd a Supabase RPC hívásokat

## BACKUP MEGOLDÁSOK

Ha valami nem működik:
1. Futtasd le újra az SQL script-et
2. Törölj minden cache-t
3. Indítsd újra a dev server-t
4. Hard refresh a böngészőben

---

**Feedback**: Jelezd, ha minden működik vagy ha további hibákat tapasztalsz! 🚀
