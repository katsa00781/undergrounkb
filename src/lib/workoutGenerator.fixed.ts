import { supabase } from '../config/supabase';
import { Exercise } from './exercises';
import { FMSAssessment } from './fms';
import { getExercises } from './exercises';

const FMS_MOVEMENT_PATTERNS = new Set([
  'aslr_correction_first',
  'aslr_correction_second',
  'sm_correction_first',
  'sm_correction_second',
  'stability_correction',
]);

const WARMUP_CATEGORIES = new Set(['mobility_flexibility', 'recovery', 'fms', 'smr']);
const STRETCH_MOVEMENT_PATTERNS = new Set(['mobilization', 'upper_body_mobility']);
const CORE_MOVEMENT_PATTERNS = new Set([
  'stability_anti_extension',
  'stability_anti_rotation',
  'stability_anti_flexion',
  'core_other',
  'gait_stability',
  'gait_crawling',
  'stability_correction',
]);

function pushUnique(target: Exercise[], exercise: Exercise) {
  if (!target.some(item => item.id === exercise.id)) {
    target.push(exercise);
  }
}

// A generált edzéstípusok
export type WorkoutDay = 1 | 2 | 3 | 4;
export type ProgramType = '2napos' | '3napos' | '4napos';
export type CycleWeek = 1 | 2 | 3 | 4 | 5 | 6;
export type TrainingFocus =
  | 'ero'
  | 'robbanekonysag'
  | 'allokepesseg'
  | 'hipertrofia'
  | 'max_ero_hipertrofia'
  | 'max_ero'
  | 'hipertrofia_zsircsokkentes';

export const TRAINING_FOCUS_OPTIONS: Array<{ value: TrainingFocus; label: string }> = [
  { value: 'ero', label: 'Erő' },
  { value: 'robbanekonysag', label: 'Robbanékonyság' },
  { value: 'allokepesseg', label: 'Állóképesség / metcon' },
  { value: 'hipertrofia', label: 'Hipertrófia' },
  { value: 'max_ero_hipertrofia', label: 'Maximális erő és hipertrófia' },
  { value: 'max_ero', label: 'Maximális erő' },
  { value: 'hipertrofia_zsircsokkentes', label: 'Hipertrófia és zsírcsökkentés' },
];

export interface WorkoutExercise {
  exerciseId: string;
  name?: string;
  sets: number;
  reps: string;
  weight?: number | null;
  notes?: string;
  restPeriod?: number;
  instruction?: string;
}

export interface WorkoutSectionGenerated {
  name: string;
  exercises: WorkoutExercise[];
}

export interface GeneratedWorkoutPlan {
  title: string;
  description: string;
  date: string;
  duration: 60;
  sections: WorkoutSectionGenerated[];
  notes?: string;
  user_id: string;
}

type PrescriptionConfig = {
  sets: number;
  reps: string;
  restPeriod: number;
  intensity?: string;
  note?: string;
};

type FocusPreset = {
  label: string;
  summary: string;
  main: PrescriptionConfig;
  accessory: PrescriptionConfig;
  core: PrescriptionConfig;
  carry: PrescriptionConfig;
  correction: PrescriptionConfig;
};

const TRAINING_FOCUS_LABELS: Record<TrainingFocus, string> = {
  ero: 'Erő',
  robbanekonysag: 'Robbanékonyság',
  allokepesseg: 'Állóképesség / metcon',
  hipertrofia: 'Hipertrófia',
  max_ero_hipertrofia: 'Maximális erő és hipertrófia',
  max_ero: 'Maximális erő',
  hipertrofia_zsircsokkentes: 'Hipertrófia és zsírcsökkentés',
};

export function getTrainingFocusLabel(focus: TrainingFocus): string {
  return TRAINING_FOCUS_LABELS[focus];
}

// Az FMS korrekciók listája
const FMS_CORRECTIONS: Record<string, string[]> = {
  deep_squat: [
    'Csípő mozgékonyság javítása', 
    'Boka dorziflexió fejlesztése',
    'Core stabilizáció'
  ],
  hurdle_step: [
    'Csípő stabilitás fejlesztése', 
    'Egyensúlyfejlesztés',
    'Lépés mechanika javítása'
  ],
  inline_lunge: [
    'Csípő mobilitás javítása', 
    'Térd stabilitás fejlesztése',
    'Törzs kontrollfejlesztés'
  ],
  shoulder_mobility: [
    'Váll mobilitás növelése', 
    'Mellizom nyújtás',
    'Lapocka stabilitás'
  ],
  active_straight_leg_raise: [
    'Hamstring nyújtás', 
    'Csípőhajlító nyújtás',
    'Medence pozíció javítása'
  ],
  trunk_stability_pushup: [
    'Core stabilizáció', 
    'Vállöv stabilitás fejlesztése',
    'Plank variációk'
  ],
  rotary_stability: [
    'Rotációs core erősítés', 
    'Csípő-vállöv koordináció',
    'Egyoldali stabilitás fejlesztése'
  ]
};

/**
 * Az FMS korrekciók azonosítása a felmérés alapján
 * @param assessment - Az FMS felmérés
 * @returns Az ajánlott korrekciók listája
 */
function identifyFMSCorrections(assessment: FMSAssessment | null): string[] {
  if (!assessment) return [];

  const corrections: string[] = [];

  // Minden 2 alatti pontszám esetén korrekciós gyakorlatot ajánlunk
  Object.keys(assessment).forEach(key => {
    if (['id', 'user_id', 'date', 'notes', 'created_at', 'updated_at', 'total_score'].includes(key)) {
      return; // Ezeket a mezőket kihagyjuk
    }

    // Biztonságos típuskonverzió
    const score = assessment[key as keyof FMSAssessment];
    if (typeof score === 'number' && score < 2 && FMS_CORRECTIONS[key]) {
      // Véletlenszerűen választunk egy korrekciót a lehetséges opciók közül
      const correction = FMS_CORRECTIONS[key][Math.floor(Math.random() * FMS_CORRECTIONS[key].length)];
      corrections.push(correction);
    }
  });

  return corrections;
}

