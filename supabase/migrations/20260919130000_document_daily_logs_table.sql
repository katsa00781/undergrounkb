-- A daily_logs tábla a mobil appban jött létre (napi napló: tápanyag-checklist +
-- Apple HealthKit szinkron: lépésszám, alvás, nyugalmi pulzus, HRV), de eddig nem
-- volt migrációs fájlja ebben a repóban. Ez a migráció csak DOKUMENTÁLJA a már élesben
-- létező sémát (IF NOT EXISTS mindenhol) — a webes oldal ezen a táblán keresztül
-- jeleníti meg az Apple Health adatokat, a Polar helyett.

CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  protein_meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  steps INTEGER,
  is_rest_day BOOLEAN NOT NULL DEFAULT false,
  active_energy_kcal INTEGER,
  sleep_score SMALLINT,
  sleep_minutes INTEGER,
  sleep_in_bed_minutes INTEGER,
  sleep_deep_minutes INTEGER,
  sleep_rem_minutes INTEGER,
  sleep_light_minutes INTEGER,
  sleep_awake_minutes INTEGER,
  sleep_awakenings SMALLINT,
  sleep_efficiency NUMERIC,
  sleep_start TIMESTAMPTZ,
  sleep_end TIMESTAMPTZ,
  stress_level SMALLINT CHECK (stress_level >= 1 AND stress_level <= 5),
  energy_level SMALLINT CHECK (energy_level >= 1 AND energy_level <= 5),
  shift_key TEXT,
  resting_heart_rate SMALLINT,
  hrv_sdnn NUMERIC,
  sleep_wake_stage TEXT,
  CONSTRAINT daily_logs_user_id_date_key UNIQUE (user_id, date)
);

COMMENT ON COLUMN daily_logs.active_energy_kcal IS 'Napi aktív kalória (kcal), Apple HealthKit szinkronból vagy kézi bevitelből';
COMMENT ON COLUMN daily_logs.sleep_score IS 'Számított alvási pontszám 0–100 (Apple HealthKit alvásfázisokból, saját modell)';
COMMENT ON COLUMN daily_logs.sleep_minutes IS 'Összes alvásidő percben (core+deep+rem+unspecified)';
COMMENT ON COLUMN daily_logs.sleep_in_bed_minutes IS 'Ágyban töltött idő percben (alvási session teljes hossza)';
COMMENT ON COLUMN daily_logs.sleep_efficiency IS 'Alvási hatékonyság: alvásidő / ágyban töltött idő * 100';
COMMENT ON COLUMN daily_logs.stress_level IS 'Napi szubjektiv stresszszint 1-5 (1 = nyugodt, 5 = nagyon feszult)';
COMMENT ON COLUMN daily_logs.energy_level IS 'Napi szubjektiv energiaszint 1-5 (1 = kimerult, 5 = energikus)';
COMMENT ON COLUMN daily_logs.shift_key IS 'A nap muszak-kontextusa: reggeles / delutanos / ejszakas / pihenonap';
COMMENT ON COLUMN daily_logs.resting_heart_rate IS 'Napi nyugalmi pulzusszám (bpm), Apple HealthKit napi átlag';
COMMENT ON COLUMN daily_logs.hrv_sdnn IS 'Szívfrekvencia-variabilitás SDNN (ms), Apple HealthKit napi átlag';
COMMENT ON COLUMN daily_logs.sleep_wake_stage IS 'Az ébredés előtti utolsó ~15 perc domináns alvásfázisa: deep / rem / core / asleep / awake';

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_logs' AND policyname = 'Users can view their own daily logs'
  ) THEN
    CREATE POLICY "Users can view their own daily logs"
      ON daily_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_logs' AND policyname = 'Users can insert their own daily logs'
  ) THEN
    CREATE POLICY "Users can insert their own daily logs"
      ON daily_logs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_logs' AND policyname = 'Users can update their own daily logs'
  ) THEN
    CREATE POLICY "Users can update their own daily logs"
      ON daily_logs FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_logs' AND policyname = 'Users can delete their own daily logs'
  ) THEN
    CREATE POLICY "Users can delete their own daily logs"
      ON daily_logs FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
