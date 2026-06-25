import { z } from 'zod';

export const workoutSchema = z.object({
  title: z.string().min(1, 'A cím megadása kötelező'),
  date: z.string().min(1, 'A dátum megadása kötelező'),
  duration: z.number().min(1, 'Az időtartam legalább 1 perc legyen'),
  notes: z.string().optional(),
  // Sections are managed via component state and validated manually in onSubmit
  sections: z.array(z.object({
    name: z.string().optional().default(''),
    exercises: z.array(z.object({
      exerciseId: z.string().optional().default(''),
      exerciseName: z.string().optional(),
      sets: z.union([z.number(), z.string(), z.undefined()]).optional(),
      reps: z.union([z.number(), z.string(), z.undefined()]).optional(),
      weight: z.union([z.number(), z.undefined()]).optional(),
      notes: z.string().optional(),
      restPeriod: z.union([z.number(), z.undefined()]).optional(),
    })).optional().default([]),
  })).optional().default([]),
});

export type WorkoutFormData = z.infer<typeof workoutSchema>;

export type SectionExercise = {
  id: string;
  exerciseId?: string;
  name?: string;
  exerciseName?: string;
  sets?: number;
  reps?: number | string;
  weight?: number;
  notes?: string;
  restPeriod?: number;
  // Kardió mezők (cardio-session típusú exercise-nél)
  cardioActivityType?: string;
  cardioDuration?: number;
  cardioDistance?: number;
  cardioSpeed?: number;
  cardioIncline?: number;
};

export type Section = {
  id: string;
  name: string;
  exercises: SectionExercise[];
};

export type PlannerMode = 'template' | 'periodized' | 'pwron' | 'longevity';

export const createDefaultExercise = (id: string): SectionExercise => ({
  id,
  sets: 3,
  reps: 8,
  weight: undefined,
  notes: '',
  restPeriod: undefined,
});

export const createDefaultSection = (id: string, name = ''): Section => ({
  id,
  name,
  exercises: [createDefaultExercise(`${id}-1`)],
});

export const getDifficultyLabel = (difficulty?: number) => {
  if (!difficulty) return 'Nincs megadva';

  if (difficulty <= 2) return 'Könnyű';
  if (difficulty === 3) return 'Közepes';
  return 'Haladó';
};

export const normalizeHungarianText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('hu')
  .replace(/\s+/g, ' ')
  .trim();

export type PlaceholderExerciseMeta = {
  title: string;
  description: string;
  categoryId?: string;
  categoryLabel?: string;
  movementPatternId?: string;
  movementPatternLabel?: string;
};

