import { supabase } from '../config/supabase';
import { Exercise } from './exercises';
import { FMSAssessment } from './fms';
import { getExercises } from './exercises';

// A generált edzéstípusok
export type WorkoutDay = 1 | 2 | 3 | 4;
export type ProgramType = '2napos' | '3napos' | '4napos';

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
    'térddomináns_bi': [],
    'térddomináns_uni': [],
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

  // Kategorizáljuk a gyakorlatokat a movement_pattern és kategória alapján
  exercises.forEach(exercise => {
    // Bemelegítés
    if (exercise.category.toLowerCase().includes('bemelegítés') || 
        exercise.category.toLowerCase().includes('mobility') ||
        exercise.category.toLowerCase().includes('warmup')) {
      categories['bemelegítés'].push(exercise);
      return;
    }
    
    // Core gyakorlatok
    if (exercise.category.toLowerCase().includes('core') || 
        exercise.movement_pattern.includes('Core') || 
        exercise.movement_pattern.includes('Stabilitás')) {
      categories['core'].push(exercise);
      return;
    }
    
    // Nyújtás
    if (exercise.category.toLowerCase().includes('nyújtás') || 
        exercise.category.toLowerCase().includes('stretching') ||
        exercise.movement_pattern.includes('nyújtás') ||
        exercise.description?.toLowerCase().includes('nyújtás')) {
      categories['nyújtás'].push(exercise);
      return;
    }
    
    // Pilometrikus
    if (exercise.category.toLowerCase().includes('pilometrikus') || 
        exercise.description?.toLowerCase().includes('pilometrikus') ||
        exercise.category.toLowerCase().includes('plyometric')) {
      categories['pilometrikus'].push(exercise);
      return;
    }
    
    // Térd domináns
    if (exercise.movement_pattern.includes('Térd domináns')) {
      if (exercise.movement_pattern.includes('bilaterális')) {
        categories['térddomináns_bi'].push(exercise);
      } else {
        categories['térddomináns_uni'].push(exercise);
      }
      return;
    }

    // Csípő domináns
    if (exercise.movement_pattern.includes('Csípő domináns')) {
      // Hajlított vs nyújtott láb alapján kategorizáljuk
      if (exercise.description?.toLowerCase().includes('hajlított') || 
          exercise.name.toLowerCase().includes('híd') ||
          exercise.name.toLowerCase().includes('good morning')) {
        categories['csípődomináns_hajlított'].push(exercise);
      } else {
        categories['csípődomináns_nyújtott'].push(exercise);
      }
      return;
    }
    
    // Horizontális nyomás
    if (exercise.movement_pattern.includes('Horizontális nyomás')) {
      if (exercise.movement_pattern.includes('bilaterális')) {
        categories['horizontális_nyomás_bi'].push(exercise);
      } else {
        categories['horizontális_nyomás_uni'].push(exercise);
      }
      return;
    }
    
    // Horizontális húzás
    if (exercise.movement_pattern.includes('Horizontális húzás')) {
      if (exercise.movement_pattern.includes('bilaterális')) {
        categories['horizontális_húzás_bi'].push(exercise);
      } else {
        categories['horizontális_húzás_uni'].push(exercise);
      }
      return;
    }
    
    // Vertikális nyomás
    if (exercise.movement_pattern.includes('Vertikális nyomás')) {
      if (exercise.movement_pattern.includes('bilaterális')) {
        categories['vertikális_nyomás_bi'].push(exercise);
      } else {
        categories['vertikális_nyomás_uni'].push(exercise);
      }
      return;
    }
    
    // Vertikális húzás
    if (exercise.movement_pattern.includes('Vertikális húzás')) {
      if (exercise.movement_pattern.includes('bilaterális')) {
        categories['vertikális_húzás_bi'].push(exercise);
      } else {
        categories['vertikális_húzás_uni'].push(exercise);
      }
      return;
    }
    
    // Rotációs
    if (exercise.movement_pattern.includes('anti-rotáció') || 
        exercise.description?.toLowerCase().includes('rotáció')) {
      categories['rotációs'].push(exercise);
      return;
    }
    
    // Gait
    if (exercise.movement_pattern.includes('Gait')) {
      categories['gait'].push(exercise);
      return;
    }
    
    // FMS korrekció
    if (exercise.movement_pattern.includes('korrekció') || 
        exercise.description?.toLowerCase().includes('fms') ||
        exercise.description?.toLowerCase().includes('korrekció')) {
      categories['fms_korrekció'].push(exercise);
      return;
    }
    
    // Rehab
    if (exercise.description?.toLowerCase().includes('rehab') || 
        exercise.category.toLowerCase().includes('rehab') ||
        exercise.category.toLowerCase().includes('recovery')) {
      categories['rehab'].push(exercise);
      return;
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

// 2 napos program generátor
function generate2DayPlan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[],
  day: 1 | 2
): WorkoutSectionGenerated[] {
  const sections: WorkoutSectionGenerated[] = [];
  
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
    // Első nap - Teljes test edzés
    sections.push({
      name: 'Első kör',
      exercises: [
        { // Térddomináns BI
          exerciseId: 'placeholder-terddom-bi',
          name: getRandomExercise(categorizedExercises, 'térddomináns_bi')?.name || 'Térddomináns BI',
          sets: 4,
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
        { // Horizontális nyomás bi
          exerciseId:  'placeholder-horiz-nyomas-bi',
          name: getRandomExercise(categorizedExercises, 'horizontális_nyomás_bi')?.name || 'Horizontális nyomás bi',
          sets: 4,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
    
    sections.push({
      name: 'Második kör',
      exercises: [
        { // Vertikális húzás
          exerciseId:  'placeholder-vert-huzas',
          name: getRandomExercise(categorizedExercises, 'vertikális_húzás_bi')?.name || 'Vertikális húzás',
          sets: 4,
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
          name: getRandomExercise(categorizedExercises, 'csípődomináns_nyújtott')?.name || 'Csípődomináns BI',
          sets: 4,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
  } else if (day === 2) {
    // Második nap - Teljes test edzés más fókusszal
    sections.push({
      name: 'Első kör',
      exercises: [
        { // Térddomináns Uni
          exerciseId:  'placeholder-terddom-uni',
          name: getRandomExercise(categorizedExercises, 'térddomináns_uni')?.name || 'Térddomináns Uni',
          sets: 4,
          reps: '8-10/oldal',
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
        { // Vertikális nyomás
          exerciseId:  'placeholder-vert-nyomas',
          name: getRandomExercise(categorizedExercises, 'vertikális_nyomás_bi')?.name || 'Vertikális nyomás',
          sets: 4,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
    
    sections.push({
      name: 'Második kör',
      exercises: [
        { // Horizontális húzás bi
          exerciseId:  'placeholder-horiz-huzas-bi',
          name: getRandomExercise(categorizedExercises, 'horizontális_húzás_bi')?.name || 'Horizontális húzás bi',
          sets: 4,
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
          name: getRandomExercise(categorizedExercises, 'csípődomináns_hajlított')?.name || 'Csípődomináns Uni',
          sets: 4,
          reps: '8-10/oldal',
          weight: null,
          restPeriod: 90,
        },
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
          exerciseId:  'placeholder-vert-huzas',
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
          name: getRandomExercise(categorizedExercises, 'csípődomináns_nyújtott')?.name || 'Csípődomináns BI',
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
          exerciseId:  'placeholder-vert-nyomas',
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
          name: getRandomExercise(categorizedExercises, 'csípődomináns_hajlított')?.name || 'Csípődomináns Uni',
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
          exerciseId:  'placeholder-vert-huzas',
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
  const sections: WorkoutSectionGenerated[] = [];
  
  // 1. Bemelegítés
  sections.push({
    name: 'Bemelegítés',
    exercises: Array(3).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'bemelegítés');
      return {
        exerciseId: exercise?.id || 'placeholder-warmup',
        name: exercise?.name || 'Dinamikus bemelegítés',
        sets: 1,
        reps: '30-60 mp',
        weight: null,
        restPeriod: 0,
      };
    })
  });
  
  // 2. Pilometrikus gyakorlatok
  sections.push({
    name: 'Pilometrikus gyakorlatok',
    exercises: Array(2).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'pilometrikus');
      return {
        exerciseId: exercise?.id || 'placeholder-plyo',
        name: exercise?.name || 'Pilometrikus gyakorlat',
        sets: 3,
        reps: '5-8',
        weight: null,
        restPeriod: 90,
      };
    })
  });
  
  // 3. Core gyakorlatok
  sections.push({
    name: 'Core gyakorlatok',
    exercises: Array(2).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'core');
      return {
        exerciseId: exercise?.id || 'placeholder-core',
        name: exercise?.name || 'Core gyakorlat',
        sets: 3,
        reps: '10-12',
        weight: null,
        restPeriod: 60,
      };
    })
  });
  
  // 4. Horpaszizom nyújtás
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
      instruction: 'Mindkét oldalra végezze el'
    }]
  });
  
  // 5. Első kör - A struktúra: Térddomináns Bi/Uni, FMS korrekció, Horizontális/Vertikális nyomás Bi/Uni
  const fmsCorrection1 = fmsCorrections.length > 0 ? 
    getRandomExercise(categorizedExercises, 'fms_korrekció') : null;
  
  // Először a szükséges gyakorlatokat választjuk ki, hogy biztosan legyen minden pozícióhoz
  const terdDominansBi = getRandomExercise(categorizedExercises, 'térddomináns_bi');
  const terdDominansUni = getRandomExercise(categorizedExercises, 'térddomináns_uni');
  const horizontalisNyomasBi = getRandomExercise(categorizedExercises, 'horizontális_nyomás_bi');
  const horizontalisNyomasUni = getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni');
  const vertikalisNyomasBi = getRandomExercise(categorizedExercises, 'vertikális_nyomás_bi');
  const vertikalisNyomasUni = getRandomExercise(categorizedExercises, 'vertikális_nyomás_uni');

  // Térddomináns kiválasztása (bi vagy uni)
  const terdDominans = terdDominansBi || terdDominansUni;
  // Nyomó gyakorlat kiválasztása (horizontális vagy vertikális, bi vagy uni)
  const nyomoGyakorlat = horizontalisNyomasBi || horizontalisNyomasUni || vertikalisNyomasBi || vertikalisNyomasUni;
  
  sections.push({
    name: 'Első kör - Robbanékonyság fókusz',
    exercises: [
      // Térddomináns Bi/Uni
      {
        exerciseId: terdDominans?.id || 'placeholder-terddom',
        name: terdDominans?.name || 'Guggolás kettlebell-lel',
        sets: 4,
        reps: '6-8',
        weight: null,
        restPeriod: 90,
        instruction: terdDominans?.movement_pattern?.includes('unilaterális') ? 'Végezd el mindkét oldalra' : undefined
      },
      // FMS korrekció
      ...(fmsCorrection1 ? [{
        exerciseId: fmsCorrection1.id,
        name: fmsCorrection1.name,
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
        instruction: `FMS korrekció: ${fmsCorrections[0] || 'Általános korrekció'}`
      }] : [{
        // Ha nincs FMS korrekció, akkor placeholder
        exerciseId: 'placeholder-fms-1',
        name: 'FMS korrekciós gyakorlat (opcionális)',
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
        instruction: 'Ez a gyakorlat kihagyható, ha nincs FMS korrekcióra szükség'
      }]),
      // Horizontális/Vertikális nyomás Bi/Uni
      {
        exerciseId: nyomoGyakorlat?.id || 'placeholder-nyomas',
        name: nyomoGyakorlat?.name || 'Fekvőtámasz vagy Vállból nyomás',
        sets: 4,
        reps: '8-10',
        weight: null,
        restPeriod: 90,
        instruction: nyomoGyakorlat?.movement_pattern?.includes('unilaterális') ? 'Végezd el mindkét oldalra' : undefined
      }
    ]
  });
  
  // 6. Második kör - A struktúra: Függőleges/Vízszintes húzás Bi, FMS korrekció, Csípődomináns hajlított/nyújtott lábas, Rotációs vagy rehab, Gait (ha van)
  const fmsCorrection2 = fmsCorrections.length > 1 ? 
    getRandomExercise(categorizedExercises, 'fms_korrekció') : null;
  
  // Előre kiválasztjuk a szükséges gyakorlatokat
  const vertikalisHuzasBi = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
  const horizontalisHuzasBi = getRandomExercise(categorizedExercises, 'horizontális_húzás_bi');
  const csipoDominansHajlitott = getRandomExercise(categorizedExercises, 'csípődomináns_hajlított');
  const csipoDominansNyujtott = getRandomExercise(categorizedExercises, 'csípődomináns_nyújtott');
  const rotaciosGyakorlat = getRandomExercise(categorizedExercises, 'rotációs');
  const rehabGyakorlat = getRandomExercise(categorizedExercises, 'rehab');
  const gaitGyakorlat = getRandomExercise(categorizedExercises, 'gait');

  // Húzás kiválasztása (vízszintes vagy függőleges, de mindenképp bilaterális)
  const huzasGyakorlat = horizontalisHuzasBi || vertikalisHuzasBi;
  // Csípő gyakorlat kiválasztása (hajlított vagy nyújtott)
  const csipoGyakorlat = csipoDominansHajlitott || csipoDominansNyujtott;
  // Rotációs vagy rehab gyakorlat
  const rotaciosVagyRehab = rotaciosGyakorlat || rehabGyakorlat;
  
  sections.push({
    name: 'Második kör - Robbanékonyság fókusz',
    exercises: [
      // Függőleges/Vízszintes húzás Bi
      {
        exerciseId: huzasGyakorlat?.id || 'placeholder-huzas',
        name: huzasGyakorlat?.name || 'Húzódzkodás vagy Evezés',
        sets: 4,
        reps: '6-8',
        weight: null,
        restPeriod: 90,
      },
      // FMS korrekció
      ...(fmsCorrection2 ? [{
        exerciseId: fmsCorrection2.id,
        name: fmsCorrection2.name,
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
        instruction: `FMS korrekció: ${fmsCorrections[1] || 'Általános korrekció'}`
      }] : [{
        // Ha nincs FMS korrekció, akkor placeholder
        exerciseId: 'placeholder-fms-2',
        name: 'FMS korrekciós gyakorlat (opcionális)',
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
        instruction: 'Ez a gyakorlat kihagyható, ha nincs FMS korrekcióra szükség'
      }]),
      // Csípődomináns hajlított/nyújtott lábas
      {
        exerciseId: csipoGyakorlat?.id || 'placeholder-csipo',
        name: csipoGyakorlat?.name || 'Híd gyakorlat vagy Román felhúzás',
        sets: 4,
        reps: '8-10',
        weight: null,
        restPeriod: 90,
      },
      // Rotációs vagy rehab
      {
        exerciseId: rotaciosVagyRehab?.id || 'placeholder-rotacios',
        name: rotaciosVagyRehab?.name || 'Rotációs vagy rehabilitációs gyakorlat',
        sets: 3,
        reps: '10 mindkét oldalra',
        weight: null,
        restPeriod: 60,
      },
      // Gait (ha van)
      ...(gaitGyakorlat ? [{
        exerciseId: gaitGyakorlat.id,
        name: gaitGyakorlat.name,
        sets: 2,
        reps: '20-30 méter',
        weight: null,
        restPeriod: 60,
        instruction: 'Járás mintázat gyakorlása'
      }] : [])
    ]
  });
  
  return sections;
}

/**
 * Második napi edzésterv generálása (Erő fókusz)
 */
function generateDay2Plan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[]
): WorkoutSectionGenerated[] {
  const sections: WorkoutSectionGenerated[] = [];
  
  // 1. Bemelegítés
  sections.push({
    name: 'Bemelegítés',
    exercises: Array(3).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'bemelegítés');
      return {
        exerciseId: exercise?.id || 'placeholder-warmup',
        name: exercise?.name || 'Dinamikus bemelegítés',
        sets: 1,
        reps: '30-60 mp',
        weight: null,
        restPeriod: 0,
      };
    })
  });
  
  // 2. Pilometrikus gyakorlatok
  sections.push({
    name: 'Pilometrikus gyakorlatok',
    exercises: Array(2).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'pilometrikus');
      return {
        exerciseId: exercise?.id || 'placeholder-plyo',
        name: exercise?.name || 'Pilometrikus gyakorlat',
        sets: 3,
        reps: '5-8',
        weight: null,
        restPeriod: 90,
      };
    })
  });
  
  // 3. Core gyakorlatok
  sections.push({
    name: 'Core gyakorlatok',
    exercises: Array(2).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'core');
      return {
        exerciseId: exercise?.id || 'placeholder-core',
        name: exercise?.name || 'Core gyakorlat',
        sets: 3,
        reps: '10-12',
        weight: null,
        restPeriod: 60,
      };
    })
  });
  
  // 4. Horpaszizom nyújtás
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
      instruction: 'Mindkét oldalra végezze el'
    }]
  });
  
  // 5. Első kör - A struktúra: Térddomináns Bi/Uni, FMS korrekció, Horizontális/Vertikális nyomás Bi/Uni
  const fmsCorrection1 = fmsCorrections.length > 0 ? 
    getRandomExercise(categorizedExercises, 'fms_korrekció') : null;
    
  // Először a szükséges gyakorlatokat választjuk ki, hogy biztosan legyen minden pozícióhoz
  const terdDominansBi = getRandomExercise(categorizedExercises, 'térddomináns_bi');
  const terdDominansUni = getRandomExercise(categorizedExercises, 'térddomináns_uni');
  const horizontalisNyomasBi = getRandomExercise(categorizedExercises, 'horizontális_nyomás_bi');
  const horizontalisNyomasUni = getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni');
  const vertikalisNyomasBi = getRandomExercise(categorizedExercises, 'vertikális_nyomás_bi');
  const vertikalisNyomasUni = getRandomExercise(categorizedExercises, 'vertikális_nyomás_uni');

  // Térddomináns kiválasztása (második napon preferáljuk az uni gyakorlatokat)
  const terdDominans = terdDominansUni || terdDominansBi;
  // Nyomó gyakorlat kiválasztása (második napon preferáljuk a vertikális nyomást)
  const nyomoGyakorlat = vertikalisNyomasBi || vertikalisNyomasUni || horizontalisNyomasBi || horizontalisNyomasUni;
  
  sections.push({
    name: 'Első kör - Erő fókusz',
    exercises: [
      // Térddomináns Bi/Uni (preferáltan Uni)
      {
        exerciseId: terdDominans?.id || 'placeholder-terddom',
        name: terdDominans?.name || 'Bolgár kitörés',
        sets: 4,
        reps: terdDominans?.movement_pattern?.includes('unilaterális') ? '6-8 oldalanként' : '6-8',
        weight: null,
        restPeriod: 90,
        instruction: terdDominans?.movement_pattern?.includes('unilaterális') ? 'Végezd el mindkét oldalra' : undefined
      },
      // FMS korrekció
      ...(fmsCorrection1 ? [{
        exerciseId: fmsCorrection1.id,
        name: fmsCorrection1.name,
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
        instruction: `FMS korrekció: ${fmsCorrections[0] || 'Általános korrekció'}`
      }] : [{
        // Ha nincs FMS korrekció, akkor placeholder
        exerciseId: 'placeholder-fms-1',
        name: 'FMS korrekciós gyakorlat (opcionális)',
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
        instruction: 'Ez a gyakorlat kihagyható, ha nincs FMS korrekcióra szükség'
      }]),
      // Horizontális/Vertikális nyomás Bi/Uni (preferáltan Vertikális nyomás)
      {
        exerciseId: nyomoGyakorlat?.id || 'placeholder-nyomas',
        name: nyomoGyakorlat?.name || 'Vállból nyomás',
        sets: 4,
        reps: '8-10',
        weight: null,
        restPeriod: 90,
        instruction: nyomoGyakorlat?.movement_pattern?.includes('unilaterális') ? 'Végezd el mindkét oldalra' : undefined
      }
    ]
  });
  
  // 6. Második kör - A struktúra: Függőleges/Vízszintes húzás Bi, FMS korrekció, Csípődomináns hajlított/nyújtott lábas, Rotációs vagy rehab, Gait (ha van)
  const fmsCorrection2 = fmsCorrections.length > 1 ? 
    getRandomExercise(categorizedExercises, 'fms_korrekció') : null;
  
  // Előre kiválasztjuk a szükséges gyakorlatokat
  const vertikalisHuzasBi = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
  const horizontalisHuzasBi = getRandomExercise(categorizedExercises, 'horizontális_húzás_bi');
  const csipoDominansHajlitott = getRandomExercise(categorizedExercises, 'csípődomináns_hajlított');
  const csipoDominansNyujtott = getRandomExercise(categorizedExercises, 'csípődomináns_nyújtott');
  const rotaciosGyakorlat = getRandomExercise(categorizedExercises, 'rotációs');
  const rehabGyakorlat = getRandomExercise(categorizedExercises, 'rehab');
  const gaitGyakorlat = getRandomExercise(categorizedExercises, 'gait');

  // Húzás kiválasztása (második napon preferáljuk a horizontális húzást, de mindenképp bilaterális)
  const huzasGyakorlat = horizontalisHuzasBi || vertikalisHuzasBi;
  // Csípő gyakorlat kiválasztása (második napon preferáljuk a nyújtott lábas változatot)
  const csipoGyakorlat = csipoDominansNyujtott || csipoDominansHajlitott;
  // Rotációs vagy rehab gyakorlat
  const rotaciosVagyRehab = rotaciosGyakorlat || rehabGyakorlat;
  
  sections.push({
    name: 'Második kör - Erő fókusz',
    exercises: [
      // Függőleges/Vízszintes húzás Bi (preferáltan horizontális)
      {
        exerciseId: huzasGyakorlat?.id || 'placeholder-huzas',
        name: huzasGyakorlat?.name || 'Fekvő evezés',
        sets: 4,
        reps: '8-10',
        weight: null,
        restPeriod: 90,
      },
      // FMS korrekció
      ...(fmsCorrection2 ? [{
        exerciseId: fmsCorrection2.id,
        name: fmsCorrection2.name,
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
        instruction: `FMS korrekció: ${fmsCorrections[1] || 'Általános korrekció'}`
      }] : [{
        // Ha nincs FMS korrekció, akkor placeholder
        exerciseId: 'placeholder-fms-2',
        name: 'FMS korrekciós gyakorlat (opcionális)',
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 60,
        instruction: 'Ez a gyakorlat kihagyható, ha nincs FMS korrekcióra szükség'
      }]),
      // Csípődomináns nyújtott/hajlított lábas (preferáltan nyújtott lábas)
      {
        exerciseId: csipoGyakorlat?.id || 'placeholder-csipo',
        name: csipoGyakorlat?.name || 'Román felhúzás',
        sets: 4,
        reps: '8-10',
        weight: null,
        restPeriod: 90,
      },
      // Rotációs vagy rehab
      {
        exerciseId: rotaciosVagyRehab?.id || 'placeholder-rotacios',
        name: rotaciosVagyRehab?.name || 'Rotációs vagy rehabilitációs gyakorlat',
        sets: 3,
        reps: '10 mindkét oldalra',
        weight: null,
        restPeriod: 60,
      },
      // Gait (ha van)
      ...(gaitGyakorlat ? [{
        exerciseId: gaitGyakorlat.id,
        name: gaitGyakorlat.name,
        sets: 3,
        reps: '20-30 méter',
        weight: null,
        restPeriod: 60,
        instruction: 'Járás mintázat gyakorlása'
      }] : [])
    ]
  });
  
  return sections;
}

