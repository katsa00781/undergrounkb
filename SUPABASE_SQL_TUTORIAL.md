# 🎯 SUPABASE SQL JAVÍTÁS ÚTMUTATÓ

## Mivel nincs helyi `psql` kliens, használd a Supabase Dashboard-ot

### 📋 Lépések:

#### 1. Nyisd meg a Supabase Dashboard-ot
- Menj a [supabase.com](https://supabase.com) oldalra
- Jelentkezz be a fiókodba
- Válaszd ki a projekteded

#### 2. SQL Editor megnyitása
- A bal oldali menüben kattints a **"SQL Editor"** gombra
- Vagy navigálj ide: `https://supabase.com/dashboard/project/[PROJECT_ID]/sql`

#### 3. SQL kód futtatása
- Másolj be a következő fájl tartalmát: `supabase-sql-editor-fix.sql`
- Vagy másold be ezt a kódot:

```sql
CREATE OR REPLACE FUNCTION update_user_profile(
    user_id UUID,
    profile_data JSONB
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() != user_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot update another user profile';
    END IF;
    
    RETURN QUERY
    UPDATE public.profiles
    SET 
        display_name = COALESCE(
            NULLIF((profile_data->>'display_name')::TEXT, ''), 
            display_name
        ),
        full_name = COALESCE(
            NULLIF((profile_data->>'full_name')::TEXT, ''), 
            NULLIF((profile_data->>'display_name')::TEXT, ''),
            display_name,
            full_name
        ),
        height = COALESCE(
            CASE 
                WHEN profile_data ? 'height' AND (profile_data->>'height') != 'null'
                THEN (profile_data->>'height')::INTEGER 
                ELSE NULL 
            END, 
            height
        ),
        weight = COALESCE(
            CASE 
                WHEN profile_data ? 'weight' AND (profile_data->>'weight') != 'null'
                THEN (profile_data->>'weight')::DECIMAL 
                ELSE NULL 
            END, 
            weight
        ),
        birthdate = COALESCE(
            CASE 
                WHEN profile_data ? 'birthdate' AND (profile_data->>'birthdate') != 'null' AND (profile_data->>'birthdate') != ''
                THEN (profile_data->>'birthdate')::DATE 
                ELSE NULL 
            END, 
            birthdate
        ),
        gender = COALESCE(
            NULLIF((profile_data->>'gender')::TEXT, ''), 
            gender
        ),
        fitness_goals = COALESCE(
            CASE 
                WHEN profile_data ? 'fitness_goals' 
                THEN (profile_data->'fitness_goals')::JSONB 
                ELSE NULL 
            END, 
            fitness_goals
        ),
        experience_level = COALESCE(
            NULLIF((profile_data->>'experience_level')::TEXT, ''), 
            experience_level
        ),
        updated_at = NOW()
    WHERE id = user_id
    RETURNING *;
END $$;
```

#### 4. Futtasd le a scriptet
- Kattints a **"Run"** gombra (vagy Ctrl/Cmd + Enter)
- Várj, amíg a végrehajtás befejeződik
- Ellenőrizd, hogy nincs-e hiba üzenet

#### 5. Ellenőrző lekérdezés
Futtasd le ezt is az ellenőrzéshez:
```sql
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    'Function successfully updated' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'update_user_profile';
```

### ✅ Várt eredmény:
```
function_name       | arguments                    | status
-------------------|------------------------------|-------------------------
update_user_profile | user_id uuid, profile_data jsonb | Function successfully updated
```

---

## 🧪 Miután lefuttattad az SQL-t:

### 1. Teszteld a frontend-et:
- Nyisd meg a React alkalmazásod
- Menj a Profile oldalra
- Töltsd ki a **Display Name** mezőt (pl. "Teszt Felhasználó")
- Kattints a **Fitness Goals** checkbox-okra
- Mentsd el a profilt

### 2. Nézd meg a browser console-t:
- Nyisd meg F12 > Console
- Keresd ezeket az üzeneteket:
  ```
  🎯 Fitness Goal clicked: Weight Loss Currently checked: false
  📥 Adding goal: Weight Loss
  🔄 Updated goals array: ["Weight Loss"]
  ```

### 3. Ellenőrizd az adatbázisban:
Supabase SQL Editor-ben:
```sql
SELECT 
    id,
    display_name,
    full_name,
    fitness_goals,
    updated_at
FROM profiles 
WHERE id = auth.uid();
```

---

## 🚨 Ha problémák vannak:

### Permission hiba:
- Ellenőrizd, hogy be vagy-e jelentkezve a Supabase-ben
- Próbáld újra futtatni a teljes `fix_profiles_permissions.sql` script-et

### Function hiba:
- Ellenőrizd a pontosvesszőket
- Győződj meg róla, hogy a `profiles` tábla létezik

### Frontend hiba:
- Ellenőrizd a Network tab-ot (F12)
- Keresd a 403 vagy 500 hibákat
- Nézd meg a console log-okat

---

**🎯 Következő lépés:** Futtasd le az SQL scriptet a Supabase Dashboard-on!