/**
 * Kategorizálja a gyakorlatokat a mozgásminta és egyéb jellemzők szerint
 * @param exercises - Az összes elérhető gyakorlat
 * @returns A kategorizált gyakorlatok
 */
function categorizeExercises(exercises: Exercise[]): Record<string, Exercise[]> {
  const categories: Record<string, Exercise[]> = {
    'bemelegítés': [],
    'pilometrikus': [],
    'core': [],
    'nyújtás': [],
    'felsőtest_mobilizálás': [],
    'csípőmobilizálás': [],
    'stabilizálás': [],
    'antirotációs': [],
    'cipelés': [],
    'térddomináns_bi': [],
    'térddomináns_uni': [],
    'csípődomináns_bi': [],
    'csípődomináns_uni': [],
    'fms_korrekció': [],
    'horizontális_nyomás_bi': [],
    'horizontális_nyomás_uni': [],
    'vertikális_nyomás_bi': [],
    'vertikális_nyomás_uni': [],
    'horizontális_húzás_bi': [],
    'horizontális_húzás_uni': [],
    'vertikális_húzás_bi': [],
    'vertikális_húzás_uni': [],
    'csípődomináns_hajlított': [],
    'csípődomináns_nyújtott': [],
    'rotációs': [],
    'rehab': [],
    'gait': []
  };

  exercises.forEach(exercise => {
    const movementPattern = exercise.movement_pattern;
    const combinedText = [exercise.name, exercise.description ?? '', exercise.instructions ?? '']
      .join(' ')
      .toLowerCase();

    if (WARMUP_CATEGORIES.has(exercise.category) || STRETCH_MOVEMENT_PATTERNS.has(movementPattern)) {
      pushUnique(categories['bemelegítés'], exercise);
    }

    if (
      CORE_MOVEMENT_PATTERNS.has(movementPattern) ||
      exercise.category === 'fms' ||
      combinedText.includes('core') ||
      combinedText.includes('plank') ||
      combinedText.includes('stabil') ||
      combinedText.includes('carry') ||
      combinedText.includes('cipel')
    ) {
      pushUnique(categories['core'], exercise);
    }

    if (
      movementPattern === 'stability_correction' ||
      CORE_MOVEMENT_PATTERNS.has(movementPattern) ||
      movementPattern === 'gait_stability' ||
      movementPattern === 'gait_crawling' ||
      combinedText.includes('stabil')
    ) {
      pushUnique(categories['stabilizálás'], exercise);
    }

    if (movementPattern === 'stability_anti_rotation') {
      pushUnique(categories['antirotációs'], exercise);
    }

    if (
      STRETCH_MOVEMENT_PATTERNS.has(movementPattern) ||
      exercise.category === 'smr' ||
      combinedText.includes('nyújt') ||
      combinedText.includes('stretch')
    ) {
      pushUnique(categories['nyújtás'], exercise);
    }

    if (
      movementPattern === 'upper_body_mobility' ||
      combinedText.includes('váll') ||
      combinedText.includes('lapocka') ||
      combinedText.includes('mellkas') ||
      combinedText.includes('thoracic')
    ) {
      pushUnique(categories['felsőtest_mobilizálás'], exercise);
    }

    if (
      movementPattern === 'mobilization' && (
        combinedText.includes('csípő') ||
        combinedText.includes('horpasz') ||
        combinedText.includes('hip') ||
        combinedText.includes('psoas')
      )
    ) {
      pushUnique(categories['csípőmobilizálás'], exercise);
    }

    if (
      exercise.category === 'hiit' ||
      combinedText.includes('pilometr') ||
      combinedText.includes('plyo') ||
      combinedText.includes('jump') ||
      combinedText.includes('ugrás')
    ) {
      pushUnique(categories['pilometrikus'], exercise);
    }

    if (movementPattern === 'knee_dominant_bilateral') {
      pushUnique(categories['térddomináns_bi'], exercise);
    }

    if (movementPattern === 'knee_dominant_unilateral') {
      pushUnique(categories['térddomináns_uni'], exercise);
    }

    if (movementPattern === 'hip_dominant_bilateral') {
      pushUnique(categories['csípődomináns_bi'], exercise);
    }

    if (movementPattern === 'hip_dominant_unilateral') {
      pushUnique(categories['csípődomináns_uni'], exercise);
    }

    if (movementPattern === 'hip_dominant_bilateral' || movementPattern === 'hip_dominant_unilateral') {
      if (
        combinedText.includes('hajlított') ||
        combinedText.includes('híd') ||
        combinedText.includes('bridge') ||
        combinedText.includes('thrust') ||
        combinedText.includes('glute') ||
        combinedText.includes('good morning')
      ) {
        pushUnique(categories['csípődomináns_hajlított'], exercise);
      } else {
        pushUnique(categories['csípődomináns_nyújtott'], exercise);
      }
    }

    if (movementPattern === 'horizontal_push_bilateral') {
      pushUnique(categories['horizontális_nyomás_bi'], exercise);
    }

    if (movementPattern === 'horizontal_push_unilateral') {
      pushUnique(categories['horizontális_nyomás_uni'], exercise);
    }

    if (movementPattern === 'horizontal_pull_bilateral') {
      pushUnique(categories['horizontális_húzás_bi'], exercise);
    }

    if (movementPattern === 'horizontal_pull_unilateral') {
      pushUnique(categories['horizontális_húzás_uni'], exercise);
    }

    if (movementPattern === 'vertical_push_bilateral') {
      pushUnique(categories['vertikális_nyomás_bi'], exercise);
    }

    if (movementPattern === 'vertical_push_unilateral') {
      pushUnique(categories['vertikális_nyomás_uni'], exercise);
    }

    if (movementPattern === 'vertical_pull_bilateral') {
      pushUnique(categories['vertikális_húzás_bi'], exercise);
      pushUnique(categories['vertikális_húzás_uni'], exercise);
    }

    if (movementPattern === 'stability_anti_rotation' || combinedText.includes('rotáció')) {
      pushUnique(categories['rotációs'], exercise);
    }

    if (movementPattern === 'gait_stability' || movementPattern === 'gait_crawling') {
      pushUnique(categories['gait'], exercise);
    }

    if (
      combinedText.includes('carry') ||
      combinedText.includes('farmer') ||
      combinedText.includes('suitcase') ||
      combinedText.includes('waiter') ||
      combinedText.includes('overhead walk') ||
      combinedText.includes('cipel')
    ) {
      pushUnique(categories['cipelés'], exercise);
    }

    if (
      exercise.category === 'fms' ||
      FMS_MOVEMENT_PATTERNS.has(movementPattern) ||
      combinedText.includes('fms') ||
      combinedText.includes('korrekció') ||
      combinedText.includes('correction')
    ) {
      pushUnique(categories['fms_korrekció'], exercise);
    }

    if (
      exercise.category === 'recovery' ||
      exercise.category === 'smr' ||
      movementPattern === 'mobilization' ||
      movementPattern === 'local_exercises' ||
      combinedText.includes('rehab') ||
      combinedText.includes('recovery') ||
      combinedText.includes('smr') ||
      combinedText.includes('henger')
    ) {
      pushUnique(categories['rehab'], exercise);
    }
  });

  return categories;
}

