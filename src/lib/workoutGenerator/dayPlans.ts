import { Exercise } from '../exercises';
import { WorkoutSectionGenerated } from './types';
import { getFirstAvailableExercise, getRandomExercise } from './exerciseCategorizer';

// 2 napos program generátor
export function generate2DayPlan(
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
    const terdDomBi = getRandomExercise(categorizedExercises, 'térddomináns_bi');
    const horizontalPushBi = getRandomExercise(categorizedExercises, 'horizontális_nyomás_bi');
    const horizontalPushUni = getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni');
    const verticalPullBi = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
    const hipBent = getRandomExercise(categorizedExercises, 'csípődomináns_hajlított');
    const rotational = getRandomExercise(categorizedExercises, 'rotációs');
    const rehab = getRandomExercise(categorizedExercises, 'rehab');
    const pushEx = horizontalPushBi || horizontalPushUni;

    sections.push({
      name: 'Első kör - Robbanékonyság fókusz',
      exercises: [
        {
          exerciseId: terdDomBi?.id || 'placeholder-terddom-bi',
          name: terdDomBi?.name || 'Térddomináns BI',
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
          exerciseId: pushEx?.id || 'placeholder-horiz-nyomas',
          name: pushEx?.name || 'Horizontális nyomás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
          instruction: horizontalPushUni && !horizontalPushBi ? 'Végezd el mindkét oldalra' : undefined,
        },
      ],
    });

    sections.push({
      name: 'Második kör - Robbanékonyság fókusz',
      exercises: [
        {
          exerciseId: verticalPullBi?.id || 'placeholder-vert-huzas-bi',
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
          exerciseId: hipBent?.id || 'placeholder-csipo-hajlitott',
          name: hipBent?.name || 'Csípődomináns hajlított lábas gyakorlat',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: (rotational || rehab)?.id || 'placeholder-rotacios',
          name: rotational?.name || rehab?.name || 'Rotációs vagy rehabilitációs gyakorlat',
          sets: 3,
          reps: '10/oldal',
          weight: null,
          restPeriod: 60,
        },
      ],
    });
  } else if (day === 2) {
    const terdDomUni = getRandomExercise(categorizedExercises, 'térddomináns_uni');
    const verticalPushBi = getRandomExercise(categorizedExercises, 'vertikális_nyomás_bi');
    const verticalPushUni = getRandomExercise(categorizedExercises, 'vertikális_nyomás_uni');
    const horizontalPullBi = getRandomExercise(categorizedExercises, 'horizontális_húzás_bi');
    const horizontalPullUni = getRandomExercise(categorizedExercises, 'horizontális_húzás_uni');
    const hipStraight = getRandomExercise(categorizedExercises, 'csípődomináns_nyújtott');
    const rotational = getRandomExercise(categorizedExercises, 'rotációs');
    const rehab = getRandomExercise(categorizedExercises, 'rehab');
    const gait = getRandomExercise(categorizedExercises, 'gait');
    const vertPushEx = verticalPushBi || verticalPushUni;
    const horizPullEx = horizontalPullBi || horizontalPullUni;

    sections.push({
      name: 'Első kör - Erő fókusz',
      exercises: [
        {
          exerciseId: terdDomUni?.id || 'placeholder-terddom-uni',
          name: terdDomUni?.name || 'Térddomináns Uni',
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
          exerciseId: vertPushEx?.id || 'placeholder-vert-nyomas',
          name: vertPushEx?.name || 'Vertikális nyomás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
          instruction: verticalPushUni && !verticalPushBi ? 'Végezd el mindkét oldalra' : undefined,
        },
      ],
    });

    sections.push({
      name: 'Második kör - Erő fókusz',
      exercises: [
        {
          exerciseId: horizPullEx?.id || 'placeholder-horiz-huzas',
          name: horizPullEx?.name || 'Vízszintes húzás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
          instruction: horizontalPullUni && !horizontalPullBi ? 'Végezd el mindkét oldalra' : undefined,
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
          exerciseId: hipStraight?.id || 'placeholder-csipo-nyujtott',
          name: hipStraight?.name || 'Csípődomináns nyújtott lábas gyakorlat',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: (rotational || rehab)?.id || 'placeholder-rotacios',
          name: rotational?.name || rehab?.name || 'Rotációs vagy rehabilitációs gyakorlat',
          sets: 3,
          reps: '10/oldal',
          weight: null,
          restPeriod: 60,
        },
        ...(gait ? [{
          exerciseId: gait.id,
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
export function generate3DayPlan(
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
    const terdDomBi1 = getRandomExercise(categorizedExercises, 'térddomináns_bi');
    const vertPull1 = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
    const terdDomUni1 = getRandomExercise(categorizedExercises, 'térddomináns_uni');
    const horizPushUni1 = getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni');

    sections.push({
      name: 'Első pár',
      exercises: [
        {
          exerciseId: terdDomBi1?.id || 'placeholder-terddom-bi',
          name: terdDomBi1?.name || 'Térddomináns BI',
          sets: 3,
          reps: '8-10',
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
          exerciseId: vertPull1?.id || 'placeholder-vert-huzas-bi',
          name: vertPull1?.name || 'Vertikális húzás',
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
        {
          exerciseId: terdDomUni1?.id || 'placeholder-terddom-uni',
          name: terdDomUni1?.name || 'Térddomináns Uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: horizPushUni1?.id || 'placeholder-horiz-nyomas-uni',
          name: horizPushUni1?.name || 'Horizontális nyomás uni',
          sets: 3,
          reps: '8-10',
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
          exerciseId: hipBilateral?.id || 'placeholder-csipo-bi',
          name: hipBilateral?.name || 'Csípődomináns BI',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
  } else if (day === 2) {
    const horizPushBi2 = getRandomExercise(categorizedExercises, 'horizontális_nyomás_bi');
    const terdDomUni2 = getRandomExercise(categorizedExercises, 'térddomináns_uni');
    const vertPushBi2 = getRandomExercise(categorizedExercises, 'vertikális_nyomás_bi');
    const horizPullBi2 = getRandomExercise(categorizedExercises, 'horizontális_húzás_bi');

    sections.push({
      name: 'Első pár',
      exercises: [
        {
          exerciseId: horizPushBi2?.id || 'placeholder-horiz-nyomas-bi',
          name: horizPushBi2?.name || 'Horizontális nyomás bi',
          sets: 3,
          reps: '8-10',
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
          exerciseId: terdDomUni2?.id || 'placeholder-terddom-uni',
          name: terdDomUni2?.name || 'Térddomináns uni',
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
        {
          exerciseId: vertPushBi2?.id || 'placeholder-vert-nyomas-bi',
          name: vertPushBi2?.name || 'Vertikális nyomás',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: horizPullBi2?.id || 'placeholder-horiz-huzas-bi',
          name: horizPullBi2?.name || 'Horizontális húzás bi',
          sets: 3,
          reps: '8-10',
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
          exerciseId: hipUnilateral?.id || 'placeholder-csipo-uni',
          name: hipUnilateral?.name || 'Csípődomináns Uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
      ],
    });
  } else if (day === 3) {
    const terdDomBi3 = getRandomExercise(categorizedExercises, 'térddomináns_bi');
    const vertPull3 = getRandomExercise(categorizedExercises, 'vertikális_húzás_bi');
    const horizPushUni3 = getRandomExercise(categorizedExercises, 'horizontális_nyomás_uni');
    const horizPullUni3 = getRandomExercise(categorizedExercises, 'horizontális_húzás_uni');
    const gaitOrCore3 = getRandomExercise(categorizedExercises, 'gait') || getRandomExercise(categorizedExercises, 'core');

    sections.push({
      name: 'Első pár',
      exercises: [
        {
          exerciseId: terdDomBi3?.id || 'placeholder-terddom-bi',
          name: terdDomBi3?.name || 'Térddomináns BI',
          sets: 3,
          reps: '8-10',
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
          exerciseId: vertPull3?.id || 'placeholder-vert-huzas-bi',
          name: vertPull3?.name || 'Vertikális húzás',
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
        {
          exerciseId: horizPushUni3?.id || 'placeholder-horiz-nyomas-uni',
          name: horizPushUni3?.name || 'Horizontális nyomás uni',
          sets: 3,
          reps: '8-10',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: horizPullUni3?.id || 'placeholder-horiz-huzas-uni',
          name: horizPullUni3?.name || 'Horizontális húzás uni',
          sets: 3,
          reps: '8-10',
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
          exerciseId: gaitOrCore3?.id || 'placeholder-gait-core',
          name: gaitOrCore3?.name || 'Gait vagy Core',
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
export function generateDay1Plan(
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
          exerciseId: hipBilateral?.id || 'placeholder-csipo-bi',
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
          exerciseId: verticalPull?.id || 'placeholder-vert-huzas-bi',
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
          exerciseId: kneeUnilateral?.id || 'placeholder-terddom-uni',
          name: kneeUnilateral?.name || 'Térddomináns Uni',
          sets: 3,
          reps: '6-8 oldalanként',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: horizontalPushUnilateral?.id || 'placeholder-horiz-nyomas-uni',
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
          exerciseId: antiRotation?.id || 'placeholder-rotacios',
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
export function generateDay2Plan(
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
          exerciseId: verticalPush?.id || 'placeholder-vert-nyomas',
          name: verticalPush?.name || 'Függőleges tolás',
          sets: 3,
          reps: verticalPush?.movement_pattern === 'vertical_push_unilateral' ? '6-8 oldalanként' : '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: upperBodyMobility?.id || 'placeholder-rehab',
          name: upperBodyMobility?.name || 'Felsőtest mobilizálás',
          sets: 2,
          reps: '30-45 mp',
          weight: null,
          restPeriod: 30,
        },
        {
          exerciseId: stabilization?.id || 'placeholder-core',
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
          exerciseId: core?.id || 'placeholder-core',
          name: core?.name || 'Core',
          sets: 3,
          reps: '10-12',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: antiRotation?.id || 'placeholder-rotacios',
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
          exerciseId: carry?.id || 'placeholder-gait',
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
export function generateDay3Plan(
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
          exerciseId: kneeBilateral?.id || 'placeholder-terddom-bi',
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
          exerciseId: verticalPull?.id || 'placeholder-vert-huzas-bi',
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
          exerciseId: hipDominant?.id || 'placeholder-csipo',
          name: hipDominant?.name || 'Csípődomináns',
          sets: 3,
          reps: hipDominant?.movement_pattern === 'hip_dominant_unilateral' ? '6-8 oldalanként' : '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: horizontalPullUnilateral?.id || 'placeholder-horiz-huzas-uni',
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
          exerciseId: gaitOrCore?.id || 'placeholder-gait-core',
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
export function generateDay4Plan(
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
          exerciseId: horizontalPush?.id || 'placeholder-horiz-nyomas',
          name: horizontalPush?.name || 'Horizontális tolás',
          sets: 3,
          reps: horizontalPush?.movement_pattern === 'horizontal_push_unilateral' ? '6-8 oldalanként' : '6-8',
          weight: null,
          restPeriod: 90,
        },
        {
          exerciseId: hipMobility?.id || 'placeholder-rehab',
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
          exerciseId: core?.id || 'placeholder-core',
          name: core?.name || 'Core',
          sets: 3,
          reps: '10-12',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: antiRotation?.id || 'placeholder-rotacios',
          name: antiRotation?.name || 'Antirotációs core',
          sets: 3,
          reps: '10/oldal',
          weight: null,
          restPeriod: 60,
        },
        {
          exerciseId: carry?.id || 'placeholder-gait',
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
