// A generált edzéstípusok és prescription-konfigurációk típusai
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

export type PrescriptionConfig = {
  sets: number;
  reps: string;
  restPeriod: number;
  intensity?: string;
  note?: string;
};

export type FocusPreset = {
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
