import { FMSAssessment } from '../fms';
import { FMS_FOCUS_OPTIONS } from '../exerciseTaxonomy/constants';
import { getFMSFocusLabel } from '../exerciseTaxonomy/metadata';
import type { FMSFocusId } from '../exerciseTaxonomy/types';
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

/**
 * Az FMS korrekciók azonosítása a felmérés alapján
 * @param assessment - Az FMS felmérés
 * @returns Az ajánlott korrekciós gyakorlatok nevei
 */
export function identifyFMSCorrections(assessment: FMSAssessment | null): string[] {
  if (!assessment) return [];

  const corrections: string[] = [];

  // Minden 2 alatti pontszám esetén korrekciós gyakorlatot ajánlunk
  Object.keys(assessment).forEach(key => {
    if (['id', 'user_id', 'date', 'notes', 'created_at', 'updated_at', 'total_score'].includes(key)) {
      return; // Ezeket a mezőket kihagyjuk
    }

    // Biztonságos típuskonverzió
    const score = assessment[key as keyof FMSAssessment];
    const names = FMS_CORRECTION_NAMES[key as FMSFocusId] as string[] | undefined;
    if (typeof score === 'number' && score < 2 && names) {
      // Véletlenszerűen választunk egy gyakorlatot a lehetséges opciók közül
      corrections.push(names[Math.floor(Math.random() * names.length)]);
    }
  });

  return corrections;
}

export interface FMSCorrectionGroup {
  testId: FMSFocusId;
  label: string;
  score: number;
  exercises: FMSCorrectionExercise[];
}

/**
 * A riporthoz használt, **determinisztikus** korrekció-gyűjtés.
 *
 * Az `identifyFMSCorrections` szándékosan véletlenszerűen választ egy gyakorlatot
 * az edzésgenerátornak (hogy ne mindig ugyanazt tegye be). Egy PDF riportnál ez
 * elfogadhatatlan: két generálás más dokumentumot adna. Ez a változat fix
 * sorrendben jár végig a teszteken, és minden 2 alatti pontszámhoz a mozgásminta
 * teljes korrekciós blokkját visszaadja (SMR → FMS szalag → saját testsúly →
 * kettlebell).
 */
export function getFMSCorrectionsForAssessment(
  assessment: FMSAssessment | null,
): FMSCorrectionGroup[] {
  if (!assessment) return [];

  return FMS_FOCUS_OPTIONS.reduce<FMSCorrectionGroup[]>((groups, option) => {
    const score = assessment[option.id];

    if (typeof score === 'number' && score < 2) {
      groups.push({
        testId: option.id,
        label: getFMSFocusLabel(option.id) ?? option.id,
        score,
        exercises: FMS_CORRECTION_EXERCISES[option.id].map(exercise => ({ ...exercise })),
      });
    }

    return groups;
  }, []);
}
