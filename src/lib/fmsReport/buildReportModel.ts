import { getFMSFocusLabel } from '../exerciseTaxonomy/metadata';
import {
  getClearingTestFor,
  getFMSSideScores,
  getPositiveClearingTests,
  hasFMSAsymmetry,
  isClearingTestPositive,
} from '../fmsScoring';
import { getFMSCorrectionsForAssessment } from '../workoutGenerator/fmsCorrections';
import {
  FMS_MAX_SCORE,
  FMS_SCORE_BANDS,
  FMS_SCORE_LABELS,
  FMS_TEST_DESCRIPTIONS,
  FMS_TEST_ORDER,
} from './constants';
import { resolveFMSRisk } from './risk';
import type { FMSReportInput, FMSReportModel, FMSReportRow, FMSScoreBand } from './types';

/** Az összpontszámhoz tartozó sáv. A sávok lefedik a teljes 0–21 tartományt. */
export function resolveScoreBand(totalScore: number): FMSScoreBand {
  const band = FMS_SCORE_BANDS.find(candidate => totalScore >= candidate.min && totalScore <= candidate.max);

  // A tartomány hézagmentes, de a tartományon kívüli értéket a szélső sávra csípjük.
  if (band) return band;
  return totalScore > FMS_MAX_SCORE ? FMS_SCORE_BANDS[0] : FMS_SCORE_BANDS[FMS_SCORE_BANDS.length - 1];
}

/**
 * A 7 teszt sora kanonikus sorrendben. Külön exportált, mert az eredménylistának
 * is szüksége van rá az értékeléshez (`resolveFMSRisk`), teljes riport nélkül.
 */
export function buildFMSReportRows(assessment: FMSReportInput['assessment']): FMSReportRow[] {
  return FMS_TEST_ORDER.map(testId => {
    const score = typeof assessment[testId] === 'number' ? assessment[testId] : 0;
    const sides = getFMSSideScores(assessment, testId);

    return {
      testId,
      label: getFMSFocusLabel(testId) ?? testId,
      score,
      description: FMS_TEST_DESCRIPTIONS[testId],
      scoreLabel: FMS_SCORE_LABELS[score] ?? '—',
      sides,
      hasAsymmetry: hasFMSAsymmetry(sides),
      clearingTest: getClearingTestFor(testId),
      clearingPain: isClearingTestPositive(assessment, testId),
    };
  });
}

/**
 * A riport nézet és a PDF közös, tiszta adatmodellje. Nincs benne se Supabase-,
 * se DOM-függés, ezért unit-tesztelhető.
 */
export function buildFMSReportModel(input: FMSReportInput): FMSReportModel {
  const { assessment, clientName, clientEmail, trainerName } = input;

  const rows = buildFMSReportRows(assessment);

  // A total_score generált DB-oszlop, de a modell nem függhet attól, hogy a
  // hívó lekérte-e: hiány esetén újraszámoljuk.
  const totalScore =
    typeof assessment.total_score === 'number'
      ? assessment.total_score
      : rows.reduce((sum, row) => sum + row.score, 0);

  const trimmedNotes = assessment.notes?.trim();
  const band = resolveScoreBand(totalScore);

  return {
    assessmentId: assessment.id,
    userId: assessment.user_id,
    clientName,
    clientEmail,
    trainerName,
    assessmentDate: assessment.date,
    rows,
    totalScore,
    maxScore: FMS_MAX_SCORE,
    band,
    // Az értékelést nem a pontsáv mondja ki: egy 1 pontos minta vagy egy
    // oldalkülönbség 18/21 mellett is korrekciót indokol.
    risk: resolveFMSRisk(rows, totalScore, band),
    corrections: getFMSCorrectionsForAssessment(assessment),
    // A pozitív clearing teszt a pontszámot úgyis 0-ra viszi, de a jelzőt
    // önállóan is beállítjuk: így akkor is helyes, ha a felmérés kézzel
    // szerkesztett pontszámmal érkezik.
    hasPainFlag: rows.some(row => row.score === 0 || row.clearingPain),
    positiveClearingTests: getPositiveClearingTests(assessment),
    asymmetricRows: rows.filter(row => row.hasAsymmetry),
    notes: trimmedNotes ? trimmedNotes : null,
  };
}
