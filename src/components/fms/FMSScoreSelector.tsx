import { CheckCircle2 } from 'lucide-react';
import { FMS_SCORE_LABELS } from '../../lib/fmsReport/constants';

interface FMSScoreSelectorProps {
  label: string;
  value: number | null;
  onChange: (score: number) => void;
  /** Pozitív clearing teszt esetén a pontszám kötelezően 0 — a választó tiltott. */
  disabled?: boolean;
}

/** 0–3 pontszámválasztó egy mozgásmintához (vagy annak egyik oldalához). */
export function FMSScoreSelector({ label, value, onChange, disabled = false }: FMSScoreSelectorProps) {
  return (
    <div className={disabled ? 'opacity-50' : undefined}>
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>

      <div className="mt-2 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map(score => {
          const isSelected = value === score;

          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => onChange(score)}
              aria-pressed={isSelected}
              aria-label={`${label}: ${score} pont — ${FMS_SCORE_LABELS[score]}`}
              className={`relative flex items-center justify-center rounded-lg border p-3 transition-colors disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              <span
                className={`text-xl font-bold ${
                  isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                }`}
              >
                {score}
              </span>
              {isSelected && (
                <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 text-primary-600 dark:text-primary-400" />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {value === null ? 'Még nincs pontszám kiválasztva' : FMS_SCORE_LABELS[value]}
      </p>
    </div>
  );
}

export default FMSScoreSelector;
