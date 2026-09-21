import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useNutritionGoals } from '../hooks/useNutritionGoals';
import { getLatestWeightMeasurement } from '../lib/weights';
import { upsertNutritionGoals } from '../lib/nutritionGoals';
import {
  ACTIVITY_LEVELS,
  GOAL_TYPES,
  ageFromBirthdate,
  applyGoal,
  macroTargets,
  mifflinStJeor,
  missingBmrInputs,
  parseGender,
  tdeeFromActivity,
  type GoalType,
} from '../lib/nutritionTargets';

export default function NutritionTargets() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { settings, reload } = useNutritionGoals();
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [goal, setGoal] = useState<GoalType>('maintain');
  const [activityFactor, setActivityFactor] = useState(1.4);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setGoal((settings.goal_type as GoalType) ?? 'maintain');
    setActivityFactor(Number(settings.activity_factor) || 1.4);
  }, [settings]);

  useEffect(() => {
    if (!user?.id) return;
    getLatestWeightMeasurement(user.id)
      .then((m) => setWeightKg(m?.weight ?? profile?.weight ?? null))
      .catch((err) => console.error('Nem sikerült betölteni a legfrissebb testsúlyt:', err));
  }, [user?.id, profile?.weight]);

  const heightCm = profile?.height ?? null;
  const age = ageFromBirthdate(profile?.birthdate);
  const gender = parseGender(profile?.gender);

  const bmrInput = { weightKg, heightCm, age, gender };
  const bmr = mifflinStJeor(bmrInput);
  const missing = missingBmrInputs(bmrInput);

  const tdee = useMemo(() => (bmr != null ? tdeeFromActivity(bmr, activityFactor) : null), [bmr, activityFactor]);
  const kcalGoal = tdee != null ? applyGoal(tdee, goal) : null;

  const macros = useMemo(() => {
    if (kcalGoal == null || !weightKg || !settings) return null;
    return macroTargets(kcalGoal, weightKg, settings.protein_goal_min, settings.protein_goal_max);
  }, [kcalGoal, weightKg, settings]);

  async function handleSave() {
    if (!user?.id || kcalGoal == null || !macros) return;
    try {
      setSaving(true);
      await upsertNutritionGoals(user.id, {
        kcal_goal: kcalGoal,
        carbs_goal_g: macros.carbs,
        fat_goal_g: macros.fat,
        activity_factor: activityFactor,
        goal_type: goal,
      });
      await reload();
      toast.success('Célok elmentve');
    } catch (error) {
      console.error('Failed to save nutrition goals:', error);
      toast.error('Nem sikerült menteni a célokat');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Napi célok</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Kalória- és makrócél a testsúlyból és aktivitásból</p>
      </div>

      {missing.length > 0 ? (
        <div className="card border-warning-300 bg-warning-50 dark:border-warning-700 dark:bg-warning-900/20">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning-600 dark:text-warning-400" />
            <p className="font-semibold text-gray-800 dark:text-gray-100">Hiányzó adat</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">A számításhoz kell még: {missing.join(', ')}.</p>
          <Link to="/profile" className="btn btn-primary mt-3 inline-flex">
            Profil kitöltése
          </Link>
        </div>
      ) : null}

      {bmr != null ? (
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Alapanyagcsere (Mifflin–St Jeor)</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{bmr} kcal</p>
          <p className="mt-1 text-sm text-gray-400">
            {weightKg} kg · {heightCm} cm · {age} év · {gender === 'male' ? 'férfi' : 'nő'}
          </p>
        </div>
      ) : null}

      {bmr != null ? (
        <div className="card">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Aktivitás</p>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => {
              const active = Math.abs(activityFactor - level.factor) < 0.001;
              return (
                <button
                  key={level.factor}
                  type="button"
                  onClick={() => setActivityFactor(level.factor)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors ${
                    active ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{level.label}</p>
                    <p className="text-xs text-gray-400">{level.hint}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-500">×{level.factor}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {tdee != null ? (
        <div className="card">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Cél</p>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_TYPES.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGoal(g.key)}
                className={`rounded-xl py-3 text-center transition-colors ${
                  goal === g.key ? 'bg-primary-600 text-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <p className="text-sm font-semibold">{g.label}</p>
                <p className={`text-xs ${goal === g.key ? 'opacity-80' : 'text-gray-400'}`}>{g.hint}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {kcalGoal != null && macros ? (
        <div className="card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Napi keret</p>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{kcalGoal} kcal</p>
          <p className="mt-1 text-sm text-gray-400">Teljes napi felhasználás: {tdee} kcal</p>

          <div className="mt-4 space-y-2">
            <ResultRow label="Fehérje" value={`${macros.protein} g`} hint="a beállított sávból" />
            <ResultRow label="Zsír" value={`${macros.fat} g`} hint="min. 0,8 g / testsúly kg" />
            <ResultRow label="Szénhidrát" value={`${macros.carbs} g`} hint="a maradék keret" />
          </div>

          <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary mt-4 w-full">
            {saving ? 'Mentés...' : 'Célok mentése'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ResultRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 py-2 first:border-t-0 dark:border-gray-700">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
      <p className="font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
