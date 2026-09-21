import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import type { Macros } from '../../lib/nutritionTargets';

export type NutritionGoalValues = {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

interface DailyMacroCardProps {
  totals: Macros;
  goals: NutritionGoalValues;
}

export default function DailyMacroCard({ totals, goals }: DailyMacroCardProps) {
  const kcalRemaining = goals.kcal != null ? Math.round(goals.kcal - totals.kcal) : null;

  return (
    <div className="card">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Ma</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(totals.kcal)}
            {goals.kcal != null ? <span className="text-lg font-semibold text-gray-400"> / {goals.kcal} kcal</span> : ' kcal'}
          </p>
          {kcalRemaining != null ? (
            <p className={`mt-0.5 text-sm ${kcalRemaining < 0 ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {kcalRemaining >= 0 ? `${kcalRemaining} kcal maradt` : `${Math.abs(kcalRemaining)} kcal a keret felett`}
            </p>
          ) : (
            <Link to="/nutrition/targets" className="mt-0.5 inline-block text-sm text-primary-600 hover:underline dark:text-primary-400">
              Állíts be napi célt
            </Link>
          )}
        </div>
        <Link
          to="/nutrition/targets"
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Célok beállítása"
        >
          <Settings size={18} />
        </Link>
      </div>

      <div className="space-y-3">
        <MacroBar label="Fehérje" value={totals.protein} goal={goals.protein} colorClass="bg-secondary-500" />
        <MacroBar label="Szénhidrát" value={totals.carbs} goal={goals.carbs} colorClass="bg-accent-500" />
        <MacroBar label="Zsír" value={totals.fat} goal={goals.fat} colorClass="bg-warning-500" />
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  goal,
  colorClass,
}: {
  label: string;
  value: number;
  goal: number | null;
  colorClass: string;
}) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-gray-400 dark:text-gray-500">
          {Math.round(value)}
          {goal != null ? ` / ${goal} g` : ' g'}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: goal ? `${pct}%` : '0%' }} />
      </div>
    </div>
  );
}
