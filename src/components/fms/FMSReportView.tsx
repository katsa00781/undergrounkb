import { AlertTriangle, ArrowLeftRight, ClipboardList, Info, Target } from 'lucide-react';
import { FMS_CORRECTION_MODALITY_LABELS } from '../../lib/workoutGenerator/fmsCorrections';
import type { FMSReportModel } from '../../lib/fmsReport/types';
import { FMSScoreGrid } from './FMSScoreGrid';
import { FMS_RISK_BADGE, FMS_RISK_RING } from './riskStyles';

interface FMSReportViewProps {
  model: FMSReportModel;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${year}. ${month}. ${day}.` : isoDate;
}

/** A riport képernyős megjelenítése — ugyanaz a tartalom, mint a PDF-ben. */
export function FMSReportView({ model }: FMSReportViewProps) {
  const riskStyle = { badge: FMS_RISK_BADGE[model.risk.id], ring: FMS_RISK_RING[model.risk.id] };

  return (
    <div className="space-y-6">
      {/* Összegző fejléc */}
      <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ring-1 dark:border-gray-700 dark:bg-gray-800 ${riskStyle.ring}`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-baseline gap-1">
            <span className="text-5xl font-bold text-primary-600 dark:text-primary-400">
              {model.totalScore}
            </span>
            <span className="text-xl text-gray-400 dark:text-gray-500">/ {model.maxScore}</span>
          </div>

          <div className="min-w-0 flex-1 sm:border-l sm:border-gray-200 sm:pl-6 sm:dark:border-gray-700">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskStyle.badge}`}>
              {model.risk.label}
            </span>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{model.risk.summary}</p>

            {/* Az értékelés indokai — enélkül a jó összpontszám elfedné a gyenge mintát. */}
            {model.risk.reasons.length > 0 && (
              <ul className="mt-3 space-y-1">
                {model.risk.reasons.map(reason => (
                  <li
                    key={reason}
                    className="flex gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span aria-hidden="true" className="text-gray-400 dark:text-gray-500">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
              {model.clientName} · {formatDate(model.assessmentDate)} · összpontszám-sáv{' '}
              {model.band.min}–{model.band.max} pont
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

            {model.positiveClearingTests.length > 0 && (
              <>
                <p className="mt-3 text-sm font-semibold text-error-800 dark:text-error-300">
                  Pozitív clearing (fájdalom) tesztek
                </p>
                <ul className="mt-1 space-y-1">
                  {model.positiveClearingTests.map(test => (
                    <li key={test.id} className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{test.label}</span> — {test.instruction}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* Aszimmetria-figyelmeztetés */}
      {model.asymmetricRows.length > 0 && (
        <div className="flex gap-3 rounded-lg border-l-4 border-warning-500 bg-warning-50 p-4 dark:bg-warning-900/20">
          <ArrowLeftRight className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" />
          <div>
            <p className="text-sm font-semibold text-warning-800 dark:text-warning-300">
              Oldalkülönbség
            </p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Az alábbi mozgásmintáknál a két oldal pontszáma eltér. Az FMS szerint az aszimmetria
              akkor is korrekciós indok, ha a beszámított pont egyébként elfogadható — a gyengébb
              oldalt érdemes célzottan fejleszteni.
            </p>
            <ul className="mt-2 space-y-1">
              {model.asymmetricRows.map(row => (
                <li key={row.testId} className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{row.label}</span> — bal {row.sides?.left} / jobb{' '}
                  {row.sides?.right}
                </li>
              ))}
            </ul>
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
            A 2 pont alatti, illetve oldalkülönbséget mutató mozgásmintákhoz az alábbi gyakorlatok
            beépítése javasolt — mintánként végigvihető sorban, az SMR-től a terhelt megerősítésig.
            Aszimmetria esetén a gyengébb oldalon érdemes több munkát végezni.
          </p>

          <div className="space-y-3">
            {model.corrections.map(group => (
              <div key={group.testId} className="rounded-md bg-gray-50 p-4 dark:bg-gray-700/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{group.label}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    {/* A 2 pont már nem „gyenge" — ilyenkor az oldalkülönbség az indok. */}
                    <span
                      className={
                        group.reasons.includes('low_score')
                          ? 'text-error-600 dark:text-error-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    >
                      {group.score} pont
                    </span>
                    {group.reasons.includes('asymmetry') && group.sides && (
                      <span className="rounded bg-warning-100 px-2 py-0.5 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400">
                        oldalkülönbség: bal {group.sides.left} / jobb {group.sides.right}
                      </span>
                    )}
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
