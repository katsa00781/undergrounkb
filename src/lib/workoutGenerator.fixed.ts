import { supabase } from '../config/supabase';
import { getExercises } from './exercises';
import {
  CycleWeek,
  GeneratedWorkoutPlan,
  ProgramType,
  TrainingFocus,
  WorkoutDay,
  WorkoutSectionGenerated,
} from './workoutGenerator/types';
import { categorizeExercises } from './workoutGenerator/exerciseCategorizer';
import { identifyFMSCorrections } from './workoutGenerator/fmsCorrections';
import { applyFocusPresetToSections, getFocusPreset } from './workoutGenerator/focusPresets';
import {
  generate2DayPlan,
  generate3DayPlan,
  generateDay1Plan,
  generateDay2Plan,
  generateDay3Plan,
  generateDay4Plan,
} from './workoutGenerator/dayPlans';

// Publikus típusok és segédek újraexportálása, hogy a belépési pont importjai változatlanok maradjanak
export type {
  WorkoutDay,
  ProgramType,
  CycleWeek,
  TrainingFocus,
  WorkoutExercise,
  WorkoutSectionGenerated,
  GeneratedWorkoutPlan,
} from './workoutGenerator/types';
export { TRAINING_FOCUS_OPTIONS, getTrainingFocusLabel } from './workoutGenerator/types';

/**
 * Egységes súlykiegészítés a generált szekciókhoz (alapértelmezett kettlebell súly)
 */
function applyDefaultWeights(sections: WorkoutSectionGenerated[]): void {
  sections.forEach(section => {
    section.exercises.forEach(exercise => {
      if (exercise.exerciseId && !exercise.weight && !exercise.exerciseId.startsWith('placeholder-')) {
        if (exercise.name?.toLowerCase().includes('kettlebell') ||
            exercise.name?.toLowerCase().includes('súlyzó') ||
            exercise.name?.toLowerCase().includes('kb')) {
          exercise.weight = 16; // Alapértelmezett kettlebell súly (kg)
        }
      }
    });
  });
}

/**
 * A legutóbbi FMS felmérésből származó korrekciók lekérése
 */
async function fetchFMSCorrections(userId: string, adjustForFMS: boolean): Promise<string[]> {
  if (!adjustForFMS) return [];

  try {
    const { data: fmsData } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fmsData && fmsData.length > 0) {
      return identifyFMSCorrections(fmsData[0]);
    }
  } catch (error) {
    console.error('Nem sikerült lekérni az FMS adatokat:', error);
    // Folytatjuk korrekciók nélkül
  }

  return [];
}

/**
 * Edzésterv generáló függvény
 * @param options - Opciók a generáláshoz
 * @returns A generált edzésterv
 */
export async function generateWorkoutPlan(options: {
  userId: string;
  day: WorkoutDay;
  includeWeights?: boolean;
  adjustForFMS?: boolean;
}): Promise<GeneratedWorkoutPlan> {
  const { userId, day, includeWeights = true, adjustForFMS = true } = options;

  try {
    // 1. Gyakorlatok lekérése
    const exercises = await getExercises();

    // 2. FMS adatok lekérése, ha szükséges
    const fmsCorrections = await fetchFMSCorrections(userId, adjustForFMS);

    // 3. Gyakorlatok kategorizálása
    const categorizedExercises = categorizeExercises(exercises);

    // 4. Napnak megfelelő edzésterv generálása
    let sections: WorkoutSectionGenerated[];
    let title: string;
    let description: string;

    switch (day) {
      case 1:
        title = 'Robbanékonyság fókuszú edzés';
        description = 'Első napi edzésterv robbanékonyság fókusszal, kettlebell és saját testsúlyos gyakorlatokkal.';
        sections = generateDay1Plan(categorizedExercises, fmsCorrections);
        break;
      case 2:
        title = 'Erő fókuszú edzés';
        description = 'Második napi edzésterv erőfejlesztési fókusszal, kettlebell és saját testsúlyos gyakorlatokkal.';
        sections = generateDay2Plan(categorizedExercises, fmsCorrections);
        break;
      case 3:
        title = 'Kombinált erő-robbanékonyság köredzés';
        description = 'Harmadik napi edzésterv kombinált fókusszal, köredzés formátumban.';
        sections = generateDay3Plan(categorizedExercises, fmsCorrections);
        break;
      case 4:
        title = 'Mobilitás és regeneráció';
        description = 'Negyedik napi edzésterv mobilitás és regenerációs fókusszal.';
        sections = generateDay4Plan(categorizedExercises, fmsCorrections);
        break;
      default:
        title = 'Általános edzésterv';
        description = 'Általános edzésterv kettlebell és saját testsúlyos gyakorlatokkal.';
        sections = generateDay1Plan(categorizedExercises, fmsCorrections);
    }

    // 5. Ha szükséges, adjuk hozzá a súlyokat
    if (includeWeights) {
      applyDefaultWeights(sections);
    }

    // 6. Visszatérés a teljes edzéstervvel
    return {
      title,
      description,
      date: new Date().toISOString().split('T')[0],
      duration: 60,
      sections,
      notes: `Generált edzésterv - ${title}. Az edzés tartalmaz ${fmsCorrections.length} FMS korrekciós gyakorlatot.`,
      user_id: userId
    };

  } catch (error) {
    console.error('Hiba az edzésterv generálásakor:', error);
    throw error;
  }
}