/**
 * Véletlenszerűen választ egy gyakorlatot a megadott kategóriából
 * @param exercises - A kategorizált gyakorlatok
 * @param category - A kategória
 * @returns Egy véletlenszerűen kiválasztott gyakorlat, vagy null, ha nincs a kategóriában
 */
function getRandomExercise(
  exercises: Record<string, Exercise[]>, 
  category: string
): Exercise | null {
  const categoryExercises = exercises[category];
  if (!categoryExercises || categoryExercises.length === 0) {
    return null;
  }

  return categoryExercises[Math.floor(Math.random() * categoryExercises.length)];
}

const POWER_WEEK_PRESETS: Record<CycleWeek, PrescriptionConfig> = {
  1: { sets: 6, reps: '5', restPeriod: 180, intensity: '30-50% 1RM', note: 'Összismétlés: 30-40 / gyakorlat • Szettminták: 6x6, 6x4, 6x5' },
  2: { sets: 6, reps: '6', restPeriod: 180, intensity: '30-50% 1RM', note: 'Összismétlés: 30-40 / gyakorlat • Szettminták: 6x6, 6x4, 6x5' },
  3: { sets: 4, reps: '4', restPeriod: 210, intensity: '50-80% 1RM', note: 'Összismétlés: 12-16 / gyakorlat • Szettminták: 4x3, 5x3, 4x4' },
  4: { sets: 5, reps: '3', restPeriod: 210, intensity: '50-80% 1RM', note: 'Összismétlés: 12-16 / gyakorlat • Szettminták: 4x3, 5x3, 4x4' },
  5: { sets: 4, reps: '3', restPeriod: 210, intensity: '30-50% 1RM', note: 'Összismétlés: 12-16 / gyakorlat • 1 fő gyakorlat' },
  6: { sets: 6, reps: '5', restPeriod: 210, intensity: '30-50% 1RM', note: 'Összismétlés: 30-40 / gyakorlat • Szettminták: 6x6, 6x4, 6x5' },
};

const STRENGTH_WEEK_PRESETS: Record<CycleWeek, PrescriptionConfig> = {
  1: { sets: 5, reps: '5', restPeriod: 105, intensity: '75-80% 1RM', note: 'Összismétlés: 25-30 / gyakorlat • 2-3 fő gyakorlat • 2 kiegészítő' },
  2: { sets: 4, reps: '3', restPeriod: 135, intensity: '70-80% 1RM', note: 'Összismétlés: 12-15 / gyakorlat • 3 fő gyakorlat • 2 kiegészítő' },
  3: { sets: 5, reps: '2', restPeriod: 150, intensity: '80-90% 1RM', note: 'Összismétlés: 9-10 / gyakorlat • Szettminták: 6x3, 5x2, 5x3, 6x2, 3x3, 4x3' },
  4: { sets: 3, reps: '3', restPeriod: 150, intensity: '80-90% 1RM', note: 'Összismétlés: 9-10 / gyakorlat • Szettminták: 6x3, 5x2, 5x3, 6x2, 3x3, 4x3' },
  5: { sets: 5, reps: '2', restPeriod: 150, intensity: '80-90% 1RM', note: 'Összismétlés: 9-10 / gyakorlat • Szettminták: 6x3, 5x2, 5x3, 6x2, 3x3, 4x3' },
  6: { sets: 5, reps: '3', restPeriod: 135, intensity: '70-80% 1RM', note: 'Összismétlés: 12-15 / gyakorlat • 3 fő gyakorlat • 2 kiegészítő' },
};

