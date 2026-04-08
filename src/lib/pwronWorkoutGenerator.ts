import { getExercises, Exercise } from './exercises';
import { GeneratedWorkoutPlan, WorkoutExercise, WorkoutSectionGenerated } from './workoutGenerator.fixed';

export type PwronProgramType = 'ERO' | 'HIPERTROFIA' | 'HIPER_ZSIR';
export type PwronWeekNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type PwronSessionVariant = 'A' | 'B';

type WeeklyPowerParams = {
  totalReps: string;
  setPatterns: string[];
  orm: string;
  restSec: string;
  exerciseCount: number;
};

type WeeklyMainBlockParams = {
  totalReps: string;
  setPatterns: string[];
  orm: string;
  restSec: string;
  mainExerciseCount: string;
  suppExerciseCount: number;
};

type WeeklyMetconParams = {
  intervalSec: number;
  restSec: string;
  totalMinutes: number;
};

type CatalogExercise = {
  name: string;
  sets: number;
  reps: number | string;
  weightSlots?: number;
};

type CatalogMetconExercise = {
  name: string;
  baseDuration: string;
};

const EXERCISE_NAME_ALIASES: Record<string, string[]> = {
  'dead swing': ['swing', 'kettlebell swing', 'kb swing'],
  'dobozra ugras lelepessel': ['box jump', 'box jump step down', 'dobozra ugras'],
  'egykezes nyomas padon': ['egykezes fekvenyomas', 'single arm bench press', 'single arm floor press', 'floor press'],
  'fureszeles dontott torzzsel': ['evezes dontott torzzsel', 'one arm row', 'single arm row', 'kettlebell row', 'dumbbell row'],
  'goblet guggolas': ['goblet squat'],
  'katonai nyomas bup': ['katonai nyomas', 'military press', 'strict press', 'bottom up press', 'bup'],
  'huzodzkodas': ['pull up', 'chin up', 'pullup', 'chinup'],
  'egylabas deadlift': ['single leg deadlift', 'single leg rdl', 'single leg romanian deadlift', 'egylabas rdl'],
  'tricepsz padon': ['bench dip', 'pad dip', 'tricepsz tolodzkodas'],
  'athuzas': ['pullover', 'pull over'],
  'bicepsz kettlebellel': ['kettlebell curl', 'kb curl', 'bicepsz curl'],
  'szupinacio clubbell': ['clubbell supination', 'clubbell szupinacio'],
  'kisetalos fekvotamasz': ['walkout push up', 'inchworm push up', 'inchworm'],
  'orajaras': ['clock plank', 'shoulder tap plank'],
  'medvejaras': ['bear crawl'],
  'ugralokotel': ['jump rope', 'rope skipping', 'skipping'],
  'swing': ['kettlebell swing', 'kb swing'],
  'ropeworkout dupla hullam': ['battle rope', 'rope waves', 'double wave'],
  'pfe smr': ['smr', 'mobilitas', 'regeneracio'],
  'happy baby x roll': ['happy baby', 'x roll'],
};

export const PWRON_PROGRAM_OPTIONS: Array<{ value: PwronProgramType; label: string }> = [
  { value: 'ERO', label: 'Erő' },
  { value: 'HIPERTROFIA', label: 'Hipertrófia' },
  { value: 'HIPER_ZSIR', label: 'Hipertrófia + zsírcsökkentés' },
];

const MAIN_BLOCK_LABEL: Record<PwronProgramType, string> = {
  ERO: 'Erő',
  HIPERTROFIA: 'Hipertrófia',
  HIPER_ZSIR: 'Hipertrófia',
};

const PRIORITY_SUMMARY: Record<PwronProgramType, string> = {
  ERO: 'Prioritás: Erő > Sportági technikai képzés > Sérülésmegelőzés > Anatómiai adaptáció > Állóképesség.',
  HIPERTROFIA: 'Prioritás: Hipertrófia > Anatómiai adaptáció > Sérülésmegelőzés > Sportági technikai képzés > Erő.',
  HIPER_ZSIR: 'Prioritás: Hipertrófia > Anatómiai adaptáció > Sérülésmegelőzés > Sportági technikai képzés > Erő.',
};

