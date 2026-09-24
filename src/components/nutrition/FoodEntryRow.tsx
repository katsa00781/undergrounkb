import { RefreshCw, Trash2 } from 'lucide-react';
import type { FoodLogEntry } from '../../lib/foodLog';
import { entrySourceLabel, isSyncedEntry } from '../../lib/foodLogSource';

interface FoodEntryRowProps {
  entry: FoodLogEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FoodEntryRow({ entry, onEdit, onDelete }: FoodEntryRowProps) {
  const synced = isSyncedEntry(entry);
  const amountLabel = formatAmount(entry);

  return (
    <div className="flex items-center gap-2 border-t border-gray-100 py-2.5 first:border-t-0 dark:border-gray-700">
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-100">
          <span className="truncate">{entry.name}</span>
          {synced ? (
            <RefreshCw
              size={12}
              className="shrink-0 text-blue-500 dark:text-blue-400"
              aria-label={`Szinkronizálva: ${entrySourceLabel(entry)}`}
            />
          ) : null}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {amountLabel} · {Math.round(entry.kcal)} kcal
        </p>
      </button>
      {/* Szinkronizált sort nem törlünk: a következő mobil szinkron visszaírná, a törlés a forrásappban történik. */}
      {synced ? null : (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-gray-300 hover:bg-error-50 hover:text-error-600 dark:text-gray-600 dark:hover:bg-error-900/30 dark:hover:text-error-400"
          aria-label="Bejegyzés törlése"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function formatAmount(entry: FoodLogEntry): string {
  // A Health-ből érkező soroknak nincs grammja – ilyenkor a forrást írjuk ki.
  if (entry.grams == null) return entrySourceLabel(entry);
  const grams = `${Math.round(entry.grams)} g`;
  return entry.servings != null ? `${formatNum(entry.servings)} adag (${grams})` : grams;
}

function formatNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}