function getFocusPreset(focus: TrainingFocus, week: CycleWeek): FocusPreset {
  if (focus === 'robbanekonysag') {
    const main = POWER_WEEK_PRESETS[week];
    return {
      label: getTrainingFocusLabel(focus),
      summary: `${main.intensity}, pihenő ${main.restPeriod} mp, ${main.note}`,
      main,
      accessory: { sets: 3, reps: '6-8', restPeriod: 90, intensity: '30-50% 1RM', note: 'Technikai kivitelezés, robbanékony szándék' },
      core: { sets: 3, reps: '8-10', restPeriod: 60, note: 'Törzsstabilitás és kontroll' },
      carry: { sets: 3, reps: '20-30 méter', restPeriod: 60, note: 'Minőségi tartás és gait kontroll' },
      correction: { sets: 2, reps: '8-10', restPeriod: 45, note: 'Sérülésmegelőzés és mozgásminőség' },
    };
  }

  if (focus === 'allokepesseg') {
    const duration = 5 + week;
    const rest = week <= 2 ? 90 : 80;
    return {
      label: getTrainingFocusLabel(focus),
      summary: `15 mp munka / gyakorlat, ${rest} mp pihenő, ${duration} perc munkaidő`,
      main: { sets: 1, reps: `${duration} perc blokk • 15 mp munka`, restPeriod: rest, note: 'Metcon vagy körmunka jellegű főblokk' },
      accessory: { sets: 3, reps: '15 mp', restPeriod: rest, note: 'Folyamatos tempó, alacsony holtidő' },
      core: { sets: 3, reps: '15-30 mp', restPeriod: 30, note: 'Állóképességi törzsmunka' },
      carry: { sets: 4, reps: '20-30 méter', restPeriod: 45, note: 'Kondicionáló cipelés' },
      correction: { sets: 2, reps: '8-10', restPeriod: 30, note: 'Mozgásminőség fenntartása' },
    };
  }

  if (focus === 'hipertrofia') {
    return {
      label: getTrainingFocusLabel(focus),
      summary: '36-50 ismétlés, 70-80% 1RM, 1-2 perc pihenő, 6-9 gyakorlat',
      main: { sets: 4, reps: '12', restPeriod: 90, intensity: '70-80% 1RM', note: 'Szettminták: 4x12, 5x10, 5x8' },
      accessory: { sets: 5, reps: '10', restPeriod: 75, intensity: '70-80% 1RM', note: 'Volumen fókusz, 2-4 edzés / hét izomcsoportonként' },
      core: { sets: 3, reps: '12-15', restPeriod: 45 },
      carry: { sets: 3, reps: '20-30 méter', restPeriod: 45 },
      correction: { sets: 2, reps: '10-12', restPeriod: 30 },
    };
  }

  if (focus === 'max_ero_hipertrofia') {
    return {
      label: getTrainingFocusLabel(focus),
      summary: '24-36 ismétlés, 80-90% 1RM, 2-3 perc pihenő, 4-6 gyakorlat',
      main: { sets: 6, reps: '5', restPeriod: 150, intensity: '80-90% 1RM', note: 'Szettminták: 6x6, 5x5, 6x5, 7x4' },
      accessory: { sets: 4, reps: '6-8', restPeriod: 120, intensity: '75-85% 1RM', note: '2-4 edzés / hét izomcsoportonként' },
      core: { sets: 3, reps: '10-12', restPeriod: 60 },
      carry: { sets: 3, reps: '20-30 méter', restPeriod: 60 },
      correction: { sets: 2, reps: '8-10', restPeriod: 45 },
    };
  }

  if (focus === 'max_ero') {
    return {
      label: getTrainingFocusLabel(focus),
      summary: '9-15 ismétlés, 85-95% 1RM, 3-6 perc pihenő, 3-5 gyakorlat',
      main: { sets: 5, reps: '3', restPeriod: 240, intensity: '85-95% 1RM', note: 'Szettminták: 4x3, 5x3, 6x2' },
      accessory: { sets: 3, reps: '5-6', restPeriod: 150, intensity: '75-85% 1RM', note: '2-4 edzés / hét izomcsoportonként' },
      core: { sets: 3, reps: '8-10', restPeriod: 60 },
      carry: { sets: 3, reps: '15-20 méter', restPeriod: 60 },
      correction: { sets: 2, reps: '8-10', restPeriod: 45 },
    };
  }

  if (focus === 'hipertrofia_zsircsokkentes') {
    return {
      label: getTrainingFocusLabel(focus),
      summary: '36-50 ismétlés, 70-80% 1RM, 30-60 mp pihenő, 6-9 gyakorlat',
      main: { sets: 4, reps: '12', restPeriod: 45, intensity: '70-80% 1RM', note: 'Szettminták: 4x12, 5x10, 5x8' },
      accessory: { sets: 5, reps: '10', restPeriod: 30, intensity: '70-80% 1RM', note: 'Sűrített volumen, magasabb anyagcsere-igény' },
      core: { sets: 3, reps: '12-15', restPeriod: 30 },
      carry: { sets: 4, reps: '20-30 méter', restPeriod: 30 },
      correction: { sets: 2, reps: '10-12', restPeriod: 30 },
    };
  }

  const main = STRENGTH_WEEK_PRESETS[week];
  return {
    label: getTrainingFocusLabel('ero'),
    summary: `${main.intensity}, pihenő ${main.restPeriod} mp, ${main.note}`,
    main,
    accessory: { sets: 2, reps: '6-8', restPeriod: 90, intensity: '70-80% 1RM', note: 'Kiegészítő erőfejlesztés • 2 kiegészítő gyakorlat' },
    core: { sets: 3, reps: '8-10', restPeriod: 60, note: 'Törzs és stabilitás' },
    carry: { sets: 3, reps: '20-30 méter', restPeriod: 60, note: 'Erő-állóképességi cipelés' },
    correction: { sets: 2, reps: '8-10', restPeriod: 45, note: 'Korrekció és sérülésmegelőzés' },
  };
}

function classifyExerciseRole(exercise: WorkoutExercise): 'main' | 'core' | 'carry' | 'correction' {
  const token = `${exercise.exerciseId || ''} ${exercise.name || ''}`.toLowerCase();

  if (token.includes('fms') || token.includes('stretch') || token.includes('rehab') || token.includes('mobil')) {
    return 'correction';
  }

  if (token.includes('gait') || token.includes('cipel')) {
    return 'carry';
  }

  if (token.includes('core') || token.includes('rotacios') || token.includes('stabil')) {
    return 'core';
  }

  return 'main';
}

function mergeInstruction(existingInstruction: string | undefined, note: string | undefined, intensity: string | undefined): string | undefined {
  const parts = [existingInstruction, note, intensity ? `Célterhelés: ${intensity}` : undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(' | ') : undefined;
}

function applyConfigToExercise(exercise: WorkoutExercise, config: PrescriptionConfig): WorkoutExercise {
  return {
    ...exercise,
    sets: config.sets,
    reps: config.reps,
    restPeriod: config.restPeriod,
    instruction: mergeInstruction(exercise.instruction, config.note, config.intensity),
  };
}

function applyFocusPresetToSections(sections: WorkoutSectionGenerated[], preset: FocusPreset): WorkoutSectionGenerated[] {
  return sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((exercise) => {
      const role = classifyExerciseRole(exercise);

      if (role === 'correction') {
        return applyConfigToExercise(exercise, preset.correction);
      }

      if (role === 'carry') {
        return applyConfigToExercise(exercise, preset.carry);
      }

      if (role === 'core') {
        return applyConfigToExercise(exercise, preset.core);
      }

      return applyConfigToExercise(exercise, preset.main);
    }),
  }));
}