const WEEKLY_PARAMS: Record<PwronProgramType, {
  power: Record<PwronWeekNumber, WeeklyPowerParams>;
  mainBlock: Record<PwronWeekNumber, WeeklyMainBlockParams>;
  metcon: Record<PwronWeekNumber, WeeklyMetconParams>;
}> = {
  ERO: {
    power: {
      1: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180', exerciseCount: 1 },
      2: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180', exerciseCount: 1 },
      3: { totalReps: '12-16', setPatterns: ['4x3', '5x3', '4x4'], orm: '50-80%', restSec: '180-240', exerciseCount: 1 },
      4: { totalReps: '12-16', setPatterns: ['4x3', '5x3', '4x4'], orm: '50-80%', restSec: '180-240', exerciseCount: 1 },
      5: { totalReps: '12-16', setPatterns: ['4x3', '5x3', '4x4'], orm: '30-50%', restSec: '180-240', exerciseCount: 1 },
      6: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180-240', exerciseCount: 1 },
    },
    mainBlock: {
      1: { totalReps: '25-30', setPatterns: ['5x5', '4x6', '6x4', '6x5'], orm: '75-80%', restSec: '90-120', mainExerciseCount: '2-3', suppExerciseCount: 2 },
      2: { totalReps: '12-15', setPatterns: ['5x5', '4x6', '6x4', '6x5'], orm: '70-80%', restSec: '120-150', mainExerciseCount: '3', suppExerciseCount: 2 },
      3: { totalReps: '9-10', setPatterns: ['6x3', '5x2', '5x3', '6x2', '3x3', '4x3'], orm: '80-90%', restSec: '120-180', mainExerciseCount: '3', suppExerciseCount: 2 },
      4: { totalReps: '9-10', setPatterns: ['6x3', '5x2', '5x3', '6x2', '3x3', '4x3'], orm: '80-90%', restSec: '120-180', mainExerciseCount: '3', suppExerciseCount: 2 },
      5: { totalReps: '9-10', setPatterns: ['6x3', '5x2', '5x3', '6x2', '3x3', '4x3'], orm: '80-90%', restSec: '120-180', mainExerciseCount: '3', suppExerciseCount: 2 },
      6: { totalReps: '12-15', setPatterns: ['5x5', '4x6', '6x4', '6x5'], orm: '70-80%', restSec: '120-150', mainExerciseCount: '3', suppExerciseCount: 2 },
    },
    metcon: {
      1: { intervalSec: 15, restSec: '90', totalMinutes: 6 },
      2: { intervalSec: 15, restSec: '90', totalMinutes: 7 },
      3: { intervalSec: 15, restSec: '80', totalMinutes: 8 },
      4: { intervalSec: 15, restSec: '80', totalMinutes: 9 },
      5: { intervalSec: 15, restSec: '80', totalMinutes: 10 },
      6: { intervalSec: 15, restSec: '80', totalMinutes: 11 },
    },
  },
  HIPERTROFIA: {
    power: {
      1: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180', exerciseCount: 1 },
      2: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180', exerciseCount: 1 },
      3: { totalReps: '12-16', setPatterns: ['4x3', '5x3', '4x4'], orm: '50-80%', restSec: '180-240', exerciseCount: 1 },
      4: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180', exerciseCount: 1 },
      5: { totalReps: '12-16', setPatterns: ['4x3', '5x3', '4x4'], orm: '30-50%', restSec: '180-240', exerciseCount: 1 },
      6: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180-240', exerciseCount: 1 },
    },
    mainBlock: {
      1: { totalReps: '35-40', setPatterns: ['6x6', '6x8', '8x6', '5x8', '4x12', '5x10'], orm: '70%', restSec: '90', mainExerciseCount: '3', suppExerciseCount: 2 },
      2: { totalReps: '40-50', setPatterns: ['6x6', '6x8', '8x6', '5x8', '4x12', '5x10'], orm: '70-75%', restSec: '75', mainExerciseCount: '3', suppExerciseCount: 2 },
      3: { totalReps: '35-45', setPatterns: ['6x6', '6x8', '8x6', '5x8', '4x12', '5x10'], orm: '70-80%', restSec: '60', mainExerciseCount: '3', suppExerciseCount: 2 },
      4: { totalReps: '40-50', setPatterns: ['6x6', '6x8', '8x6', '5x8', '4x12', '5x10'], orm: '70-75%', restSec: '60', mainExerciseCount: '3', suppExerciseCount: 2 },
      5: { totalReps: '35-45', setPatterns: ['6x6', '6x8', '8x6', '5x8', '4x12', '5x10'], orm: '70-80%', restSec: '60', mainExerciseCount: '3', suppExerciseCount: 2 },
      6: { totalReps: '40-45', setPatterns: ['6x6', '6x8', '8x6', '5x8', '4x12', '5x10'], orm: '75-80%', restSec: '60-90', mainExerciseCount: '3', suppExerciseCount: 2 },
    },
    metcon: {
      1: { intervalSec: 30, restSec: '90', totalMinutes: 8 },
      2: { intervalSec: 30, restSec: '90', totalMinutes: 9 },
      3: { intervalSec: 30, restSec: '70', totalMinutes: 9 },
      4: { intervalSec: 30, restSec: '80', totalMinutes: 10 },
      5: { intervalSec: 30, restSec: '60', totalMinutes: 9 },
      6: { intervalSec: 30, restSec: '60', totalMinutes: 10 },
    },
  },
  HIPER_ZSIR: {
    power: {
      1: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180', exerciseCount: 1 },
      2: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180', exerciseCount: 1 },
      3: { totalReps: '12-16', setPatterns: ['4x3', '5x3', '4x4'], orm: '50-80%', restSec: '180-240', exerciseCount: 1 },
      4: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180', exerciseCount: 1 },
      5: { totalReps: '12-16', setPatterns: ['4x3', '5x3', '4x4'], orm: '30-50%', restSec: '180-240', exerciseCount: 1 },
      6: { totalReps: '30-40', setPatterns: ['6x6', '6x4', '6x5'], orm: '30-50%', restSec: '180-240', exerciseCount: 1 },
    },
    mainBlock: {
      1: { totalReps: '35-40', setPatterns: ['4x12', '5x10', '5x8', '4x10'], orm: '70%', restSec: '60', mainExerciseCount: '3', suppExerciseCount: 2 },
      2: { totalReps: '40-50', setPatterns: ['4x12', '5x10', '5x8', '4x10'], orm: '70-75%', restSec: '45', mainExerciseCount: '3', suppExerciseCount: 2 },
      3: { totalReps: '35-45', setPatterns: ['4x12', '5x10', '5x8', '4x10'], orm: '70-80%', restSec: '30', mainExerciseCount: '3', suppExerciseCount: 2 },
      4: { totalReps: '40-50', setPatterns: ['4x12', '5x10', '5x8', '4x10'], orm: '70-75%', restSec: '30', mainExerciseCount: '3', suppExerciseCount: 2 },
      5: { totalReps: '35-45', setPatterns: ['4x12', '5x10', '5x8', '4x10'], orm: '70-80%', restSec: '30', mainExerciseCount: '3', suppExerciseCount: 2 },
      6: { totalReps: '40-45', setPatterns: ['4x12', '5x10', '5x8', '4x10'], orm: '75-80%', restSec: '30-60', mainExerciseCount: '3', suppExerciseCount: 2 },
    },
    metcon: {
      1: { intervalSec: 30, restSec: '90', totalMinutes: 8 },
      2: { intervalSec: 30, restSec: '90', totalMinutes: 9 },
      3: { intervalSec: 30, restSec: '70', totalMinutes: 9 },
      4: { intervalSec: 30, restSec: '80', totalMinutes: 10 },
      5: { intervalSec: 30, restSec: '60', totalMinutes: 9 },
      6: { intervalSec: 30, restSec: '60', totalMinutes: 10 },
    },
  },
};

