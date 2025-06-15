# Felhasználói jogosultságok és hozzáférés kezelése

Ez a dokumentum leírja a Kettlebell Pro alkalmazás felhasználói jogosultság-kezelésével kapcsolatos problémákat és azok megoldását.

## Ismert problémák

1. **Jogosultságkezelési hibák**: Az alkalmazás átirányít a dashboard-ra, amikor az időpontfoglalási funkciókhoz próbálsz hozzáférni, még akkor is, ha a felhasználónak kellene hogy legyen hozzáférése.

2. **RPC függvények hiánya**: A felhasználók szerepkörének ellenőrzéséhez szükséges RPC függvények hiányoznak az adatbázisból.

3. **Inkonzisztens adatok**: A `profiles` és a `users` táblákban tárolt szerepkörök nem mindig egyeznek meg.

4. **Hibás szerepkör beállítás**: A `profiles` táblában az `admin` szerepkör szükséges az időpontkezelő oldalhoz való hozzáféréshez.

## Megoldások

### 1. Minden felhasználó adminná tétele (gyors megoldás)

Ha sürgősen hozzá kell férned a rendszerhez, a leggyorsabb megoldás minden felhasználót adminná tenni:

```bash
chmod +x fix-all-roles.sh
./fix-all-roles.sh
```

Majd futtasd a generált SQL-t a Supabase adatbázisban. **Figyelem**: Ez minden felhasználót adminná tesz!

### 2. Konkrét felhasználó adminná tétele

Egy konkrét felhasználó adminná tétele:

```bash
chmod +x set-admin-role.sh
./set-admin-role.sh your-user@example.com
```

Majd futtasd a generált SQL-t a Supabase adatbázisban.

### 3. RPC függvények hozzáadása

A következő Postgres függvényeket kell hozzáadni az adatbázishoz:

- `get_user_role(user_id)`: Visszaadja egy felhasználó szerepkörét (először a profiles, majd a users táblából)
- `get_current_user_role()`: Visszaadja a jelenlegi felhasználó szerepkörét
- `is_admin(user_id)`: Ellenőrzi, hogy egy felhasználó admin-e
- `is_current_user_admin()`: Ellenőrzi, hogy a jelenlegi felhasználó admin-e

Használd a mellékelt `fix-role-functions.sh` szkriptet ezek hozzáadásához:

```bash
chmod +x fix-role-functions.sh
./fix-role-functions.sh
```

### 4. Felhasználói profilok szinkronizálása

Ha a szerepkörök inkonzisztensek a `profiles` és a `users` táblák között, ezt az SQL futtatásával javíthatod:

```sql
-- Szinkronizáljuk a szerepköröket a users és profiles táblák között
UPDATE profiles p
SET role = u.role
FROM users u
WHERE p.id = u.id AND p.role != u.role;

UPDATE users u
SET role = p.role
FROM profiles p
WHERE u.id = p.id AND u.role != p.role;
```

### 5. Hibakeresés

Az alkalmazásban található egy ideiglenes `RoleDebug` komponens az időpontfoglalási oldalon, amely segít azonosítani a szerepkör-kezelési problémákat. Ez megmutatja:

- A felhasználó azonosítóját
- A közvetlen szerepkört a profiles táblából
- Az RPC funkcióból származó szerepkört
- Az admin státuszt
- A profiles és users táblák adatait

Ezt a komponenst a fejlesztés során használd, éles környezetben távolítsd el.

### 6. Tipikus megoldások a jogosultság-kezelési hibákra

Ha továbbra is problémáid vannak a hozzáféréssel:

1. **Ellenőrizd, hogy a felhasználónak van-e profilja**: Néha a regisztráció során nem jön létre megfelelően a profil.

2. **Ellenőrizd mindkét táblát**:

   ```sql
   SELECT * FROM profiles WHERE id = 'your-user-id';
   SELECT * FROM users WHERE id = 'your-user-id';
   ```

3. **Állítsd be a szerepkört manuálisan**: Ha szükséges, manuálisan állítsd be az admin szerepkört:

   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
   UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
   ```

4. **Tisztítsd a böngésző gyorsítótárát** és indítsd újra az alkalmazást a változtatások érvénybe léptetéséhez.
