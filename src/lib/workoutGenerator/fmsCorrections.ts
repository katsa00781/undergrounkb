import { FMSAssessment } from '../fms';
import { FMS_FOCUS_OPTIONS } from '../exerciseTaxonomy/constants';
import { getFMSFocusLabel } from '../exerciseTaxonomy/metadata';
import type { FMSFocusId } from '../exerciseTaxonomy/types';
import { getFMSSideScores, hasFMSAsymmetry, type FMSSideScores } from '../fmsScoring';
import { FMS_CORRECTION_EXERCISES, type FMSCorrectionExercise } from './fmsCorrectionExercises';

export type { FMSCorrectionExercise, FMSCorrectionModality } from './fmsCorrectionExercises';
export {
  FMS_CORRECTION_EXERCISES,
  FMS_CORRECTION_MODALITY_LABELS,
  FMS_CORRECTION_MODALITY_ORDER,
} from './fmsCorrectionExercises';

/** A korrekciós gyakorlatok nevei mozgásmintánként (az edzésgenerátor ezeket teszi a tervbe). */
export const FMS_CORRECTION_NAMES: Record<FMSFocusId, string[]> = Object.fromEntries(
  FMS_FOCUS_OPTIONS.map(option => [
    option.id,
    FMS_CORRECTION_EXERCISES[option.id].map(exercise => exercise.name),
  ]),
) as Record<FMSFocusId, string[]>;

/** Miért kap a mozgásminta korrekciót. */
export type FMSCorrectionReason = 'low_score' | 'asymmetry';

/**
 * Egy mozgásminta korrekciós indokai.
 *
 * A 2 pont alatti eredmény mellett az **oldalkülönbség** is önálló indok: egy
 * 3 / 2-es akadálylépés beszámított pontja 2 (tehát nem „gyenge"), a két oldal
 * eltérése viszont az FMS szerint célzott korrekciót kíván. Enélkül a riport
 * korrekciót jelzett a fejlécben, de üres volt a gyakorlat-szekciója.
 */
function getCorrectionReasons(
  assessment: FMSAssessment,
  testId: FMSFocusId,
): { reasons: FMSCorrectionReason[]; sides: FMSSideScores | null } {
  const score = assessment[testId];
  const sides = getFMSSideScores(assessment, testId);
  const reasons: FMSCorrectionReason[] = [];

  if (typeof score === 'number' && score < 2) reasons.push('low_score');
  if (hasFMSAsymmetry(sides)) reasons.push('asymmetry');

  return { reasons, sides };
}

/**
 * Az FMS korrekciók azonosítása a felmérés alapján
 * @param assessment - Az FMS felmérés
 * @returns Az ajánlott korrekciós gyakorlatok nevei
 */
export function identifyFMSCorrections(assessment: FMSAssessment | null): string[] {
  if (!assessment) return [];

  const corrections: string[] = [];

  FMS_FOCUS_OPTIONS.forEach(option => {
    if (getCorrectionReasons(assessment, option.id).reasons.length === 0) return;

    // Véletlenszerűen választunk egy gyakorlatot a lehetséges opciók közül
    const names = FMS_CORRECTION_NAMES[option.id];
    corrections.push(names[Math.floor(Math.random() * names.length)]);
  });

  return corrections;
}

export interface FMSCorrectionGroup {
  testId: FMSFocusId;
  label: string;
  /** A beszámított pont (oldalankénti teszteknél a gyengébb oldalé). */
  score: number;
  /** Miért került be: gyenge pontszám és/vagy oldalkülönbség. */
  reasons: FMSCorrectionReason[];
  /** A nyers oldalankénti pontok, ha van ilyen adat. */
  sides: FMSSideScores | null;
  exercises: FMSCorrectionExercise[];
}

/**
 * A riporthoz használt, **determinisztikus** korrekció-gyűjtés.
 *
 * Az `identifyFMSCorrections` szándékosan véletlenszerűen választ egy gyakorlatot
 * az edzésgenerátornak (hogy ne mindig ugyanazt tegye be). Egy PDF riportnál ez
 * elfogadhatatlan: két generálás más dokumentumot adna. Ez a változat fix
 * sorrendben jár végig a teszteken, és minden korrekciót igénylő mozgásmintához
 * (2 alatti pontszám **vagy** oldalkülönbség) a teljes korrekciós blokkot
 * visszaadja (SMR → FMS szalag → saját testsúly → kettlebell).
 */
export function getFMSCorrectionsForAssessment(
  assessment: FMSAssessment | null,
): FMSCorrectionGroup[] {
  if (!assessment) return [];

  return FMS_FOCUS_OPTIONS.reduce<FMSCorrectionGroup[]>((groups, option) => {
    const score = assessment[option.id];
    const { reasons, sides } = getCorrectionReasons(assessment, option.id);

    if (typeof score === 'number' && reasons.length > 0) {
      groups.push({
        testId: option.id,
        label: getFMSFocusLabel(option.id) ?? option.id,
        score,
        reasons,
        sides,
        exercises: FMS_CORRECTION_EXERCISES[option.id].map(exercise => ({ ...exercise })),
      });
    }

    return groups;
  }, []);
}