const EXERCISES: {
  power: Record<PwronSessionVariant, CatalogExercise>;
  mainExercises: Record<PwronSessionVariant, CatalogExercise[]>;
  suppExercises: Record<PwronSessionVariant, CatalogExercise[]>;
  metcon: Record<PwronSessionVariant, CatalogMetconExercise>;
} = {
  power: {
    A: { name: 'Dead swing', sets: 5, reps: 5, weightSlots: 5 },
    B: { name: 'Dobozra ugrás lelépéssel', sets: 6, reps: 5, weightSlots: 5 },
  },
  mainExercises: {
    A: [
      { name: 'Egykezes nyomás padon', sets: 6, reps: 6, weightSlots: 5 },
      { name: 'Fűrészelés döntött törzzsel', sets: 6, reps: 6, weightSlots: 5 },
      { name: 'Goblet guggolás', sets: 6, reps: 5, weightSlots: 5 },
    ],
    B: [
      { name: 'Katonai nyomás / BUP', sets: 6, reps: 6, weightSlots: 5 },
      { name: 'Húzódzkodás', sets: 6, reps: 6, weightSlots: 5 },
      { name: 'Egylábas deadlift', sets: 6, reps: 5, weightSlots: 5 },
    ],
  },
  suppExercises: {
    A: [
      { name: 'Tricepsz padon', sets: 3, reps: 10 },
      { name: 'Áthúzás', sets: 3, reps: 10 },
    ],
    B: [
      { name: 'Bicepsz kettlebellel', sets: 3, reps: 10 },
      { name: 'Szupináció clubbell', sets: 3, reps: 10 },
    ],
  },
  metcon: {
    A: { name: 'Ropeworkout / dupla hullám', baseDuration: '10 perc' },
    B: { name: 'Kettlebell swing', baseDuration: '8 perc' },
  },
};