function getFirstAvailableExercise(
  exercises: Record<string, Exercise[]>,
  categories: string[]
): Exercise | null {
  for (const category of categories) {
    const exercise = getRandomExercise(exercises, category);
    if (exercise) {
      return exercise;
    }
  }

  return null;
}

// 2 napos program generátor
function generate2DayPlan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[],
  day: 1 | 2
): WorkoutSectionGenerated[] {
  const sections: WorkoutSectionGenerated[] = [];

  const stretchExercise = getRandomExercise(categorizedExercises, 'nyújtás');
  sections.push({
    name: 'Horpaszizom nyújtás',
    exercises: [{
      exerciseId: stretchExercise?.id || 'placeholder-stretch',
      name: stretchExercise?.name || 'Horpaszizom nyújtás',
      sets: 2,
      reps: '30 mp/oldal',
      weight: null,
      restPeriod: 0,
      instruction: 'Mindkét oldalra végezd el',
    }],
  });

  if (day === 1) {
    const horizontalPushBi = getRandomExercise(categorizedExercises, 'horizontális_nyomás_bi');
    const horizontalPushUni = getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni');
    const verticalPullBi = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
    const hipBent = getRandomExercise(categorizedExercises, 'csípődomináns_hajlított');
    const rotational = getRandomExercise(categorizedExercises, 'rotációs');
    const rehab = getRandomExercise(categorizedExercises, 'rehab');

    sections.push({
      name: 'Első kör - Robbanékonyság fókusz',
      exercises: [
        {
          exerciseId: 'placeholder-terddom-bi',
          name: getRandomExercise(categorizedExercises, 'térddomináns_bi')?.name || 'Térddomináns BI',
          sets: 3,
          reps: '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: fmsCorrections[0] ? 'fms-correction-1' : 'placeholder-fms',
          name: fmsCorrections[0] || 'FMS korrekciós gyakorlat',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: horizontalPushBi ? 'placeholder-horiz-nyomas-bi' : 'placeholder-horiz-nyomas-uni',
          name: horizontalPushBi?.name || horizontalPushUni?.name || 'Horizontális nyomás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
          instruction: horizontalPushUni ? 'Végezd el mindkét oldalra' : undefined,
        },
      ],
    });

    sections.push({
      name: 'Második kör - Robbanékonyság fókusz',
      exercises: [
        {
          exerciseId: 'placeholder-vert-huzas-bi',
          name: verticalPullBi?.name || 'Függőleges húzás',
          sets: 3,
          reps: '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: fmsCorrections[1] ? 'fms-correction-2' : 'placeholder-fms',
          name: fmsCorrections[1] || 'FMS korrekciós gyakorlat',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: 'placeholder-csipo-hajlitott',
          name: hipBent?.name || 'Csípődomináns hajlított lábas gyakorlat',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: rotational ? 'placeholder-rotacios' : 'placeholder-rehab',
          name: rotational?.name || rehab?.name || 'Rotációs vagy rehabilitációs gyakorlat',
          sets: 3,
          reps: '10/oldal',
          weight: null,
          restPeriod: 60,
        },
      ],
    });
  } else if (day === 2) {
    const verticalPushBi = getRandomExercise(categorizedExercises, 'vertikális_nyomás_bi');
    const verticalPushUni = getRandomExercise(categorizedExercises, 'vertikális_nyomás_uni');
    const horizontalPullBi = getRandomExercise(categorizedExercises, 'horizontális_húzás_bi');
    const horizontalPullUni = getRandomExercise(categorizedExercises, 'horizontális_húzás_uni');
    const hipStraight = getRandomExercise(categorizedExercises, 'csípődomináns_nyújtott');
    const rotational = getRandomExercise(categorizedExercises, 'rotációs');
    const rehab = getRandomExercise(categorizedExercises, 'rehab');
    const gait = getRandomExercise(categorizedExercises, 'gait');

    sections.push({
      name: 'Első kör - Erő fókusz',
      exercises: [
        {
          exerciseId: 'placeholder-terddom-uni',
          name: getRandomExercise(categorizedExercises, 'térddomináns_uni')?.name || 'Térddomináns Uni',
          sets: 3,
          reps: '6-8/oldal',
          weight: null,
          restPeriod: 90,
          instruction: 'Végezd el mindkét oldalra',
        },
        {
          exerciseId: fmsCorrections[0] ? 'fms-correction-1' : 'placeholder-fms',
          name: fmsCorrections[0] || 'FMS korrekciós gyakorlat',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: verticalPushBi ? 'placeholder-vert-nyomas-bi' : 'placeholder-vert-nyomas-uni',
          name: verticalPushBi?.name || verticalPushUni?.name || 'Vertikális nyomás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
          instruction: verticalPushUni ? 'Végezd el mindkét oldalra' : undefined,
        },
      ],
    });

    sections.push({
      name: 'Második kör - Erő fókusz',
      exercises: [
        {
          exerciseId: horizontalPullBi ? 'placeholder-horiz-huzas-bi' : 'placeholder-horiz-huzas-uni',
          name: horizontalPullBi?.name || horizontalPullUni?.name || 'Vízszintes húzás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
          instruction: horizontalPullUni ? 'Végezd el mindkét oldalra' : undefined,
        },
        {
          exerciseId: fmsCorrections[1] ? 'fms-correction-2' : 'placeholder-fms',
          name: fmsCorrections[1] || 'FMS korrekciós gyakorlat',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: 'placeholder-csipo-nyujtott',
          name: hipStraight?.name || 'Csípődomináns nyújtott lábas gyakorlat',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: rotational ? 'placeholder-rotacios' : 'placeholder-rehab',
          name: rotational?.name || rehab?.name || 'Rotációs vagy rehabilitációs gyakorlat',
          sets: 3,
          reps: '10/oldal',
          weight: null,
          restPeriod: 60,
        },
        ...(gait ? [{
          exerciseId: 'placeholder-gait',
          name: gait.name,
          sets: 2,
          reps: '20-30 méter',
          weight: null,
          restPeriod: 60,
          instruction: 'Járás mintázat gyakorlása',
        }] : []),
      ],
    });
  }

  return sections;
}

