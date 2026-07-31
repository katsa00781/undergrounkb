import type { FMSReportRow } from '../../lib/fmsReport/types';

interface FMSScoreGridProps {
  rows: FMSReportRow[];
}

function scoreBadgeClass(score: number): string {
  if (score >= 3) return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
  if (score >= 2) return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
  return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400';
}

function scoreBarClass(score: number): string {
  if (score >= 3) return 'bg-success-500';
  if (score >= 2) return 'bg-warning-500';
  return 'bg-error-500';
}

/**
 * A 7 FMS teszt pontszáma sávdiagrammal. A Dashboard korábban hétszer
 * ismételte ugyanezt a markupot — ez az egyetlen forrás.
 */
export function FMSScoreGrid({ rows }: FMSScoreGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rows.map(row => (
        <div key={row.testId} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-medium ${scoreBadgeClass(row.score)}`}
            >
              {row.score}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all ${scoreBarClass(row.score)}`}
              style={{ width: `${(row.score / 3) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">{row.scoreLabel}</p>
        </div>
      ))}
    </div>
  );
}

export default FMSScoreGrid;
