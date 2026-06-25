import { Exercise } from '../exercises';

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

/**
 * Kategorizálja a gyakorlatokat a mozgásminta és egyéb jellemzők szerint
 * @param exercises - Az összes elérhető gyakorlat
 * @returns A kategorizált gyakorlatok
 */
export function categorizeExercises(exercises: Exercise[]): Record<string, Exercise[]> {
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
export function getRandomExercise(
  exercises: Record<string, Exercise[]>,
  category: string
): Exercise | null {
  const categoryExercises = exercises[category];
  if (!categoryExercises || categoryExercises.length === 0) {
    return null;
  }

  return categoryExercises[Math.floor(Math.random() * categoryExercises.length)];
}

export function getFirstAvailableExercise(
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
