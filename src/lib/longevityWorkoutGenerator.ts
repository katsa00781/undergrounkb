import { getExercises, Exercise } from './exercises';
import { GeneratedWorkoutPlan, WorkoutExercise, WorkoutSectionGenerated } from './workoutGenerator.fixed';

// ---------------------------------------------------------------------------
// Domén-fogalmak (a spec 2. fejezete) — a "tiszta" 4 hetes Longevity protokoll.
// A műszak-alapú terhelésmoduláció (spec 10. fej.) szándékosan kimaradt: az
// `[S]` (származtatott) és a spec maga is nyitott kérdésként jelöli.
// ---------------------------------------------------------------------------

export type LongevityModality = 'STRENGTH' | 'STATO_DYNAMIC' | 'AGT';
export type LongevityWeekNumber = 1 | 2 | 3 | 4;
export type LongevityAgtVariant = 'KETTLEBELL_SWING' | 'AIRDYNE' | 'HILL_SPRINT';
export type LongevityCnsLoad = 'HIGH' | 'LOW' | 'MEDIUM';

type DayOfWeek = 'Hétfő' | 'Szerda' | 'Péntek';

type StrengthWeekParams = {
  sets: number;
  reps: string;
  loadGoal: string;
};

type StatoWeekParams = {
  sets: number;
  workSec: number;
  loadPct: string;
};

type AgtWeekParams = {
  rounds: number;
};

type CatalogExercise = {
  name: string;
  /** Mozgásminta-placeholder substring (lásd getPlaceholderExerciseMeta) */
  pattern: string;
};

type AgtVariantSpec = {
  name: string;
  workSec: number;
  restSec: number;
  pattern: string;
};

// ---------------------------------------------------------------------------
// Konfiguráció (a spec 5.2 [S] paramétertáblái) — az algoritmus ezeket
// paraméterként kapja, nincsenek "bedrótozva" a generáló logikába.
// ---------------------------------------------------------------------------

export const LONGEVITY_MODALITY_OPTIONS: Array<{
  value: LongevityModality;
  label: string;
  day: DayOfWeek;
}> = [
  { value: 'STRENGTH', label: 'Erőfejlesztés', day: 'Hétfő' },
  { value: 'STATO_DYNAMIC', label: 'Stato-dinamikus / motorépítés', day: 'Szerda' },
  { value: 'AGT', label: 'AGT – anti-glikolitikus', day: 'Péntek' },
];

export const LONGEVITY_AGT_VARIANT_OPTIONS: Array<{ value: LongevityAgtVariant; label: string }> = [
  { value: 'KETTLEBELL_SWING', label: 'Kettlebell swing (alapértelmezett)' },
  { value: 'AIRDYNE', label: 'Airdyne / Assault Bike sprint' },
  { value: 'HILL_SPRINT', label: 'Rövid dombfutás' },
];

const MODALITY_CNS: Record<LongevityModality, LongevityCnsLoad> = {
  STRENGTH: 'HIGH',
  STATO_DYNAMIC: 'LOW',
  AGT: 'LOW',
};

const STRENGTH_PARAMS: Record<LongevityWeekNumber, StrengthWeekParams> = {
  1: { sets: 3, reps: '6-8', loadGoal: 'technikai súly, RPE ~7' },
  2: { sets: 4, reps: '5-8', loadGoal: '+terhelés, utolsó 2-3 ism. nehéz' },
  3: { sets: 4, reps: '5-6', loadGoal: '+terhelés, RPE ~8' },
  4: { sets: 5, reps: '5', loadGoal: 'csúcsterhelés, utolsó szettek maximálishoz közeli' },
};

const STATO_PARAMS: Record<LongevityWeekNumber, StatoWeekParams> = {
  1: { sets: 3, workSec: 30, loadPct: '30%' },
  2: { sets: 3, workSec: 35, loadPct: '35%' },
  3: { sets: 4, workSec: 40, loadPct: '40%' },
  4: { sets: 5, workSec: 40, loadPct: '40-45%' },
};

const AGT_PARAMS: Record<LongevityWeekNumber, AgtWeekParams> = {
  1: { rounds: 15 },
  2: { rounds: 18 },
  3: { rounds: 21 },
  4: { rounds: 24 },
};