/**
 * Main generator for programType and day
 */
export async function generateWorkoutPlanV2(options: {
  userId: string;
  programType: ProgramType;
  day: number; // 1,2,3 or 4
  cycleWeek?: CycleWeek;
  trainingFocus?: TrainingFocus;
  usePeriodizationPresets?: boolean;
  includeWeights?: boolean;
  adjustForFMS?: boolean;
}): Promise<GeneratedWorkoutPlan> {
  const {
    userId,
    programType,
    day,
    cycleWeek = 1,
    trainingFocus = 'ero',
    usePeriodizationPresets = false,
    includeWeights = true,
    adjustForFMS = true,
  } = options;

  try {
    // 1. Gyakorlatok lekérése
    const exercises = await getExercises();
    const fmsCorrections = await fetchFMSCorrections(userId, adjustForFMS);
    const categorizedExercises = categorizeExercises(exercises);
    let sections: WorkoutSectionGenerated[] = [];
    let title = '';
    let description = '';

    if (programType === '2napos') {
      title = '2 napos program';
      description = '2 napos Boyle struktúrájú robbanékonyság és erő fókuszú edzésterv';
      sections = generate2DayPlan(categorizedExercises, fmsCorrections, day as 1 | 2);
    } else if (programType === '3napos') {
      title = '3 napos program';
      description = '3 napos strukturált edzésterv';
      sections = generate3DayPlan(categorizedExercises, fmsCorrections, day as 1 | 2 | 3);
    } else {
      // fallback to 4 napos (use existing logic)
      title = '4 napos program';
      description = '4 napos felsőtest, alsótest és robbanékonyság fókuszú strukturált edzésterv';
      // You can call your existing day1-4 logic here
      switch (day) {
        case 1:
          sections = generateDay1Plan(categorizedExercises, fmsCorrections);
          break;
        case 2:
          sections = generateDay2Plan(categorizedExercises, fmsCorrections);
          break;
        case 3:
          sections = generateDay3Plan(categorizedExercises, fmsCorrections);
          break;
        case 4:
          sections = generateDay4Plan(categorizedExercises, fmsCorrections);
          break;
        default:
          sections = generateDay1Plan(categorizedExercises, fmsCorrections);
      }
    }

    const preset = usePeriodizationPresets ? getFocusPreset(trainingFocus, cycleWeek) : null;
    if (preset) {
      sections = applyFocusPresetToSections(sections, preset);
    }

    // Add weights if needed (reuse your logic)
    if (includeWeights) {
      applyDefaultWeights(sections);
    }
    return {
      title: preset ? `${title} - ${cycleWeek}. hét` : title,
      description: preset ? `${description}. Fókusz: ${preset.label}. ${preset.summary}` : description,
      date: new Date().toISOString().split('T')[0],
      duration: 60,
      sections,
      notes: preset
        ? `Generált edzésterv - ${title}. Ciklus: ${cycleWeek}. hét. Fókusz: ${preset.label}. Irányelvek: ${preset.summary}. Az edzés tartalmaz ${fmsCorrections.length} FMS korrekciós gyakorlatot.`
        : `Generált edzésterv - ${title}. Az edzés tartalmaz ${fmsCorrections.length} FMS korrekciós gyakorlatot.`,
      user_id: userId
    };
  } catch (error) {
    console.error('Hiba az edzésterv generálásakor:', error);
    throw error;
  }
}
