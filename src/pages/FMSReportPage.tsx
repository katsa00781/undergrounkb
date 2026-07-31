import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Mail } from 'lucide-react';
import { getFMSAssessmentSubject, getFMSAssessments, type FMSAssessment, type FMSAssessmentSubject } from '../lib/fms';
import { buildFMSReportModel } from '../lib/fmsReport/buildReportModel';
import { generateFMSReportPdf } from '../lib/fmsReport/pdf';
import { FMSReportView } from '../components/fms/FMSReportView';
import { SendFMSReportDialog } from '../components/fms/SendFMSReportDialog';
import { useProfile } from '../hooks/useProfile';

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${year}. ${month}. ${day}.` : isoDate;
}

export function FMSReportPage() {
  const { userId } = useParams<{ userId: string }>();
  const { profile } = useProfile();

  const [assessments, setAssessments] = useState<FMSAssessment[]>([]);
  const [subject, setSubject] = useState<FMSAssessmentSubject | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [loadedAssessments, loadedSubject] = await Promise.all([
          getFMSAssessments(userId),
          getFMSAssessmentSubject(userId),
        ]);

        if (cancelled) return;
        setAssessments(loadedAssessments);
        setSubject(loadedSubject);
        // A lista dátum szerint csökkenő, tehát az első a legfrissebb.
        setSelectedId(loadedAssessments[0]?.id ?? '');
      } catch (error) {
        console.error('Failed to load FMS report data:', error);
        if (!cancelled) toast.error('Az FMS felmérés betöltése sikertelen');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const model = useMemo(() => {
    const assessment = assessments.find(item => item.id === selectedId);
    if (!assessment || !subject) return null;

    return buildFMSReportModel({
      assessment,
      clientName: subject.displayName,
      clientEmail: subject.email,
      trainerName: profile?.full_name ?? null,
    });
  }, [assessments, selectedId, subject, profile]);

  const handleDownload = async () => {
    if (!model) return;

    try {
      setIsGenerating(true);
      const pdf = await generateFMSReportPdf(model);

      const url = URL.createObjectURL(pdf.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdf.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate FMS report PDF:', error);
      toast.error('A PDF generálása sikertelen');
    } finally {
      setIsGenerating(false);
    }
  };

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
      <Link
        to="/fms-results"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Vissza az eredményekhez
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {subject?.displayName ?? 'FMS riport'}
          </h1>
          {subject?.email && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subject.email}</p>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {assessments.length > 1 && (
            <div>
              <label
                htmlFor="assessment-date"
                className="mb-1 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Felmérés dátuma
              </label>
              <select
                id="assessment-date"
                className="input"
                value={selectedId}
                onChange={event => setSelectedId(event.target.value)}
              >
                {assessments.map(assessment => (
                  <option key={assessment.id} value={assessment.id}>
                    {formatDate(assessment.date)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={!model || isGenerating}
            className="btn btn-outline gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'Generálás...' : 'PDF letöltése'}
          </button>

          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            disabled={!model}
            className="btn btn-primary gap-2"
          >
            <Mail className="h-4 w-4" />
            Küldés e-mailben
          </button>
        </div>
      </div>

      {model ? (
        <>
          <FMSReportView model={model} />
          <SendFMSReportDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} model={model} />
        </>
      ) : (
        <div className="card text-center">
          <p className="font-medium text-gray-900 dark:text-white">
            Ehhez a felhasználóhoz nincs FMS felmérés
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Rögzíts egy felmérést az FMS felmérés oldalon.
          </p>
        </div>
      )}
    </div>
  );
}

export default FMSReportPage;