// Fix (heti változótól független) protokoll-konstansok a spec 4. fejezetéből.
const STRENGTH_REST_SEC = 150; // 2-3 perc, teljes regeneráció
const STRENGTH_FINISHER_MIN = '5-6';
const STATO_REST_SEC = 90; // 1-2 perc
const STATO_TEMPO = '2-0-2-0'; // 2 mp le / 2 mp fel
const STATO_FINISHER_MIN = 10;
const AGT_MAX_HR = 130;

const AGT_VARIANTS: Record<LongevityAgtVariant, AgtVariantSpec> = {
  KETTLEBELL_SWING: { name: 'Kettlebell swing', workSec: 8, restSec: 52, pattern: 'csipo-bi' },
  AIRDYNE: { name: 'Airdyne / Assault Bike sprint', workSec: 7, restSec: 53, pattern: 'cardio' },
  HILL_SPRINT: { name: 'Rövid dombfutás sprint', workSec: 6, restSec: 54, pattern: 'gait' },
};

// Gyakorlat-könyvtár (spec 7. fejezet) — kettlebell-fókuszú implementációk.
const STRENGTH_EXERCISES: CatalogExercise[] = [
  { name: 'Goblet / front guggolás', pattern: 'terddom-bi' },
  { name: 'Kettlebell fekvőnyomás (floor press)', pattern: 'horiz-nyomas-bi' },
  { name: 'Kettlebell hajlított evezés', pattern: 'horiz-huzas-bi' },
  { name: 'Húzódzkodás', pattern: 'vert-huzas' },
];

const STATO_EXERCISES: CatalogExercise[] = [
  { name: 'Goblet guggolás', pattern: 'terddom-bi' },
  { name: 'Kettlebell kitörés', pattern: 'terddom-uni' },
  { name: 'Kettlebell evezés', pattern: 'horiz-huzas-bi' },
  { name: 'Fekvőtámasz', pattern: 'horiz-nyomas-bi' },
];

const EXERCISE_NAME_ALIASES: Record<string, string[]> = {
  'goblet front guggolas': ['goblet guggolas', 'goblet squat', 'front squat', 'guggolas'],
  'goblet guggolas': ['goblet squat', 'guggolas'],
  'kettlebell fekvonyomas floor press': ['floor press', 'fekvonyomas', 'kettlebell floor press', 'egykezes fekvenyomas'],
  'kettlebell hajlitott evezes': ['evezes dontott torzzsel', 'kettlebell row', 'evezes', 'hajlitott evezes'],
  'kettlebell evezes': ['evezes', 'kettlebell row', 'evezes dontott torzzsel'],
  'huzodzkodas': ['pull up', 'chin up', 'pullup', 'chinup'],
  'kettlebell kitores': ['kitores', 'lunge', 'kitores hatra', 'kettlebell lunge'],
  'fekvotamasz': ['push up', 'fekvotamasz', 'pushup'],
  'kettlebell swing': ['swing', 'kb swing', 'dead swing'],
  'airdyne assault bike sprint': ['airdyne', 'assault bike', 'bike sprint'],
  'rovid dombfutas sprint': ['dombfutas', 'hill sprint', 'futas'],
};

// ---------------------------------------------------------------------------
// Segédek
// ---------------------------------------------------------------------------

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

  return exercises.find((exercise) => {
    const normalizedExerciseName = normalizeText(exercise.name);

    return searchTerms.some((term) => (
      term.length >= 4 && (normalizedExerciseName.includes(term) || term.includes(normalizedExerciseName))
    ));
  });
}

function createExerciseEntry(
  catalog: { name: string; pattern: string },
  sets: number,
  reps: string,
  availableExercises: Exercise[],
  instruction: string,
  restPeriod: number,
): WorkoutExercise {
  const matchedExercise = findExerciseByName(availableExercises, catalog.name);

  return {
    exerciseId: matchedExercise?.id || `placeholder-longevity-${catalog.pattern}`,
    name: catalog.name,
    sets,
    reps,
    restPeriod,
    instruction,
  };
}

function createFreeBlockExercise(name: string, pattern: string, instruction: string): WorkoutExercise {
  return {
    exerciseId: `placeholder-longevity-${pattern}`,
    name,
    sets: 1,
    reps: 'szabad mező',
    restPeriod: 0,
    instruction,
  };
}

export function getLongevityModalityLabel(modality: LongevityModality): string {
  return LONGEVITY_MODALITY_OPTIONS.find((option) => option.value === modality)?.label || modality;
}