const CORE_EXERCISES: Record<PwronSessionVariant, CatalogExercise[]> = {
  A: [
    { name: 'Kisétálós fekvőtámasz', sets: 3, reps: 10 },
    { name: 'Órajárás', sets: 2, reps: 'kör' },
  ],
  B: [
    { name: 'Medvejárás', sets: 3, reps: '1 perc' },
  ],
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findExerciseByName(exercises: Exercise[], name: string): Exercise | undefined {
  const normalizedTarget = normalizeText(name);
  const searchTerms = [
    normalizedTarget,
    ...(EXERCISE_NAME_ALIASES[normalizedTarget] || []).map((alias) => normalizeText(alias)),
  ];

  const exactMatch = exercises.find((exercise) => searchTerms.includes(normalizeText(exercise.name)));
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = exercises.find((exercise) => {
    const normalizedExerciseName = normalizeText(exercise.name);

    return searchTerms.some((term) => (
      term.length >= 4 && (normalizedExerciseName.includes(term) || term.includes(normalizedExerciseName))
    ));
  });

  if (partialMatch) {
    return partialMatch;
  }

  return undefined;
}

function buildPowerInstruction(params: WeeklyPowerParams): string {
  return [
    `Heti prescription: ${params.setPatterns.join(', ')}`,
    `Total ismétlés/gyakorlat: ${params.totalReps}`,
    `1RM: ${params.orm}`,
    `Pihenő: ${params.restSec} mp`,
    `Gyakorlatok száma: ${params.exerciseCount}`,
  ].join(' | ');
}

function buildMainInstruction(params: WeeklyMainBlockParams): string {
  return [
    `Heti prescription: ${params.setPatterns.join(', ')}`,
    `Total ismétlés/gyakorlat: ${params.totalReps}`,
    `1RM: ${params.orm}`,
    `Pihenő: ${params.restSec} mp`,
    `Fő gyakorlatok száma: ${params.mainExerciseCount}`,
    `Kiegészítő gyakorlatok: ${params.suppExerciseCount}`,
  ].join(' | ');
}

function buildMetconInstruction(params: WeeklyMetconParams, baseDuration: string): string {
  return [
    `Program lap alap időtartam: ${baseDuration}`,
    `Munka intervallum: ${params.intervalSec} mp`,
    `Pihenő: ${params.restSec} mp`,
    `Teljes munkaidő: ${params.totalMinutes} perc`,
  ].join(' | ');
}

function resolvePlaceholderId(name: string, fallback: string): string {
  const normalized = normalizeText(name);

  if (normalized.includes('dead swing')) return 'placeholder-pwron-power-swing';
  if (normalized.includes('dobozra ugras')) return 'placeholder-pwron-power-jump';
  if (normalized.includes('egykezes nyomas padon')) return 'placeholder-pwron-main-horizontal-push';
  if (normalized.includes('fureszeles')) return 'placeholder-pwron-main-horizontal-pull';
  if (normalized.includes('goblet guggolas')) return 'placeholder-pwron-main-knee';
  if (normalized.includes('katonai nyomas') || normalized.includes('bup')) return 'placeholder-pwron-main-vertical-push';
  if (normalized.includes('huzodzkodas')) return 'placeholder-pwron-main-vertical-pull';
  if (normalized.includes('egylabas deadlift')) return 'placeholder-pwron-main-hip';
  if (normalized.includes('ropeworkout')) return 'placeholder-pwron-metcon-rope';
  if (normalized.includes('kettlebell swing')) return 'placeholder-pwron-metcon-swing';
  if (normalized.includes('swing')) return 'placeholder-pwron-skill-swing';
  if (normalized.includes('smr')) return 'placeholder-pwron-smr';
  if (normalized.includes('pfe')) return 'placeholder-pwron-pfe';
  if (normalized.includes('happy baby') || normalized.includes('x roll')) return 'placeholder-pwron-integration';

  return fallback;
}

function createExerciseEntry(
  catalogExercise: { name: string; sets: number; reps: number | string },
  availableExercises: Exercise[],
  instruction?: string,
  restPeriod?: number,
  fallbackPlaceholder = 'placeholder-pwron-generic'
): WorkoutExercise {
  const matchedExercise = findExerciseByName(availableExercises, catalogExercise.name);

  return {
    exerciseId: matchedExercise?.id || resolvePlaceholderId(catalogExercise.name, fallbackPlaceholder),
    name: catalogExercise.name,
    sets: catalogExercise.sets,
    reps: String(catalogExercise.reps),
    restPeriod,
    instruction,
  };
}

function createFreeBlockExercise(name: string, instruction: string, availableExercises: Exercise[], fallbackPlaceholder: string): WorkoutExercise {
  const matchedExercise = findExerciseByName(availableExercises, name);

  return {
    exerciseId: matchedExercise?.id || resolvePlaceholderId(name, fallbackPlaceholder),
    name,
    sets: 1,
    reps: 'szabad mező',
    instruction,
    restPeriod: 0,
  };
}

export function getPwronProgramTypeLabel(programType: PwronProgramType): string {
  return PWRON_PROGRAM_OPTIONS.find((option) => option.value === programType)?.label || programType;
}

export async function generatePwronWorkoutPlan(options: {
  userId: string;
  programType: PwronProgramType;
  weekNumber: PwronWeekNumber;
  sessionVariant: PwronSessionVariant;
  athleteName?: string;
}): Promise<GeneratedWorkoutPlan> {
  const { userId, programType, weekNumber, sessionVariant, athleteName } = options;
  const availableExercises = await getExercises();
  const weeklyParams = WEEKLY_PARAMS[programType];
  const powerParams = weeklyParams.power[weekNumber];
  const mainParams = weeklyParams.mainBlock[weekNumber];
  const metconParams = weeklyParams.metcon[weekNumber];
  const mainBlockLabel = MAIN_BLOCK_LABEL[programType];
  const powerExercise = EXERCISES.power[sessionVariant];
  const mainExercises = EXERCISES.mainExercises[sessionVariant];
  const suppExercises = EXERCISES.suppExercises[sessionVariant];
  const metconExercise = EXERCISES.metcon[sessionVariant];
  const coreExercises = CORE_EXERCISES[sessionVariant];

  const sections: WorkoutSectionGenerated[] = [
    {
      name: 'PFE',
      exercises: [
        createFreeBlockExercise(
          'Teljes PFE',
          'Szabad mező a teljes PFE blokkhoz a Program lap alapján.',
          availableExercises,
          'placeholder-pwron-pfe'
        ),
      ],
    },
    {
      name: 'Mobilitás / SMR',
      exercises: [
        createFreeBlockExercise(
          'SMR',
          'Szabad mező az SMR részhez.',
          availableExercises,
          'placeholder-pwron-smr'
        ),
        createFreeBlockExercise(
          'Happy baby + X roll',
          'Fix integrációs blokk a Program lap alapján.',
          availableExercises,
          'placeholder-pwron-integration'
        ),
      ],
    },
    {
      name: 'Törzs koordináció',
      exercises: coreExercises.map((exercise) => createExerciseEntry(exercise, availableExercises, 'Fix blokk a Program lap alapján.')),
    },
    {
      name: 'Szub-plyo',
      exercises: [
        createExerciseEntry(
          { name: 'Ugrálókötél', sets: 3, reps: 20 },
          availableExercises,
          'Fix blokk a Program lap alapján.'
        ),
      ],
    },
    {
      name: 'Készségfejlesztés',
      exercises: [
        createFreeBlockExercise(
          'Swing',
          'Szabad mező a swing készségfejlesztő blokkhoz.',
          availableExercises,
          'placeholder-pwron-skill-swing'
        ),
      ],
    },
    {
      name: 'Power',
      exercises: [
        createExerciseEntry(
          powerExercise,
          availableExercises,
          buildPowerInstruction(powerParams),
          Number.parseInt(powerParams.restSec.split('-')[0], 10) || 180
        ),
      ],
    },
    {
      name: mainBlockLabel,
      exercises: [
        ...mainExercises.map((exercise) => createExerciseEntry(
          exercise,
          availableExercises,
          buildMainInstruction(mainParams),
          Number.parseInt(mainParams.restSec.split('-')[0], 10) || 90
        )),
        ...suppExercises.map((exercise) => createExerciseEntry(
          exercise,
          availableExercises,
          'Fix kiegészítő gyakorlat a Program lap alapján. Nem heti-változó: 3x10.',
          60
        )),
      ],
    },
    {
      name: 'Metabolikus blokk',
      exercises: [
        createExerciseEntry(
          { name: metconExercise.name, sets: 1, reps: `${metconParams.totalMinutes} perc` },
          availableExercises,
          buildMetconInstruction(metconParams, metconExercise.baseDuration),
          Number.parseInt(metconParams.restSec.split('-')[0], 10) || 60
        ),
      ],
    },
    {
      name: 'Regenerációs blokk',
      exercises: [
        createFreeBlockExercise(
          'PFE / SMR',
          'Szabad regenerációs blokk a Program lap alapján.',
          availableExercises,
          'placeholder-pwron-recovery'
        ),
      ],
    },
  ];

  const athleteNote = athleteName ? `Sportoló: ${athleteName}. ` : '';
  const programLabel = getPwronProgramTypeLabel(programType);

  return {
    title: `Pwron ${programLabel} - ${weekNumber}. hét - ${sessionVariant} variáns`,
    description: `Pwron ${programLabel} program a Program lap sablonja és a ${weekNumber}. heti periodizáció alapján (${sessionVariant} variáns).`,
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    sections,
    notes: `${athleteNote}${PRIORITY_SUMMARY[programType]} Power: ${buildPowerInstruction(powerParams)}. ${mainBlockLabel}: ${buildMainInstruction(mainParams)}. Metcon: ${buildMetconInstruction(metconParams, metconExercise.baseDuration)}.`,
    user_id: userId,
  };
}