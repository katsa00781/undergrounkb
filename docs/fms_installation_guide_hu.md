# FMS Rendszer Telepítési Útmutató

Ez az útmutató segít az FMS (Functional Movement Screen) rendszer telepítésében a Kettlebell Pro alkalmazáshoz.

## 1. Adatbázis tábla létrehozása

Az FMS funkció használatához létre kell hozni egy speciális táblát a Supabase adatbázisban. Ezt az alábbi módon teheted meg:

### 1.1 SQL szkript futtatása a Supabase SQL Editorban

1. Jelentkezz be a Supabase fiókodba és nyisd meg a projektet
2. Navigálj az "SQL Editor" részhez a bal oldali menüben
3. Hozz létre egy új lekérdezést a "New query" gombra kattintva
4. Másold be az alábbi SQL szkriptet a `create-fms-table.sql` fájlból:

```sql
-- FMS assessments table creation script (compatible with direct SQL execution)
-- Use this script in the Supabase SQL Editor to create the FMS assessments table

-- Ensure that the uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, check if the table exists and drop it if required
DROP TABLE IF EXISTS public.fms_assessments CASCADE;

-- Create FMS assessments table
CREATE TABLE public.fms_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  deep_squat SMALLINT NOT NULL CHECK (deep_squat BETWEEN 0 AND 3),
  hurdle_step SMALLINT NOT NULL CHECK (hurdle_step BETWEEN 0 AND 3),
  inline_lunge SMALLINT NOT NULL CHECK (inline_lunge BETWEEN 0 AND 3),
  shoulder_mobility SMALLINT NOT NULL CHECK (shoulder_mobility BETWEEN 0 AND 3),
  active_straight_leg_raise SMALLINT NOT NULL CHECK (active_straight_leg_raise BETWEEN 0 AND 3),
  trunk_stability_pushup SMALLINT NOT NULL CHECK (trunk_stability_pushup BETWEEN 0 AND 3),
  rotary_stability SMALLINT NOT NULL CHECK (rotary_stability BETWEEN 0 AND 3),
  total_score SMALLINT GENERATED ALWAYS AS (
    deep_squat + hurdle_step + inline_lunge + shoulder_mobility + 
    active_straight_leg_raise + trunk_stability_pushup + rotary_stability
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS fms_assessments_user_id_idx ON public.fms_assessments (user_id);
CREATE INDEX IF NOT EXISTS fms_assessments_date_idx ON public.fms_assessments (date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own assessments" ON public.fms_assessments;
    DROP POLICY IF EXISTS "Users can insert their own assessments" ON public.fms_assessments;
    DROP POLICY IF EXISTS "Users can update their own assessments" ON public.fms_assessments;
    DROP POLICY IF EXISTS "Users can delete their own assessments" ON public.fms_assessments;
    DROP POLICY IF EXISTS "Service role has full access" ON public.fms_assessments;

    -- Re-create policies
    CREATE POLICY "Users can view their own assessments" 
      ON public.fms_assessments FOR SELECT 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own assessments" 
      ON public.fms_assessments FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own assessments" 
      ON public.fms_assessments FOR UPDATE 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own assessments" 
      ON public.fms_assessments FOR DELETE 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role has full access" 
      ON public.fms_assessments FOR ALL 
      USING (auth.jwt() ->> 'role' = 'service_role');

END$$;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_fms_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_fms_assessments_updated_at ON public.fms_assessments;
CREATE TRIGGER update_fms_assessments_updated_at
BEFORE UPDATE ON public.fms_assessments
FOR EACH ROW
EXECUTE PROCEDURE update_fms_modified_column();

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fms_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fms_assessments TO service_role;
```

5. Kattints a "Run" gombra a szkript futtatásához
6. Ellenőrizd, hogy sikeres volt-e a futtatás (nem jelenik meg hibaüzenet)

### 1.2 A tábla ellenőrzése

A futtatás után ellenőrizd, hogy a tábla megfelelően létrejött-e:

1. Navigálj a "Table Editor" részhez a bal oldali menüben
2. Keresd meg az `fms_assessments` táblát a listában
3. Ellenőrizd, hogy a tábla tartalmazza az összes szükséges oszlopot:
   - `id`
   - `user_id`
   - `date`
   - `deep_squat`
   - `hurdle_step`
   - `inline_lunge`
   - `shoulder_mobility`
   - `active_straight_leg_raise`
   - `trunk_stability_pushup`
   - `rotary_stability`
   - `total_score`
   - `notes`
   - `created_at`
   - `updated_at`

## 2. Az alkalmazás tesztelése

A tábla létrehozása után teszteld az FMS funkciót az alkalmazásban:

1. Nyisd meg az alkalmazást
2. Navigálj az FMS Értékelés oldalra
3. Válassz ki egy felhasználót a legördülő menüből
4. Próbálj meg egy komplett értékelést kitölteni és elmenteni

## 3. Hibaelhárítás

Ha problémákat tapasztalsz, ellenőrizd a következőket:

### 3.1 Adatbázis jogosultságok

Ellenőrizd, hogy a megfelelő jogosultságok be vannak-e állítva:

1. Navigálj az "Authentication" → "Policies" részhez
2. Ellenőrizd, hogy léteznek-e a megfelelő szabályok az `fms_assessments` táblához

### 3.2 Hibaüzenetek ellenőrzése

Ha hibát tapasztalsz, nézd meg a böngésző konzolját (F12 gomb) a részletesebb hibaüzenetekért.

#### Gyakori hibák és megoldásaik

- **"relation fms_assessments_id_seq does not exist"**: Ezt a hibát az okozza, ha a rendszer egy nemlétező szekvenciát próbál használni. A javított telepítő szkript tartalmazza a megoldást, de ha mégis előfordul, győződj meg róla, hogy:
  1. A `uuid-ossp` kiterjesztés telepítve van
  2. Az `id` mező típusa `UUID` és az alapértelmezett értéke `uuid_generate_v4()`
  3. Ha a hiba továbbra is fennáll, próbáld meg törölni a táblát (`DROP TABLE IF EXISTS public.fms_assessments CASCADE;`) és újra létrehozni

### 3.3 Kapcsolat ellenőrzése

Győződj meg róla, hogy az alkalmazás megfelelően csatlakozik a Supabase-hez:

1. Ellenőrizd a `.env` vagy `config` fájlokat, hogy a megfelelő Supabase URL és API kulcs van-e beállítva

## 4. FMS Értékelés Használata

Az FMS (Functional Movement Screen) egy mozgásminta értékelő rendszer, amely hét alapvető mozgást értékel 0-3-as skálán.

### 4.1 Pontozási rendszer

- **0**: Fájdalom a mozgás közben
- **1**: Nem tudja végrehajtani a mozgásmintát
- **2**: Képes végrehajtani a mozgást, de kompenzációval
- **3**: Tökéletes forma, kompenzáció nélkül

### 4.2 Összes pontszám értelmezése

- **14-21**: Jó funkcionális mozgás
- **10-13**: Elfogadható mozgásminták, célzott korrekciókból előnyt szerezhet
- **<10**: Gyenge mozgásminták, magas sérülési kockázat, korrekciós stratégiák szükségesek
