-- FMS: oldalankénti (bal/jobb) nyers pontszámok + clearing (fájdalom) tesztek
--
-- Az FMS protokollban 5 teszt oldalanként pontozódik (akadálylépés, inline
-- kitörés, vállmobilitás, aktív nyújtott lábemelés, rotációs stabilitás), és a
-- beszámított pont a *gyengébb* oldal pontja. A meglévő 7 pontszám-oszlop
-- marad a beszámított pont helye — a `total_score` generált oszlop erre épül,
-- így a riport, a dashboard és a korrekciós logika változatlanul működik. Az új
-- `_left` / `_right` oszlopok a nyers oldalankénti értéket őrzik meg, hogy az
-- aszimmetria látszódjon (a két oldal eltérése önmagában korrekciós indok).
--
-- A 3 clearing teszt (váll impingement, gerinc-extenzió, gerinc-flexió)
-- fájdalom esetén a hozzá tartozó teszt pontszámát 0-ra viszi. Ezek az
-- oszlopok a produkciós adatbázisban már léteznek, de migrációs fájl eddig nem
-- rögzítette őket — ezért itt IF NOT EXISTS-szel deklaráljuk őket is.
--
-- Az oldalankénti oszlopok szándékosan NULL-ozhatók: a migráció előtt felvett
-- felméréseknél nincs oldalankénti adat, és nem találjuk ki visszamenőleg
-- (a beszámított pontból nem következik, melyik oldal volt a gyengébb).

ALTER TABLE public.fms_assessments
  ADD COLUMN IF NOT EXISTS hurdle_step_left SMALLINT,
  ADD COLUMN IF NOT EXISTS hurdle_step_right SMALLINT,
  ADD COLUMN IF NOT EXISTS inline_lunge_left SMALLINT,
  ADD COLUMN IF NOT EXISTS inline_lunge_right SMALLINT,
  ADD COLUMN IF NOT EXISTS shoulder_mobility_left SMALLINT,
  ADD COLUMN IF NOT EXISTS shoulder_mobility_right SMALLINT,
  ADD COLUMN IF NOT EXISTS active_straight_leg_raise_left SMALLINT,
  ADD COLUMN IF NOT EXISTS active_straight_leg_raise_right SMALLINT,
  ADD COLUMN IF NOT EXISTS rotary_stability_left SMALLINT,
  ADD COLUMN IF NOT EXISTS rotary_stability_right SMALLINT;

-- Clearing tesztek: fájdalom = true. NOT NULL + default false, mert a
-- "nem jelentkezett fájdalom" a biztonságos alapértelmezés, és a régi sorokra
-- is ez igaz (0 pont hiányában nem volt fájdalom).
ALTER TABLE public.fms_assessments
  ADD COLUMN IF NOT EXISTS sm_clearing BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tspu_clearing BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rs_clearing BOOLEAN NOT NULL DEFAULT false;

-- 0–3 tartomány minden oldalankénti oszlopra. Külön DO blokk, mert a
-- CHECK constraintre nincs IF NOT EXISTS a PG 15-ben.
DO $$
DECLARE
  side_column TEXT;
BEGIN
  FOREACH side_column IN ARRAY ARRAY[
    'hurdle_step_left', 'hurdle_step_right',
    'inline_lunge_left', 'inline_lunge_right',
    'shoulder_mobility_left', 'shoulder_mobility_right',
    'active_straight_leg_raise_left', 'active_straight_leg_raise_right',
    'rotary_stability_left', 'rotary_stability_right'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.fms_assessments'::regclass
        AND conname = 'fms_assessments_' || side_column || '_check'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.fms_assessments ADD CONSTRAINT %I CHECK (%I IS NULL OR %I BETWEEN 0 AND 3)',
        'fms_assessments_' || side_column || '_check', side_column, side_column
      );
    END IF;
  END LOOP;
END
$$;

COMMENT ON COLUMN public.fms_assessments.hurdle_step IS
  'Beszámított pont: a gyengébb oldal (min(hurdle_step_left, hurdle_step_right)).';
COMMENT ON COLUMN public.fms_assessments.shoulder_mobility IS
  'Beszámított pont: min(bal, jobb), pozitív sm_clearing esetén 0.';
COMMENT ON COLUMN public.fms_assessments.trunk_stability_pushup IS
  'Beszámított pont; pozitív tspu_clearing (gerinc-extenziós fájdalomteszt) esetén 0.';
COMMENT ON COLUMN public.fms_assessments.rotary_stability IS
  'Beszámított pont: min(bal, jobb), pozitív rs_clearing esetén 0.';
COMMENT ON COLUMN public.fms_assessments.sm_clearing IS
  'Váll impingement clearing teszt: true = fájdalom → shoulder_mobility = 0.';
COMMENT ON COLUMN public.fms_assessments.tspu_clearing IS
  'Gerinc-extenziós (press-up) clearing teszt: true = fájdalom → trunk_stability_pushup = 0.';
COMMENT ON COLUMN public.fms_assessments.rs_clearing IS
  'Gerinc-flexiós (posterior rocking) clearing teszt: true = fájdalom → rotary_stability = 0.';
