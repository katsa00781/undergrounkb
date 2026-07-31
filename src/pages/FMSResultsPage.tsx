import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { listFMSAssessmentSubjects, type FMSAssessmentSubject } from '../lib/fms';
import { resolveScoreBand } from '../lib/fmsReport/buildReportModel';
import { FMS_MAX_SCORE } from '../lib/fmsReport/constants';
import type { FMSScoreBandId } from '../lib/fmsReport/types';

const BAND_BADGE: Record<FMSScoreBandId, string> = {
  good: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
  acceptable: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
  poor: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
};

function formatDate(isoDate: string | null): string {
  if (!isoDate) return 'Nincs dátum';
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${year}. ${month}. ${day}.` : isoDate;
}

export function FMSResultsPage() {
  const [subjects, setSubjects] = useState<FMSAssessmentSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await listFMSAssessmentSubjects();
        if (!cancelled) setSubjects(data);
      } catch (error) {
        console.error('Failed to load FMS subjects:', error);
        if (!cancelled) toast.error('Az FMS eredmények betöltése sikertelen');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FMS Eredmények</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Válassz egy felmért személyt a riport megtekintéséhez, PDF letöltéséhez vagy e-mailben küldéséhez.
          </p>
        </div>
        <Link to="/assessment" className="btn btn-primary gap-2">
          <Plus className="h-4 w-4" />
          Új felmérés
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="card text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 font-medium text-gray-900 dark:text-white">Még nincs rögzített FMS felmérés</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Készíts egy felmérést, és itt megjelenik a riportja.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map(subject => {
            const totalScore = subject.latestTotalScore;
            const band = totalScore !== null ? resolveScoreBand(totalScore) : null;

            return (
              <Link
                key={subject.userId}
                to={`/fms-results/${subject.userId}`}
                className="card group flex flex-col gap-3 hover:border-primary-300 dark:hover:border-primary-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {subject.displayName}
                    </p>
                    {subject.email && (
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">{subject.email}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Utolsó felmérés</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(subject.latestAssessmentDate)}
                    </p>
                  </div>

                  {totalScore !== null && band && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {totalScore}
                        <span className="text-sm font-normal text-gray-400"> / {FMS_MAX_SCORE}</span>
                      </p>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${BAND_BADGE[band.id]}`}>
                        {band.label}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FMSResultsPage;