/**
 * Harmadik napi edzésterv generálása (Kombinált fókusz)
 */
function generateDay3Plan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[]
): WorkoutSectionGenerated[] {
  const sections: WorkoutSectionGenerated[] = [];
  
  // 1. Bemelegítés
  sections.push({
    name: 'Bemelegítés',
    exercises: Array(3).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'bemelegítés');
      return {
        exerciseId: exercise?.id || 'placeholder-warmup',
        name: exercise?.name || 'Dinamikus bemelegítés',
        sets: 1,
        reps: '30-60 mp',
        weight: null,
        restPeriod: 0,
      };
    })
  });
  
  // 2. Core gyakorlatok
  sections.push({
    name: 'Core gyakorlatok',
    exercises: Array(3).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'core');
      return {
        exerciseId: exercise?.id || 'placeholder-core',
        name: exercise?.name || 'Core gyakorlat',
        sets: 3,
        reps: '10-12',
        weight: null,
        restPeriod: 60,
      };
    })
  });
  
  // 3. Fő köredzés - Tartalmaz egy első és egy második kört a standard struktúra szerint
  
  // Előre kiválasztjuk a szükséges gyakorlatokat az első körhöz
  const terdDominansBi = getRandomExercise(categorizedExercises, 'térddomináns_bi');
  const terdDominansUni = getRandomExercise(categorizedExercises, 'térddomináns_uni');
  const horizontalisNyomasBi = getRandomExercise(categorizedExercises, 'horizontális_nyomás_bi');
  const horizontalisNyomasUni = getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni');
  const vertikalisNyomasBi = getRandomExercise(categorizedExercises, 'vertikális_nyomás_bi');
  const vertikalisNyomasUni = getRandomExercise(categorizedExercises, 'vertikális_nyomás_uni');

  // Előre kiválasztjuk a szükséges gyakorlatokat a második körhöz
  const horizontalisHuzasBi = getRandomExercise(categorizedExercises, 'horizontális_húzás_bi');
  const vertikalisHuzasBi = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
  const csipoDominansHajlitott = getRandomExercise(categorizedExercises, 'csípődomináns_hajlított');
  const csipoDominansNyujtott = getRandomExercise(categorizedExercises, 'csípődomináns_nyújtott');
  const rotaciosGyakorlat = getRandomExercise(categorizedExercises, 'rotációs');
  const rehabGyakorlat = getRandomExercise(categorizedExercises, 'rehab');
  const gaitGyakorlat = getRandomExercise(categorizedExercises, 'gait');
    
  // FMS korrekciók kiválasztása
  const fmsCorrection1 = fmsCorrections.length > 0 ? 
    getRandomExercise(categorizedExercises, 'fms_korrekció') : null;
  const fmsCorrection2 = fmsCorrections.length > 1 ? 
    getRandomExercise(categorizedExercises, 'fms_korrekció') : null;
    
  // Gyakorlatok kiválasztása az első körre
  const terdDominans = terdDominansBi || terdDominansUni;
  const nyomoGyakorlat = horizontalisNyomasBi || horizontalisNyomasUni || vertikalisNyomasBi || vertikalisNyomasUni;

  // Gyakorlatok kiválasztása a második körre
  const huzasGyakorlat = horizontalisHuzasBi || vertikalisHuzasBi;
  const csipoGyakorlat = csipoDominansHajlitott || csipoDominansNyujtott;
  const rotaciosVagyRehab = rotaciosGyakorlat || rehabGyakorlat;
    
  sections.push({
    name: 'Kombinált erő-robbanékonyság köredzés (Első kör)',
    exercises: [
      // Térddomináns Bi/Uni
      {
        exerciseId: terdDominans?.id || 'placeholder-terddom',
        name: terdDominans?.name || 'Goblet guggolás',
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 30, // Köredzésben rövidebb pihenők
        instruction: terdDominans?.movement_pattern?.includes('unilaterális') ? 'Végezd el mindkét oldalra' : undefined
      },
      // FMS korrekció
      ...(fmsCorrection1 ? [{
        exerciseId: fmsCorrection1.id,
        name: fmsCorrection1.name,
        sets: 3,
        reps: '10',
        weight: null,
        restPeriod: 30,
        instruction: `FMS korrekció: ${fmsCorrections[0] || 'Általános korrekció'}`
      }] : [{
        // Ha nincs FMS korrekció, akkor placeholder
        exerciseId: 'placeholder-fms-1',
        name: 'FMS korrekciós gyakorlat (opcionális)',
        sets: 3,
        reps: '10',
        weight: null,
        restPeriod: 30,
        instruction: 'Ez a gyakorlat kihagyható, ha nincs FMS korrekcióra szükség'
      }]),
      // Horizontális/Vertikális nyomás Bi/Uni
      {
        exerciseId: nyomoGyakorlat?.id || 'placeholder-nyomas',
        name: nyomoGyakorlat?.name || 'Mellre nyomás vagy Vállból nyomás',
        sets: 3,
        reps: '8-10',
        weight: null,
        restPeriod: 30,
        instruction: nyomoGyakorlat?.movement_pattern?.includes('unilaterális') ? 'Végezd el mindkét oldalra' : undefined
      }
    ]
  });
  
  // Második kör a köredzésben
  sections.push({
    name: 'Kombinált erő-robbanékonyság köredzés (Második kör)',
    exercises: [
      // Függőleges/Vízszintes húzás Bi
      {
        exerciseId: huzasGyakorlat?.id || 'placeholder-huzas',
        name: huzasGyakorlat?.name || 'Evezés',
        sets: 3,
        reps: '10',
        weight: null,
        restPeriod: 30,
      },
      // FMS korrekció
      ...(fmsCorrection2 ? [{
        exerciseId: fmsCorrection2.id,
        name: fmsCorrection2.name,
        sets: 3,
        reps: '10',
        weight: null,
        restPeriod: 30,
        instruction: `FMS korrekció: ${fmsCorrections[1] || 'Általános korrekció'}`
      }] : [{
        // Ha nincs FMS korrekció, akkor placeholder
        exerciseId: 'placeholder-fms-2',
        name: 'FMS korrekciós gyakorlat (opcionális)',
        sets: 3,
        reps: '10',
        weight: null,
        restPeriod: 30,
        instruction: 'Ez a gyakorlat kihagyható, ha nincs FMS korrekcióra szükség'
      }]),
      // Csípődomináns hajlított/nyújtott lábas
      {
        exerciseId: csipoGyakorlat?.id || 'placeholder-csipo',
        name: csipoGyakorlat?.name || 'Híd gyakorlat vagy Román felhúzás',
        sets: 3,
        reps: '10',
        weight: null,
        restPeriod: 30,
      },
      // Rotációs vagy rehab
      {
        exerciseId: rotaciosVagyRehab?.id || 'placeholder-rotacios',
        name: rotaciosVagyRehab?.name || 'Rotációs vagy rehabilitációs gyakorlat',
        sets: 3,
        reps: '12/oldal',
        weight: null,
        restPeriod: 30,
      },
      // Gait (ha van)
      ...(gaitGyakorlat ? [{
        exerciseId: gaitGyakorlat.id,
        name: gaitGyakorlat.name,
        sets: 2,
        reps: '20-30 méter',
        weight: null,
        restPeriod: 30,
        instruction: 'Járás mintázat gyakorlása'
      }] : [])
    ]
  });

  // 4. Nyújtás és regeneráció
  sections.push({
    name: 'Nyújtás és regeneráció',
    exercises: Array(3).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'nyújtás');
      return {
        exerciseId: exercise?.id || 'placeholder-stretch',
        name: exercise?.name || 'Stretching gyakorlat',
        sets: 1,
        reps: '45 mp',
        weight: null,
        restPeriod: 0,
        instruction: 'Lassan, légzéssel összhangban'
      };
    })
  });
  
  return sections;
}