export function getLongevityModalityDay(modality: LongevityModality): DayOfWeek {
  return LONGEVITY_MODALITY_OPTIONS.find((option) => option.value === modality)?.day || 'Hétfő';
}

// ---------------------------------------------------------------------------
// Session-metaadat (tiszta, tesztelhető) — a spec napi modalitásait (4. fej.)
// és a heti progressziót (5. fej.) egyetlen struktúrába gyűjti.
// ---------------------------------------------------------------------------

export type LongevitySessionMeta = {
  modality: LongevityModality;
  modalityLabel: string;
  day: DayOfWeek;
  week: LongevityWeekNumber;
  cnsLoad: LongevityCnsLoad;
  strength?: StrengthWeekParams & { restSec: number; finisherMin: string };
  stato?: StatoWeekParams & { restSec: number; tempo: string; finisherMin: number };
  agt?: AgtWeekParams & { workSec: number; restSec: number; maxHr: number; variant: LongevityAgtVariant; exerciseName: string };
};

export function buildLongevitySessionMeta(
  week: LongevityWeekNumber,
  modality: LongevityModality,
  agtVariant: LongevityAgtVariant = 'KETTLEBELL_SWING',
): LongevitySessionMeta {
  const base = {
    modality,
    modalityLabel: getLongevityModalityLabel(modality),
    day: getLongevityModalityDay(modality),
    week,
    cnsLoad: MODALITY_CNS[modality],
  };

  if (modality === 'STRENGTH') {
    return { ...base, strength: { ...STRENGTH_PARAMS[week], restSec: STRENGTH_REST_SEC, finisherMin: STRENGTH_FINISHER_MIN } };
  }

  if (modality === 'STATO_DYNAMIC') {
    return { ...base, stato: { ...STATO_PARAMS[week], restSec: STATO_REST_SEC, tempo: STATO_TEMPO, finisherMin: STATO_FINISHER_MIN } };
  }

  const variant = AGT_VARIANTS[agtVariant];
  return {
    ...base,
    agt: {
      ...AGT_PARAMS[week],
      workSec: variant.workSec,
      restSec: variant.restSec,
      maxHr: AGT_MAX_HR,
      variant: agtVariant,
      exerciseName: variant.name,
    },
  };
}

// ---------------------------------------------------------------------------
// Szekció-építők
// ---------------------------------------------------------------------------

function buildStrengthSections(week: LongevityWeekNumber, exercises: Exercise[]): WorkoutSectionGenerated[] {
  const p = STRENGTH_PARAMS[week];
  const instruction = `Nehéz súly, teljes regeneráció. Az utolsó 2-3 ismétlés legyen extra nehéz (maximálishoz közeli). Terhelés-cél: ${p.loadGoal}. Pihenő 2-3 perc.`;

  return [
    {
      name: 'Főblokk – Klasszikus erőedzés',
      exercises: STRENGTH_EXERCISES.map((exercise) =>
        createExerciseEntry(exercise, p.sets, p.reps, exercises, instruction, STRENGTH_REST_SEC)),
    },
    {
      name: 'Záró blokk – HIIT finisher',
      exercises: [
        createFreeBlockExercise(
          'Rövid HIIT',
          'cardio',
          `${STRENGTH_FINISHER_MIN} perc rövid HIIT. A savasodás-elkerülés a hét későbbi részében a cél; itt még megengedett.`,
        ),
      ],
    },
  ];
}

function buildStatoSections(week: LongevityWeekNumber, exercises: Exercise[]): WorkoutSectionGenerated[] {
  const p = STATO_PARAMS[week];
  const reps = `${p.workSec} mp folyamatos munka`;
  const instruction = `Tempó ${STATO_TEMPO} (2 mp le / 2 mp fel), megállás és tetőpihenő NÉLKÜL – folyamatos feszülés. Terhelés ~${p.loadPct} 1RM. Pihenő 1-2 perc. Ha a sorozat tetején „pihensz", oda a hatás.`;

  return [
    {
      name: 'Főblokk – Stato-dinamikus',
      exercises: STATO_EXERCISES.map((exercise) =>
        createExerciseEntry(exercise, p.sets, reps, exercises, instruction, STATO_REST_SEC)),
    },
    {
      name: 'Záró blokk – Aerob finisher',
      exercises: [
        createFreeBlockExercise(
          'Közepes intenzitású aerob blokk',
          'cardio',
          `${STATO_FINISHER_MIN} perc közepes intenzitású aerob munka az egész rendszer erősítésére.`,
        ),
      ],
    },
  ];
}

