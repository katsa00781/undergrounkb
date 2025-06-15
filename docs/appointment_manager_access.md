# Időpont Kezelő Rendszer - Admin Hozzáférés Javítása

Ez a dokumentum leírja az időpontkezelő rendszer (`/appointments/manage`) admin hozzáféréssel kapcsolatos problémáit és azok megoldásait.

## Probléma leírása

Az alkalmazásban két különböző időpontokkal kapcsolatos oldal van:

1. **`/appointments`**: Ez az oldal minden felhasználó számára elérhető, és lehetővé teszi számukra az elérhető időpontok megtekintését és foglalását.

2. **`/appointments/manage`**: Ez az oldal kizárólag admin jogosultsággal rendelkező felhasználók számára van fenntartva, és lehetővé teszi az időpontok létrehozását és kezelését.

A probléma az, hogy az admin felhasználók nem férnek hozzá a `/appointments/manage` oldalhoz, helyette átirányítja őket a dashboardra, annak ellenére, hogy admin jogosultsággal kellene rendelkezniük.

## Az alkalmazás működése

A hozzáférési jogosultságok az alábbiak szerint vannak beállítva:

1. A `routes.tsx` fájlban az útvonalak megfelelően vannak konfigurálva:
   - Az `/appointments` minden felhasználó számára elérhető
   - Az `/appointments/manage` csak admin felhasználók számára elérhető

2. A `ProtectedRoute` komponens ellenőrzi a felhasználó szerepkörét:

   ```typescript
   if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
     return <Navigate to="/dashboard" replace />;
   }
   ```

3. A felhasználói szerepköröket az adatbázis a `profiles` és a `users` táblákban tárolja.

## Megoldások

### 1. Admin szerepkör beállítása egy felhasználó számára

Használd a `set-admin-role.sh` szkriptet, hogy a megfelelő felhasználóhoz admin jogosultságot rendelj:

```bash
./set-admin-role.sh your-email@example.com
```

Majd futtasd a generált SQL-t a Supabase adatbázisban.

### 2. Szerepkörök ellenőrzése

A `test-admin-access.sh` szkript segítségével ellenőrizheted egy felhasználó admin szerepkörét:

```bash
./test-admin-access.sh your-email@example.com
```

Ez a szkript megvizsgálja:

- Létezik-e a felhasználó a `profiles` táblában
- A felhasználónak 'admin' szerepköre van-e
- Van-e inkonzisztencia a `profiles` és `users` táblák között
- Léteznek-e a szükséges RPC függvények

### 3. Hiányzó RPC függvények létrehozása

Ha a szerepkör-ellenőrzési folyamat RPC függvényeket használ, de azok hiányoznak, futtasd a `fix-role-functions.sh` szkriptet:

```bash
./fix-role-functions.sh
```

### 4. Bejelentkezés újra

A szerepköröket az alkalmazás általában csak bejelentkezéskor ellenőrzi és tölti be. A változtatások érvényesítéséhez:

1. Jelentkezz ki az alkalmazásból
2. Töröld a böngésző gyorsítótárát (localStorage)
3. Jelentkezz be újra

### 5. Ideiglenes javítás az alkalmazás kódjában

Ha a fenti megoldások nem működnek, ideiglenes megoldásként módosítható az útvonalak konfigurációja vagy a jogosultság-ellenőrző kód.

## Ellenőrzőlista a hibaelhárításhoz

1. Ellenőrizd, hogy a felhasználó szerepköre 'admin'-e a `profiles` táblában
2. Ellenőrizd, hogy van-e inkonzisztencia a `profiles` és `users` táblák között
3. Ellenőrizd, hogy a szükséges RPC függvények léteznek-e
4. Próbálj meg újra bejelentkezni a változtatások után
5. Ellenőrizd a böngésző konzolját további hibaüzenetekért

## Ajánlott menete a javításnak

1. Futtasd a `test-admin-access.sh` szkriptet
2. A problémáktól függően futtasd a `set-admin-role.sh` vagy a `fix-role-functions.sh` szkriptet
3. Jelentkezz ki és jelentkezz be újra
4. Ellenőrizd, hogy most már eléred-e az `/appointments/manage` oldalt