// 3 napos program generátor
function generate3DayPlan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[],
  day: 1 | 2 | 3
): WorkoutSectionGenerated[] {
  // Structure based on your table
  const sections: WorkoutSectionGenerated[] = [];
  const hipBilateral = getRandomExercise(categorizedExercises, 'csípődomináns_bi')
    || getRandomExercise(categorizedExercises, 'csípődomináns_nyújtott');
  const hipUnilateral = getRandomExercise(categorizedExercises, 'csípődomináns_uni')
    || getRandomExercise(categorizedExercises, 'csípődomináns_hajlított');

  // FMS korrekció always first
  sections.push({
    name: 'FMS korrekció',
    exercises: [
      {
        exerciseId: fmsCorrections[0] ? 'fms-correction-1' : 'placeholder-fms',
        name: fmsCorrections[0] || 'FMS korrekciós gyakorlat',
        sets: 2,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
      },
    ],
  });
  if (day === 1) {
    // Első pár
    sections.push({
      name: 'Első pár',
      exercises: [
        { // Térddomináns BI
          exerciseId:  'placeholder-terddom-bi',
          name: getRandomExercise(categorizedExercises, 'térddomináns_bi')?.name || 'Térddomináns BI',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // FMS korrekció
          exerciseId: fmsCorrections[1] ? 'fms-correction-2' : 'placeholder-fms',
          name: fmsCorrections[1] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        { // Vertikális húzás
          exerciseId:  'placeholder-vert-huzas-bi',
          name: getRandomExercise(categorizedExercises, 'vertikális_húzás_bi')?.name || 'Vertikális húzás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
    // Első hármas
    sections.push({
      name: 'Első hármas',
      exercises: [
        { // Térddomináns Uni
          exerciseId:  'placeholder-terddom-uni',
          name: getRandomExercise(categorizedExercises, 'térddomináns_uni')?.name || 'Térddomináns Uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // Horizontális nyomás uni
          exerciseId:  'placeholder-horiz-nyomas-uni',
          name: getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni')?.name || 'Horizontális nyomás uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // FMS korrekció
          exerciseId: fmsCorrections[2] ? 'fms-correction-3' : 'placeholder-fms',
          name: fmsCorrections[2] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        { // Csípődomináns BI
          exerciseId:  'placeholder-csipo-bi',
          name: hipBilateral?.name || 'Csípődomináns BI',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
  } else if (day === 2) {
    // Második nap szerkezete
    sections.push({
      name: 'Első pár',
      exercises: [
        { // Horizontális nyomás bi
          exerciseId:  'placeholder-horiz-nyomas-bi',
          name: getRandomExercise(categorizedExercises, 'horizontális_nyomás_bi')?.name || 'Horizontális nyomás bi',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // FMS korrekció
          exerciseId: fmsCorrections[1] ? 'fms-correction-2' : 'placeholder-fms',
          name: fmsCorrections[1] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        { // Térddomináns uni
          exerciseId:  'placeholder-terddom-uni',
          name: getRandomExercise(categorizedExercises, 'térddomináns_uni')?.name || 'Térddomináns uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
    sections.push({
      name: 'Első hármas',
      exercises: [
        { // Vertikális nyomás
          exerciseId:  'placeholder-vert-nyomas-bi',
          name: getRandomExercise(categorizedExercises, 'vertikális_nyomás_bi')?.name || 'Vertikális nyomás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // Horizontális húzás bi
          exerciseId:  'placeholder-horiz-huzas-bi',
          name: getRandomExercise(categorizedExercises, 'horizontális_húzás_bi')?.name || 'Horizontális húzás bi',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // FMS korrekció
          exerciseId: fmsCorrections[2] ? 'fms-correction-3' : 'placeholder-fms',
          name: fmsCorrections[2] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        { // Csípődomináns Uni
          exerciseId:  'placeholder-csipo-uni',
          name: hipUnilateral?.name || 'Csípődomináns Uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
  } else if (day === 3) {
    // Harmadik nap szerkezete
    sections.push({
      name: 'Első pár',
      exercises: [
        { // Térddomináns BI
          exerciseId:  'placeholder-terddom-bi',
          name: getRandomExercise(categorizedExercises, 'térddomináns_bi')?.name || 'Térddomináns BI',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // FMS korrekció
          exerciseId: fmsCorrections[1] ? 'fms-correction-2' : 'placeholder-fms',
          name: fmsCorrections[1] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        { // Vertikális húzás
          exerciseId:  'placeholder-vert-huzas-bi',
          name: getRandomExercise(categorizedExercises, 'vertikális_húzás_bi')?.name || 'Vertikális húzás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
    sections.push({
      name: 'Első hármas',
      exercises: [
        { // Horizontális nyomás uni
          exerciseId:  'placeholder-horiz-nyomas-uni',
          name: getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni')?.name || 'Horizontális nyomás uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // Horizontális húzás uni
          exerciseId:  'placeholder-horiz-huzas-uni',
          name: getRandomExercise(categorizedExercises, 'horizontális_húzás_uni')?.name || 'Horizontális húzás uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        { // FMS korrekció
          exerciseId: fmsCorrections[2] ? 'fms-correction-3' : 'placeholder-fms',
          name: fmsCorrections[2] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        { // Gait vagy Core
          exerciseId: 'placeholder-gait-core',
          name: getRandomExercise(categorizedExercises, 'gait')?.name || getRandomExercise(categorizedExercises, 'core')?.name || 'Gait vagy Core',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
  }
  return sections;
}

/**
 * Első napi edzésterv generálása (Robbanékony fókusz)
 */
function generateDay1Plan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[]
): WorkoutSectionGenerated[] {
  const hipBilateral = getFirstAvailableExercise(categorizedExercises, ['csípődomináns_bi', 'csípődomináns_nyújtott']);
  const verticalPull = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
  const kneeUnilateral = getRandomExercise(categorizedExercises, 'térddomináns_uni');
  const horizontalPushUnilateral = getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni');
  const antiRotation = getFirstAvailableExercise(categorizedExercises, ['antirotációs', 'rotációs']);

  return [
    {
      name: 'FMS korrekció',
      exercises: [{
        exerciseId: fmsCorrections[0] ? 'fms-correction-1' : 'placeholder-fms',
        name: fmsCorrections[0] || 'FMS korrekciós gyakorlat',
        sets: 2,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
      }],
    },
    {
      name: 'Első pár',
      exercises: [
        {
          exerciseId: 'placeholder-csipo-bi',
          name: hipBilateral?.name || 'Csípődomináns BI',
          sets: 3,
          reps: '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: fmsCorrections[1] ? 'fms-correction-2' : 'placeholder-fms',
          name: fmsCorrections[1] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: 'placeholder-vert-huzas-bi',
          name: verticalPull?.name || 'Vertikális húzás',
          sets: 3,
          reps: '6-8',
          weight: null,
          restPeriod: 90,
        },
      ],
    },
    {
      name: 'Első hármas',
      exercises: [
        {
          exerciseId: 'placeholder-terddom-uni',
          name: kneeUnilateral?.name || 'Térddomináns Uni',
          sets: 3,
          reps: '6-8 oldalanként',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: 'placeholder-horiz-nyomas-uni',
          name: horizontalPushUnilateral?.name || 'Horizontális nyomás uni',
          sets: 3,
          reps: '6-8 oldalanként',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: fmsCorrections[2] ? 'fms-correction-3' : 'placeholder-fms',
          name: fmsCorrections[2] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: antiRotation ? 'placeholder-rotacios' : 'placeholder-core',
          name: antiRotation?.name || 'Antirotációs core',
          sets: 3,
          reps: '10/oldal',
          weight: null,
          restPeriod: 60,
        },
      ],
    },
  ];
}

/**
 * Második napi edzésterv generálása (Erő fókusz)
 */
function generateDay2Plan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[]
): WorkoutSectionGenerated[] {
  const verticalPush = getFirstAvailableExercise(categorizedExercises, ['vertikális_nyomás_bi', 'vertikális_nyomás_uni']);
  const upperBodyMobility = getFirstAvailableExercise(categorizedExercises, ['felsőtest_mobilizálás', 'nyújtás', 'rehab']);
  const stabilization = getFirstAvailableExercise(categorizedExercises, ['stabilizálás', 'core']);
  const core = getRandomExercise(categorizedExercises, 'core');
  const antiRotation = getFirstAvailableExercise(categorizedExercises, ['antirotációs', 'rotációs']);
  const carry = getFirstAvailableExercise(categorizedExercises, ['cipelés', 'gait']);

  return [
    {
      name: 'FMS korrekció',
      exercises: [{
        exerciseId: fmsCorrections[0] ? 'fms-correction-1' : 'placeholder-fms',
        name: fmsCorrections[0] || 'FMS korrekciós gyakorlat',
        sets: 2,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
      }],
    },
    {
      name: 'Első pár',
      exercises: [
        {
          exerciseId: verticalPush?.movement_pattern === 'vertical_push_unilateral' ? 'placeholder-vert-nyomas-uni' : 'placeholder-vert-nyomas-bi',
          name: verticalPush?.name || 'Függőleges tolás',
          sets: 3,
          reps: verticalPush?.movement_pattern === 'vertical_push_unilateral' ? '6-8 oldalanként' : '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: 'placeholder-rehab',
          name: upperBodyMobility?.name || 'Felsőtest mobilizálás',
          sets: 2,
          reps: '30-45 mp',
          weight: null,
          restPeriod: 30,
        },
        {
          exerciseId: 'placeholder-core',
          name: stabilization?.name || 'Stabilizálás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
      ],
    },
    {
      name: 'Első hármas',
      exercises: [
        {
          exerciseId: 'placeholder-core',
          name: core?.name || 'Core',
          sets: 3,
          reps: '10-12',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: antiRotation ? 'placeholder-rotacios' : 'placeholder-core',
          name: antiRotation?.name || 'Antirotációs core',
          sets: 3,
          reps: '10/oldal',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: fmsCorrections[1] ? 'fms-correction-2' : 'placeholder-fms',
          name: fmsCorrections[1] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: carry ? 'placeholder-gait' : 'placeholder-core',
          name: carry?.name || 'Cipelések',
          sets: 3,
          reps: '20-30 méter',
          weight: null,
          restPeriod: 60,
        },
      ],
    },
  ];
}

/**
 * Harmadik napi edzésterv generálása (Kombinált fókusz)
 */
function generateDay3Plan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[]
): WorkoutSectionGenerated[] {
  const kneeBilateral = getRandomExercise(categorizedExercises, 'térddomináns_bi');
  const verticalPull = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
  const hipDominant = getFirstAvailableExercise(categorizedExercises, ['csípődomináns_bi', 'csípődomináns_nyújtott', 'csípődomináns_hajlított']);
  const horizontalPullUnilateral = getRandomExercise(categorizedExercises, 'horizontális_húzás_uni');
  const gaitOrCore = getFirstAvailableExercise(categorizedExercises, ['gait', 'core']);

  return [
    {
      name: 'FMS korrekció',
      exercises: [{
        exerciseId: fmsCorrections[0] ? 'fms-correction-1' : 'placeholder-fms',
        name: fmsCorrections[0] || 'FMS korrekciós gyakorlat',
        sets: 2,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
      }],
    },
    {
      name: 'Első pár',
      exercises: [
        {
          exerciseId: 'placeholder-terddom-bi',
          name: kneeBilateral?.name || 'Térddomináns BI',
          sets: 3,
          reps: '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: fmsCorrections[1] ? 'fms-correction-2' : 'placeholder-fms',
          name: fmsCorrections[1] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: 'placeholder-vert-huzas-bi',
          name: verticalPull?.name || 'Vertikális húzás',
          sets: 3,
          reps: '6-8',
          weight: null,
          restPeriod: 90,
        },
      ],
    },
    {
      name: 'Első hármas',
      exercises: [
        {
          exerciseId: hipDominant?.movement_pattern === 'hip_dominant_unilateral' ? 'placeholder-csipo-uni' : 'placeholder-csipo-bi',
          name: hipDominant?.name || 'Csípődomináns',
          sets: 3,
          reps: hipDominant?.movement_pattern === 'hip_dominant_unilateral' ? '6-8 oldalanként' : '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: 'placeholder-horiz-huzas-uni',
          name: horizontalPullUnilateral?.name || 'Horizontális húzás uni',
          sets: 3,
          reps: '8-10 oldalanként',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: fmsCorrections[2] ? 'fms-correction-3' : 'placeholder-fms',
          name: fmsCorrections[2] || 'FMS korrekciós gyakorlat',
          sets: 2,
          reps: '8-10',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: gaitOrCore?.movement_pattern === 'gait_stability' || gaitOrCore?.movement_pattern === 'gait_crawling' ? 'placeholder-gait' : 'placeholder-core',
          name: gaitOrCore?.name || 'Gait vagy Core',
          sets: 3,
          reps: gaitOrCore?.movement_pattern === 'gait_stability' || gaitOrCore?.movement_pattern === 'gait_crawling' ? '20-30 méter' : '10-12',
          weight: null,
          restPeriod: 60,
        },
      ],
    },
  ];
}

/**
 * Negyedik napi edzésterv generálása (Mobilitás és regeneráció fókusz)
 */
function generateDay4Plan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[]
): WorkoutSectionGenerated[] {
  const horizontalPush = getFirstAvailableExercise(categorizedExercises, ['horizontális_nyomás_bi', 'horizontális_nyomás_uni']);
  const hipMobility = getFirstAvailableExercise(categorizedExercises, ['csípőmobilizálás', 'nyújtás', 'rehab']);
  const core = getRandomExercise(categorizedExercises, 'core');
  const antiRotation = getFirstAvailableExercise(categorizedExercises, ['antirotációs', 'rotációs']);
  const carry = getFirstAvailableExercise(categorizedExercises, ['cipelés', 'gait']);

  return [
    {
      name: 'FMS korrekció',
      exercises: [{
        exerciseId: fmsCorrections[0] ? 'fms-correction-1' : 'placeholder-fms',
        name: fmsCorrections[0] || 'FMS korrekciós gyakorlat',
        sets: 2,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
      }],
    },
    {
      name: 'Első pár',
      exercises: [
        {
          exerciseId: horizontalPush?.movement_pattern === 'horizontal_push_unilateral' ? 'placeholder-horiz-nyomas-uni' : 'placeholder-horiz-nyomas-bi',
          name: horizontalPush?.name || 'Horizontális tolás',
          sets: 3,
          reps: horizontalPush?.movement_pattern === 'horizontal_push_unilateral' ? '6-8 oldalanként' : '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: 'placeholder-rehab',
          name: hipMobility?.name || 'Csípőmobilizálás',
          sets: 2,
          reps: '30-45 mp',
          weight: null,
          restPeriod: 30,
        },
      ],
    },
    {
      name: 'Első hármas',
      exercises: [
        {
          exerciseId: 'placeholder-core',
          name: core?.name || 'Core',
          sets: 3,
          reps: '10-12',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: antiRotation ? 'placeholder-rotacios' : 'placeholder-core',
          name: antiRotation?.name || 'Antirotációs core',
          sets: 3,
          reps: '10/oldal',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: carry ? 'placeholder-gait' : 'placeholder-core',
          name: carry?.name || 'Cipelések',
          sets: 3,
          reps: '20-30 méter',
          weight: null,
          restPeriod: 60,
        },
      ],
    },
  ];
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
    let fmsCorrections: string[] = [];

    if (adjustForFMS) {
      try {
        const { data: fmsData } = await supabase
          .from('fms_assessments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fmsData && fmsData.length > 0) {
          fmsCorrections = identifyFMSCorrections(fmsData[0]);

        }
      } catch (error) {
        console.error('Nem sikerült lekérni az FMS adatokat:', error);
        // Folytatjuk korrekciók nélkül
      }
    }

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
      sections.forEach(section => {
        section.exercises.forEach(exercise => {
          // Alapsúlyok hozzáadása bizonyos gyakorlatokhoz
          // Ezt később a felhasználó testre szabhatja
          if (exercise.exerciseId && !exercise.weight && !exercise.exerciseId.startsWith('placeholder-')) {
            // Csak bizonyos kategóriákhoz adunk alapértelmezett súlyokat
            if (exercise.name?.toLowerCase().includes('kettlebell') || 
                exercise.name?.toLowerCase().includes('súlyzó') ||
                exercise.name?.toLowerCase().includes('kb')) {
              exercise.weight = 16; // Alapértelmezett kettlebell súly (kg)
            }
          }
        });
      });
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
    let fmsCorrections: string[] = [];
    if (adjustForFMS) {
      try {
        const { data: fmsData } = await supabase
          .from('fms_assessments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (fmsData && fmsData.length > 0) {
          fmsCorrections = identifyFMSCorrections(fmsData[0]);
        }
      } catch {
        // ignore FMS fetch errors
      }
    }
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
      sections.forEach(section => {
        section.exercises.forEach(exercise => {
          if (exercise.exerciseId && !exercise.weight && !exercise.exerciseId.startsWith('placeholder-')) {
            if (exercise.name?.toLowerCase().includes('kettlebell') || 
                exercise.name?.toLowerCase().includes('súlyzó') ||
                exercise.name?.toLowerCase().includes('kb')) {
              exercise.weight = 16;
            }
          }
        });
      });
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
