import { AlertTriangle, ArrowLeftRight, ShieldAlert } from 'lucide-react';
import type { FMSMovementStep, FMSScoreField } from '../../lib/fmsAssessmentForm';
import type { FMSClearingTestId } from '../../lib/fmsScoring';
import { FMSScoreSelector } from './FMSScoreSelector';

interface FMSMovementStepCardProps {
  step: FMSMovementStep;
  scores: Partial<Record<FMSScoreField, number | undefined>>;
  clearingPain: boolean;
  onScoreChange: (field: FMSScoreField, score: number) => void;
  onClearingChange: (field: FMSClearingTestId, painful: boolean) => void;
}

const SIDE_LABELS: Record<'left' | 'right' | 'both', string> = {
  left: 'Bal oldal',
  right: 'Jobb oldal',
  both: 'Pontszám',
};

/**
 * Egy mozgásminta felvétele: oldalanként pontozott teszteknél két
 * pontszámválasztó (a beszámított pont a gyengébb oldal), plusz a teszthez
 * tartozó clearing (fájdalom) teszt kapcsolója.
 */
export function FMSMovementStepCard({
  step,
  scores,
  clearingPain,
  onScoreChange,
  onClearingChange,
}: FMSMovementStepCardProps) {
  const selectedScores = step.scoreFields.map(({ field }) => {
    const value = scores[field];
    return typeof value === 'number' ? value : null;
  });

  const allSelected = selectedScores.every((score): score is number => score !== null);
  const rawScore = allSelected ? Math.min(...selectedScores) : null;
  const resolvedScore = clearingPain ? 0 : rawScore;

  const isSided = step.scoreFields.length > 1;
  const hasAsymmetry =
    isSided && allSelected && selectedScores[0] !== selectedScores[1];

  return (
    <div className="space-y-4">
      <div className={isSided ? 'grid gap-4 sm:grid-cols-2' : undefined}>
        {step.scoreFields.map(({ side, field }, index) => (
          <FMSScoreSelector
            key={field}
            label={SIDE_LABELS[side]}
            value={selectedScores[index]}
            onChange={score => onScoreChange(field, score)}
            disabled={clearingPain}
          />
        ))}
      </div>

      {/* Beszámított pont — a felvevő lássa, mi kerül ténylegesen a felmérésbe. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-gray-700/40">
        <span className="text-gray-600 dark:text-gray-400">Beszámított pont:</span>
        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
          {resolvedScore === null ? '—' : resolvedScore}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / 3</span>
        </span>
        {clearingPain ? (
          <span className="text-xs text-error-600 dark:text-error-400">
            a clearing teszt fájdalmas → a pontszám kötelezően 0
          </span>
        ) : (
          isSided && (
            <span className="text-xs text-gray-500 dark:text-gray-400">a gyengébb oldal pontja</span>
          )
        )}
      </div>

      {hasAsymmetry && (
        <div className="flex gap-3 rounded-lg border-l-4 border-warning-500 bg-warning-50 p-3 dark:bg-warning-900/20">
          <ArrowLeftRight className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Aszimmetria:</span> a két oldal pontszáma eltér
            (bal {selectedScores[0]} / jobb {selectedScores[1]}). Az FMS szerint az oldalkülönbség
            akkor is korrekciós indok, ha a beszámított pont egyébként elfogadható.
          </p>
        </div>
      )}

      {/* Clearing (fájdalom) teszt */}
      {step.clearingTest && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {step.clearingTest.label}
              </h4>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {step.clearingTest.instruction}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { painful: false, label: 'Nincs fájdalom' },
              { painful: true, label: 'Fájdalom (pozitív)' },
            ].map(option => {
              const isSelected = clearingPain === option.painful;
              const selectedClass = option.painful
                ? 'border-error-500 bg-error-50 text-error-700 dark:border-error-400 dark:bg-error-900/30 dark:text-error-400'
                : 'border-success-500 bg-success-50 text-success-700 dark:border-success-400 dark:bg-success-900/30 dark:text-success-400';

              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onClearingChange(step.clearingTest!.id, option.painful)}
                  className={`rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? selectedClass
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {clearingPain && (
            <div className="mt-3 flex gap-2 rounded-md bg-error-50 p-3 dark:bg-error-900/20">
              <AlertTriangle className="h-4 w-4 shrink-0 text-error-600 dark:text-error-400" />
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Pozitív clearing teszt: a(z) „{step.label}” pontszáma 0 lesz, és orvosi kivizsgálás
                javasolt. Az érintett mozgásminta terhelését a kivizsgálás eredményéig kerülni kell.
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          A teszt végrehajtása
        </h4>
        <ul className="space-y-2">
          {step.instructions.map((instruction, index) => (
            <li
              key={instruction}
              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                {index + 1}
              </span>
              {instruction}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FMSMovementStepCard;