/**
 * Negyedik napi edzésterv generálása (Mobilitás és regeneráció fókusz)
 */
function generateDay4Plan(
  categorizedExercises: Record<string, Exercise[]>,
  fmsCorrections: string[]
): WorkoutSectionGenerated[] {
  const sections: WorkoutSectionGenerated[] = [];
  
  // 1. Bemelegítés
  sections.push({
    name: 'Könnyű bemelegítés',
    exercises: Array(2).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'bemelegítés');
      return {
        exerciseId: exercise?.id || 'placeholder-warmup',
        name: exercise?.name || 'Dinamikus bemelegítés',
        sets: 1,
        reps: '30-60 mp',
        weight: null,
        restPeriod: 0,
      };
    })
  });
  
  // 2. FMS korrekciós blokk - Átszervezzük, hogy megfeleljen a strukturált követelményeknek
  // FMS korrekciók kiválasztása
  const fmsCorrection1 = fmsCorrections.length > 0 ? 
    getRandomExercise(categorizedExercises, 'fms_korrekció') : null;
  const fmsCorrection2 = fmsCorrections.length > 1 ? 
    getRandomExercise(categorizedExercises, 'fms_korrekció') : null;
  
  // Az első korrekció
  sections.push({
    name: 'FMS korrekciós gyakorlatok (Első kör)',
    exercises: [
      ...(fmsCorrection1 ? [{
        exerciseId: fmsCorrection1.id,
        name: fmsCorrection1.name,
        sets: 3,
        reps: '10-12',
        weight: null,
        restPeriod: 30,
        instruction: `FMS korrekció: ${fmsCorrections[0] || 'Általános korrekció'}`
      }] : [{
        // Ha nincs FMS korrekció, akkor placeholder
        exerciseId: 'placeholder-fms-1',
        name: 'FMS korrekciós gyakorlat (opcionális)',
        sets: 3,
        reps: '10-12',
        weight: null,
        restPeriod: 30,
        instruction: 'Ez a gyakorlat kihagyható, ha nincs FMS korrekcióra szükség'
      }])
    ]
  });
  
  // A második korrekció
  // Mindig hozzáadjuk a második kört, üres placeholder-rel, ha nincs FMS korrekció
  sections.push({
    name: 'FMS korrekciós gyakorlatok (Második kör)',
    exercises: fmsCorrection2 ? [{
      exerciseId: fmsCorrection2.id,
      name: fmsCorrection2.name,
      sets: 3,
      reps: '10-12',
      weight: null,
      restPeriod: 30,
      instruction: `FMS korrekció: ${fmsCorrections[1] || 'Általános korrekció'}`
    }] : [{
      // Ha nincs második FMS korrekció, akkor placeholder
      exerciseId: 'placeholder-fms-2',
      name: 'Második FMS korrekciós gyakorlat (opcionális)',
      sets: 3,
      reps: '10-12',
      weight: null,
      restPeriod: 30,
      instruction: 'Ez a gyakorlat kihagyható, ha nincs második FMS korrekcióra szükség'
    }]
  });
  
  // 3. Mobilitás fejlesztés
  sections.push({
    name: 'Mobilitás fejlesztés',
    exercises: Array(4).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'nyújtás');
      return {
        exerciseId: exercise?.id || 'placeholder-stretch',
        name: exercise?.name || 'Mobilitás gyakorlat',
        sets: 2,
        reps: '45-60 mp',
        weight: null,
        restPeriod: 10,
        instruction: 'Lassan, kontrollált mozgásokkal'
      };
    })
  });
  
  // 4. Könnyű core aktiválás
  sections.push({
    name: 'Core aktiválás',
    exercises: Array(3).fill(0).map(() => {
      const exercise = getRandomExercise(categorizedExercises, 'core');
      return {
        exerciseId: exercise?.id || 'placeholder-core',
        name: exercise?.name || 'Core gyakorlat',
        sets: 2,
        reps: '12-15 (könnyű)',
        weight: null,
        restPeriod: 30,
      };
    })
  });
  
  // 5. Gait és funkcionális gyakorlatok
  sections.push({
    name: 'Gait és funkcionális gyakorlatok',
    exercises: [
      {
        exerciseId: 'placeholder-gait',
        name: getRandomExercise(categorizedExercises, 'gait')?.name || 'Gait gyakorlat',
        sets: 2,
        reps: '20 m',
        weight: null,
        restPeriod: 60,
      },
      {
        exerciseId: 'placeholder-rehab',
        name: getRandomExercise(categorizedExercises, 'rehab')?.name || 'Rehabilitációs gyakorlat',
        sets: 2,
        reps: '10-12',
        weight: null,
        restPeriod: 30,
      }
    ]
  });
  
  return sections;
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
          console.log('FMS korrekciók:', fmsCorrections);
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
  includeWeights?: boolean;
  adjustForFMS?: boolean;
}): Promise<GeneratedWorkoutPlan> {
  const { userId, programType, day, includeWeights = true, adjustForFMS = true } = options;
  
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
      description = '2 napos teljes test edzésterv';
      sections = generate2DayPlan(categorizedExercises, fmsCorrections, day as 1 | 2);
    } else if (programType === '3napos') {
      title = '3 napos program';
      description = '3 napos strukturált edzésterv';
      sections = generate3DayPlan(categorizedExercises, fmsCorrections, day as 1 | 2 | 3);
    } else {
      // fallback to 4 napos (use existing logic)
      title = '4 napos program';
      description = '4 napos strukturált edzésterv';
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