export const getPlaceholderExerciseMeta = (placeholderId?: string): PlaceholderExerciseMeta | null => {
  if (!placeholderId?.startsWith('placeholder-')) {
    return null;
  }

  if (placeholderId.includes('terddom-bi')) {
    return {
      title: 'Térd domináns bilaterális gyakorlat',
      description: 'Keress egy kétoldali, térd domináns fő gyakorlatot ehhez a blokkhoz.',
      movementPatternId: 'knee_dominant_bilateral',
      movementPatternLabel: 'Térd domináns – bilaterális',
    };
  }

  if (placeholderId.includes('terddom-uni')) {
    return {
      title: 'Térd domináns unilaterális gyakorlat',
      description: 'Keress egy egyoldali, térd domináns gyakorlatot oldalankénti munkához.',
      movementPatternId: 'knee_dominant_unilateral',
      movementPatternLabel: 'Térd domináns – unilaterális',
    };
  }

  if (placeholderId.includes('csipo-bi')) {
    return {
      title: 'Csípő domináns bilaterális gyakorlat',
      description: 'Keress egy kétoldali csípő domináns fő emelést vagy hinget.',
      movementPatternId: 'hip_dominant_bilateral',
      movementPatternLabel: 'Csípő domináns – bilaterális',
    };
  }

  if (placeholderId.includes('csipo-uni')) {
    return {
      title: 'Csípő domináns unilaterális gyakorlat',
      description: 'Keress egy egyoldali csípő domináns gyakorlatot stabilitási fókuszhoz.',
      movementPatternId: 'hip_dominant_unilateral',
      movementPatternLabel: 'Csípő domináns – unilaterális',
    };
  }

  if (placeholderId.includes('csipo-hajlitott')) {
    return {
      title: 'Csípő domináns hajlított lábas gyakorlat',
      description: 'Keress egy hajlított lábas hinge variációt vagy csípődomináns gyakorlatot.',
      movementPatternId: 'hip_dominant_bilateral',
      movementPatternLabel: 'Csípő domináns – bilaterális',
    };
  }

  if (placeholderId.includes('csipo-nyujtott')) {
    return {
      title: 'Csípő domináns nyújtott lábas gyakorlat',
      description: 'Keress egy nyújtott lábas hinge vagy posterior chain fókuszú gyakorlatot.',
      movementPatternId: 'hip_dominant_bilateral',
      movementPatternLabel: 'Csípő domináns – bilaterális',
    };
  }

  if (placeholderId.includes('horiz-nyomas-bi')) {
    return {
      title: 'Horizontális nyomás bilaterális gyakorlat',
      description: 'Keress egy kétoldali horizontális nyomó gyakorlatot a fő blokkhoz.',
      movementPatternId: 'horizontal_push_bilateral',
      movementPatternLabel: 'Horizontális nyomás – bilaterális',
    };
  }

  if (placeholderId.includes('horiz-nyomas-uni')) {
    return {
      title: 'Horizontális nyomás unilaterális gyakorlat',
      description: 'Keress egy egyoldali horizontális nyomó gyakorlatot stabilitási terheléssel.',
      movementPatternId: 'horizontal_push_unilateral',
      movementPatternLabel: 'Horizontális nyomás – unilaterális',
    };
  }

  if (placeholderId.includes('horiz-huzas-bi')) {
    return {
      title: 'Horizontális húzás bilaterális gyakorlat',
      description: 'Keress egy kétoldali horizontális húzó gyakorlatot a blokk egyensúlyához.',
      movementPatternId: 'horizontal_pull_bilateral',
      movementPatternLabel: 'Horizontális húzás – bilaterális',
    };
  }

  if (placeholderId.includes('horiz-huzas-uni')) {
    return {
      title: 'Horizontális húzás unilaterális gyakorlat',
      description: 'Keress egy egyoldali horizontális húzó gyakorlatot törzsstabilitási terheléssel.',
      movementPatternId: 'horizontal_pull_unilateral',
      movementPatternLabel: 'Horizontális húzás – unilaterális',
    };
  }

  if (placeholderId.includes('vert-nyomas-bi')) {
    return {
      title: 'Vertikális nyomás bilaterális gyakorlat',
      description: 'Keress egy kétoldali fej fölé nyomó gyakorlatot.',
      movementPatternId: 'vertical_push_bilateral',
      movementPatternLabel: 'Vertikális nyomás – bilaterális',
    };
  }

  if (placeholderId.includes('vert-nyomas-uni')) {
    return {
      title: 'Vertikális nyomás unilaterális gyakorlat',
      description: 'Keress egy egyoldali fej fölé nyomó gyakorlatot kontrollált kivitelezéssel.',
      movementPatternId: 'vertical_push_unilateral',
      movementPatternLabel: 'Vertikális nyomás – unilaterális',
    };
  }

  if (placeholderId.includes('vert-huzas')) {
    return {
      title: 'Vertikális húzás gyakorlat',
      description: 'Keress egy vertikális húzó gyakorlatot, ami illik a blokk terheléséhez.',
      movementPatternId: 'vertical_pull_bilateral',
      movementPatternLabel: 'Vertikális húzás – bilaterális',
    };
  }

  if (placeholderId.includes('fms')) {
    return {
      title: 'FMS korrekciós gyakorlat',
      description: 'Keress egy mobilizációs vagy korrekciós gyakorlatot az FMS ajánláshoz igazítva.',
      movementPatternId: 'mobilization',
      movementPatternLabel: 'Mobilizálás',
    };
  }

  if (placeholderId.includes('core')) {
    return {
      title: 'Core vagy stabilizáló gyakorlat',
      description: 'Keress egy törzsstabilitást vagy kontrollt fejlesztő gyakorlatot ehhez a blokkhoz.',
      movementPatternId: 'core_other',
      movementPatternLabel: 'Core – egyéb',
    };
  }

  if (placeholderId.includes('gait')) {
    return {
      title: 'Gait vagy cipelés gyakorlat',
      description: 'Keress egy gait, cipelés vagy járásmintát fejlesztő gyakorlatot.',
      movementPatternId: 'gait_stability',
      movementPatternLabel: 'Gait – törzs stabilitás',
    };
  }

  if (placeholderId.includes('stretch')) {
    return {
      title: 'Horpaszizom nyújtás',
      description: 'Keress egy csípőhajlító vagy horpaszizom nyújtó gyakorlatot a blokk elejére.',
      movementPatternId: 'mobilization',
      movementPatternLabel: 'Mobilizálás',
    };
  }

  if (placeholderId.includes('rotacios')) {
    return {
      title: 'Rotációs vagy anti-rotációs gyakorlat',
      description: 'Keress egy törzs rotációs kontrollját fejlesztő gyakorlatot.',
      movementPatternId: 'stability_anti_rotation',
      movementPatternLabel: 'Stabilitás – anti-rotáció',
    };
  }

  if (placeholderId.includes('rehab')) {
    return {
      title: 'Regenerációs vagy rehabilitációs gyakorlat',
      description: 'Keress egy alacsony terhelésű, mobilizáló vagy korrekciós gyakorlatot.',
      movementPatternId: 'mobilization',
      movementPatternLabel: 'Mobilizálás',
    };
  }

  if (placeholderId.includes('pwron-power-swing')) {
    return {
      title: 'Pwron power swing gyakorlat',
      description: 'Keress swing vagy robbanékony csípődomináns gyakorlatot a Power blokkhoz.',
      categoryId: 'kettlebell',
      categoryLabel: 'Kettlebell',
      movementPatternId: 'hip_dominant_bilateral',
      movementPatternLabel: 'Csípő domináns – bilaterális',
    };
  }

  if (placeholderId.includes('pwron-power-jump')) {
    return {
      title: 'Pwron power ugrás gyakorlat',
      description: 'Keress robbanékony ugrás variációt a Power blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'knee_dominant_bilateral',
      movementPatternLabel: 'Térd domináns – bilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-horizontal-push')) {
    return {
      title: 'Pwron horizontális nyomás gyakorlat',
      description: 'Keress egy horizontális nyomó gyakorlatot a Pwron fő blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'horizontal_push_unilateral',
      movementPatternLabel: 'Horizontális nyomás – unilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-horizontal-pull')) {
    return {
      title: 'Pwron horizontális húzás gyakorlat',
      description: 'Keress egy horizontális húzó gyakorlatot a Pwron fő blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'horizontal_pull_unilateral',
      movementPatternLabel: 'Horizontális húzás – unilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-vertical-push')) {
    return {
      title: 'Pwron vertikális nyomás gyakorlat',
      description: 'Keress egy vertikális nyomó gyakorlatot a Pwron fő blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'vertical_push_unilateral',
      movementPatternLabel: 'Vertikális nyomás – unilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-vertical-pull')) {
    return {
      title: 'Pwron vertikális húzás gyakorlat',
      description: 'Keress egy vertikális húzó gyakorlatot a Pwron fő blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'vertical_pull_bilateral',
      movementPatternLabel: 'Vertikális húzás – bilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-knee')) {
    return {
      title: 'Pwron térd domináns gyakorlat',
      description: 'Keress egy térd domináns fő gyakorlatot a Pwron blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'knee_dominant_bilateral',
      movementPatternLabel: 'Térd domináns – bilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-hip')) {
    return {
      title: 'Pwron csípő domináns gyakorlat',
      description: 'Keress egy csípő domináns fő gyakorlatot a Pwron blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'hip_dominant_unilateral',
      movementPatternLabel: 'Csípő domináns – unilaterális',
    };
  }

  if (placeholderId.includes('pwron-metcon-rope') || placeholderId.includes('pwron-metcon-swing')) {
    return {
      title: 'Pwron metcon gyakorlat',
      description: 'Keress egy kondicionáló gyakorlatot a Pwron metabolikus blokkhoz.',
      categoryId: placeholderId.includes('rope') ? 'cardio' : 'kettlebell',
      categoryLabel: placeholderId.includes('rope') ? 'Kardió' : 'Kettlebell',
      movementPatternId: undefined,
      movementPatternLabel: undefined,
    };
  }

  if (placeholderId.includes('pwron-pfe') || placeholderId.includes('pwron-smr') || placeholderId.includes('pwron-integration') || placeholderId.includes('pwron-recovery') || placeholderId.includes('pwron-skill-swing')) {
    return {
      title: 'Pwron szabad mezős blokk',
      description: 'A Program lap alapján szabadon kitölthető blokk, amelyhez választhatsz gyakorlatot a könyvtárból.',
      categoryId: placeholderId.includes('skill-swing') ? 'kettlebell' : placeholderId.includes('smr') ? 'smr' : placeholderId.includes('recovery') ? 'recovery' : placeholderId.includes('integration') ? 'mobility_flexibility' : 'fms',
      categoryLabel: placeholderId.includes('skill-swing') ? 'Kettlebell' : placeholderId.includes('smr') ? 'SMR' : placeholderId.includes('recovery') ? 'Regeneráció' : placeholderId.includes('integration') ? 'Mobilitás/Nyújtás' : 'FMS',
      movementPatternId: placeholderId.includes('skill-swing') ? 'hip_dominant_bilateral' : placeholderId.includes('integration') ? 'mobilization' : undefined,
      movementPatternLabel: placeholderId.includes('skill-swing') ? 'Csípő domináns – bilaterális' : placeholderId.includes('integration') ? 'Mobilizálás' : undefined,
    };
  }

  return {
    title: 'Generált helykitöltő gyakorlat',
    description: 'Válassz egy valós gyakorlatot a blokk céljának megfelelően.',
    movementPatternId: undefined,
    movementPatternLabel: undefined,
  };
};
