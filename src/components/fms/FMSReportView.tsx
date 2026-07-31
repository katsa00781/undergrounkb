import { AlertTriangle, ClipboardList, Info, Target } from 'lucide-react';
import { FMS_CORRECTION_MODALITY_LABELS } from '../../lib/workoutGenerator/fmsCorrections';
import type { FMSReportModel, FMSScoreBandId } from '../../lib/fmsReport/types';
import { FMSScoreGrid } from './FMSScoreGrid';

interface FMSReportViewProps {
  model: FMSReportModel;
}

const BAND_STYLES: Record<FMSScoreBandId, { badge: string; ring: string }> = {
  good: {
    badge: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
    ring: 'ring-success-200 dark:ring-success-900/50',
  },
  acceptable: {
    badge: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    ring: 'ring-warning-200 dark:ring-warning-900/50',
  },
  poor: {
    badge: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
    ring: 'ring-error-200 dark:ring-error-900/50',
  },
};

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${year}. ${month}. ${day}.` : isoDate;
}

/** A riport képernyős megjelenítése — ugyanaz a tartalom, mint a PDF-ben. */
export function FMSReportView({ model }: FMSReportViewProps) {
  const bandStyle = BAND_STYLES[model.band.id];

  return (
    <div className="space-y-6">
      {/* Összegző fejléc */}
      <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ring-1 dark:border-gray-700 dark:bg-gray-800 ${bandStyle.ring}`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-baseline gap-1">
            <span className="text-5xl font-bold text-primary-600 dark:text-primary-400">
              {model.totalScore}
            </span>
            <span className="text-xl text-gray-400 dark:text-gray-500">/ {model.maxScore}</span>
          </div>

          <div className="min-w-0 flex-1 sm:border-l sm:border-gray-200 sm:pl-6 sm:dark:border-gray-700">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${bandStyle.badge}`}>
              {model.band.label}
            </span>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{model.band.summary}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              {model.clientName} · {formatDate(model.assessmentDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Fájdalom-figyelmeztetés */}
      {model.hasPainFlag && (
        <div className="flex gap-3 rounded-lg border-l-4 border-error-500 bg-error-50 p-4 dark:bg-error-900/20">
          <AlertTriangle className="h-5 w-5 shrink-0 text-error-600 dark:text-error-400" />
          <div>
            <p className="text-sm font-semibold text-error-800 dark:text-error-300">Figyelem</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              A felmérés során legalább egy mozgásmintánál fájdalom jelentkezett (0 pont). Ilyenkor az
              FMS protokoll szerint orvosi kivizsgálás javasolt, és az érintett mozgásminta terhelését
              kerülni kell a kivizsgálás eredményéig.
            </p>
          </div>
        </div>
      )}

      {/* Részletes eredmények */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <ClipboardList className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          Részletes eredmények
        </h2>
        <FMSScoreGrid rows={model.rows} />
      </section>

      {/* Korrekciós javaslatok */}
      {model.corrections.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Javasolt korrekciós gyakorlatok
          </h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            A 2 pont alatti mozgásmintákhoz az alábbi gyakorlatok beépítése javasolt — mintánként
            végigvihető sorban, az SMR-től a terhelt megerősítésig.
          </p>

          <div className="space-y-3">
            {model.corrections.map(group => (
              <div key={group.testId} className="rounded-md bg-gray-50 p-4 dark:bg-gray-700/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{group.label}</span>
                  <span className="text-xs font-semibold text-error-600 dark:text-error-400">
                    {group.score} pont
                  </span>
                </div>
                <ul className="mt-3 space-y-3">
                  {group.exercises.map(exercise => (
                    <li key={exercise.name} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                      <span className="w-fit shrink-0 rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:border-gray-600 dark:bg-gray-800 dark:text-primary-400 sm:w-28 sm:text-center">
                        {FMS_CORRECTION_MODALITY_LABELS[exercise.modality]}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                          {exercise.name}
                        </span>
                        <span className="block text-xs text-gray-600 dark:text-gray-400">
                          {exercise.dosage} — {exercise.cue}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tesztleírások */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Info className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          Mit mérnek az egyes tesztek?
        </h2>
        <dl className="space-y-3">
          {model.rows.map(row => (
            <div key={row.testId}>
              <dt className="text-sm font-medium text-gray-900 dark:text-white">{row.label}</dt>
              <dd className="text-sm text-gray-600 dark:text-gray-400">{row.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Edzői megjegyzés */}
      {model.notes && (
        <section className="rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4 dark:bg-primary-900/20">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Edzői megjegyzés</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{model.notes}</p>
        </section>
      )}
    </div>
  );
}

export default FMSReportView;