function buildAgtSections(
  week: LongevityWeekNumber,
  agtVariant: LongevityAgtVariant,
  exercises: Exercise[],
): WorkoutSectionGenerated[] {
  const p = AGT_PARAMS[week];
  const variant = AGT_VARIANTS[agtVariant];
  const instruction = `${p.rounds} kör. Munka ${variant.workSec} mp max effort, pihenő ${variant.restSec} mp (teljes CP-újratöltődés). Maradj ${AGT_MAX_HR} alatti pulzuson, nincs égés/savasodás. Ha a teljesítmény az elsőhöz képest esik, a session véget ér (a maradék körök elhagyhatók).`;

  return [
    {
      name: 'Főblokk – Anti-glikolitikus (AGT)',
      exercises: [
        createExerciseEntry(
          { name: variant.name, pattern: variant.pattern },
          p.rounds,
          `${variant.workSec} mp / ${variant.restSec} mp pihenő`,
          exercises,
          instruction,
          variant.restSec,
        ),
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Üzleti szabályok / validáció (spec 9. fejezet — a single-session kontextusra
// alkalmazható invariánsok). Figyelmeztetéseket ad vissza, nem dob hibát.
// ---------------------------------------------------------------------------

export function validateLongevitySession(meta: LongevitySessionMeta): string[] {
  const warnings: string[] = [];

  // 1. Sorrend-szabály: a HIGH CNS (erő) nap a hét elejére (hétfő) essen.
  if (meta.cnsLoad === 'HIGH' && meta.day !== 'Hétfő') {
    warnings.push('A magas CNS-terhelésű erőnap a hét elejére (hétfő) ajánlott, friss állapotban.');
  }

  // 3. AGT pulzusplafon
  if (meta.agt && meta.agt.maxHr !== AGT_MAX_HR) {
    warnings.push(`Az AGT pulzusplafon ${AGT_MAX_HR} legyen.`);
  }

  // 7. Progresszió-korlát: AGT körök hetente +3..5
  if (meta.agt && meta.week > 1) {
    const delta = AGT_PARAMS[meta.week].rounds - AGT_PARAMS[(meta.week - 1) as LongevityWeekNumber].rounds;
    if (delta < 3 || delta > 5) {
      warnings.push(`Az AGT körök heti növekménye (${delta}) a +3..5 tartományon kívül esik.`);
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Fő belépési pont — egyetlen Longevity session generálása.
// ---------------------------------------------------------------------------

export async function generateLongevityWorkoutPlan(options: {
  userId: string;
  weekNumber: LongevityWeekNumber;
  modality: LongevityModality;
  agtVariant?: LongevityAgtVariant;
  athleteName?: string;
}): Promise<GeneratedWorkoutPlan> {
  const { userId, weekNumber, modality, agtVariant = 'KETTLEBELL_SWING', athleteName } = options;

  const availableExercises = await getExercises();
  const meta = buildLongevitySessionMeta(weekNumber, modality, agtVariant);

  let sections: WorkoutSectionGenerated[];
  if (modality === 'STRENGTH') {
    sections = buildStrengthSections(weekNumber, availableExercises);
  } else if (modality === 'STATO_DYNAMIC') {
    sections = buildStatoSections(weekNumber, availableExercises);
  } else {
    sections = buildAgtSections(weekNumber, agtVariant, availableExercises);
  }

  const warnings = validateLongevitySession(meta);
  const athleteNote = athleteName ? `Sportoló: ${athleteName}. ` : '';
  const warningNote = warnings.length > 0 ? ` Figyelmeztetés: ${warnings.join(' ')}` : '';

  return {
    title: `Longevity – ${weekNumber}. hét – ${meta.modalityLabel} (${meta.day})`,
    description: `4 hetes Longevity protokoll, ${weekNumber}. hét, ${meta.modalityLabel} modalitás (${meta.day}, CNS-terhelés: ${meta.cnsLoad}).`,
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    sections,
    notes: `${athleteNote}Generált edzésterv – 4 hetes Longevity protokoll. ${meta.day}: ${meta.modalityLabel}. A nem-edzésnapok regenerációs napok – a pihenés a program része.${warningNote}`,
    user_id: userId,
  };
}
