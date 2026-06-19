-- Polar Flow integráció: token tárolás + importált cardio edzések
-- A polar_connections érzékeny tokent tárol, ezért a klienst NEM engedjük olvasni;
-- az Edge Function service-role kulccsal éri el. A kliens csak a get_polar_status()
-- SECURITY DEFINER függvényen keresztül kérdezi le a kapcsolat állapotát.

-- 1) Polar kapcsolat (token, polar user id) ------------------------------------
CREATE TABLE IF NOT EXISTS polar_connections (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_user_id TEXT,
  access_token TEXT NOT NULL,
  member_id TEXT,
  last_transaction_id TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMPTZ
);

ALTER TABLE polar_connections ENABLE ROW LEVEL SECURITY;

-- A felhasználó leválaszthatja a saját kapcsolatát (a tokent nem olvassa ki).
CREATE POLICY "Users can delete their own polar connection"
  ON polar_connections FOR DELETE
  USING (auth.uid() = user_id);
-- Szándékosan NINCS SELECT/INSERT/UPDATE policy: ezeket csak a service-role
-- (Edge Function) végezheti, ami megkerüli az RLS-t.

-- 2) Importált cardio edzések --------------------------------------------------
CREATE TABLE IF NOT EXISTS cardio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_exercise_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'polar',
  start_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  sport TEXT,
  calories INTEGER,
  hr_avg INTEGER,
  hr_max INTEGER,
  training_load NUMERIC,
  hr_zones JSONB,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cardio_sessions ENABLE ROW LEVEL SECURITY;

-- A felhasználó csak a saját cardio edzéseit olvashatja; írást a service-role végez.
CREATE POLICY "Users can read their own cardio sessions"
  ON cardio_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_cardio_sessions_user_id ON cardio_sessions(user_id);
CREATE INDEX idx_cardio_sessions_start_time ON cardio_sessions(start_time);

-- 3) Kapcsolat-állapot lekérdező függvény (token nélkül) -----------------------
CREATE OR REPLACE FUNCTION get_polar_status()
RETURNS TABLE (connected BOOLEAN, connected_at TIMESTAMPTZ, last_sync_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    TRUE AS connected,
    pc.connected_at,
    pc.last_sync_at
  FROM polar_connections pc
  WHERE pc.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_polar_status() TO authenticated;
