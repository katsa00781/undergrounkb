# 🔍 MEGHÍVÓ RENDSZER TROUBLESHOOTING

## A homokóra probléma lehetséges okai:

### 1. **SQL funkciók nincsenek telepítve** ⚠️
**Tünet**: `create_user_invite function not found` hiba
**Megoldás**: Futtasd le a következő SQL scripteket a Supabase Dashboard-on:

```sql
-- 1. LÉPÉS: step1-ultra-minimal.sql
-- 2. LÉPÉS: step2-clean-functions.sql  
-- 3. LÉPÉS: create-invite-system.sql
```

### 2. **Nincs admin jogosultság** 🔐
**Tünet**: `Unauthorized: Only admins can create invites`
**Megoldás**: Ellenőrizd a profiles táblában a role mezőt:

```sql
SELECT id, email, role FROM profiles WHERE id = '[YOUR_USER_ID]';
UPDATE profiles SET role = 'admin' WHERE id = '[YOUR_USER_ID]';
```

### 3. **RLS Policy hiba** 🛡️
**Tünet**: `permission denied for table pending_invites`
**Megoldás**: Ellenőrizd a RLS policy-kat:

```sql
SELECT * FROM pg_policies WHERE tablename = 'pending_invites';
```

### 4. **Hálózati timeout** 🌐
**Tünet**: Végtelen loading, timeout error
**Megoldás**: Ellenőrizd a Supabase projekt státuszát

## 🧪 Új debugger funkciók:

### UserManagement oldalon:
1. **"Test Connection" gomb**: Teljes Supabase teszt
2. **Console logs**: Részletes hibaüzenetek
3. **Timeout protection**: 30 másodperces limit
4. **Specifikus hibaüzenetek**: Magyar nyelvű error handling

### Browser console-ban:
- 🚀 "Creating invite" log
- ✅ "Auth check passed" log  
- 📤 "Calling create_user_invite RPC" log
- 📥 "RPC Response" log
- ❌ Részletes error logs

## 📋 Ellenőrzési lépések:

1. **Nyisd meg a UserManagement oldalt** (`/users`)
2. **Kattints a "Test Connection" gombra**
3. **Nézd meg a console output-ot**
4. **Ha teszt sikeres, próbálj meghívót küldeni**
5. **Ha továbbra is homokórázik, check console errors**

## 🆘 Ha még mindig nem működik:

1. **Supabase Dashboard > Project Settings > API**
   - Ellenőrizd az API URL-t és anon key-t
   
2. **Supabase Dashboard > Authentication > Users**
   - Ellenőrizd a felhasználói adatokat
   
3. **Supabase Dashboard > Database > Tables**
   - Ellenőrizd a `profiles` és `pending_invites` táblák létezését
   
4. **Supabase Dashboard > SQL Editor**
   - Futtasd le: `SELECT * FROM profiles WHERE role = 'admin';`
   
5. **Supabase Dashboard > Logs**
   - Nézd meg a real-time logokat

---

**Most próbáld ki a "Test Connection" gombot! 🧪**
