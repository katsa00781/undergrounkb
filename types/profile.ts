// TypeScript interface a profiles tábla struktúrájához
// Ez megfelel a ProfileFormData típusnak és az SQL táblának

export interface ProfileRecord {
  // Alap mezők (már léteznek)
  id: string;                    // UUID - auth.users.id
  email: string;                 // Email cím
  role: 'user' | 'admin' | 'trainer'; // Felhasználó szerepe
  full_name?: string | null;     // Teljes név
  avatar_url?: string | null;    // Avatar kép URL
  created_at: string;            // ISO dátum string
  updated_at: string;            // ISO dátum string

  // Új mezők a ProfileFormData alapján
  display_name?: string | null;  // Megjelenítendő név (displayName)
  height?: number | null;        // Magasság cm-ben
  weight?: number | null;        // Súly kg-ban (decimal)
  birthdate?: string | null;     // Születési dátum (YYYY-MM-DD formátum)
  gender?: 'male' | 'female' | 'other' | '' | null; // Nem
  fitness_goals?: string[] | null; // Fitness célok array
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | '' | null; // Tapasztalati szint
}

// Form adat típus (amit a React Hook Form használ)
export interface ProfileFormData {
  displayName: string;           // Kötelező, min 2 karakter
  height?: number | null;        // Opcionális szám
  weight?: number | null;        // Opcionális szám
  birthdate?: string;            // Opcionális dátum string
  gender?: 'male' | 'female' | 'other' | ''; // Opcionális enum
  fitnessGoals: string[];        // Array, alapértelmezett üres
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | ''; // Opcionális enum
}

// Adatbázis műveletekhez használható típus
export interface ProfileUpdateData {
  full_name?: string;
  display_name?: string;
  height?: number | null;
  weight?: number | null;
  birthdate?: string | null;
  gender?: string | null;
  fitness_goals?: string[] | null;
  experience_level?: string | null;
  avatar_url?: string | null;
  updated_at?: string;
}

// Validációs típus a fitness célokhoz
export const AVAILABLE_FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain', 
  'Strength',
  'Endurance',
  'Flexibility'
] as const;

export type FitnessGoal = typeof AVAILABLE_FITNESS_GOALS[number];

// Tapasztalati szintek
export const EXPERIENCE_LEVELS = [
  'beginner',
  'intermediate', 
  'advanced'
] as const;

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

// Gender opciók
export const GENDER_OPTIONS = [
  'male',
  'female',
  'other'
] as const;

export type Gender = typeof GENDER_OPTIONS[number];

// Utility típus ProfileFormData -> ProfileRecord konverzióhoz
export function profileFormToRecord(formData: ProfileFormData): ProfileUpdateData {
  return {
    display_name: formData.displayName,
    full_name: formData.displayName, // full_name és display_name ugyanaz
    height: formData.height,
    weight: formData.weight,
    birthdate: formData.birthdate || null,
    gender: formData.gender || null,
    fitness_goals: formData.fitnessGoals,
    experience_level: formData.experienceLevel || null,
    updated_at: new Date().toISOString()
  };
}

// Utility típus ProfileRecord -> ProfileFormData konverzióhoz
export function profileRecordToForm(record: ProfileRecord): ProfileFormData {
  return {
    displayName: record.display_name || record.full_name || '',
    height: record.height,
    weight: record.weight,
    birthdate: record.birthdate || '',
    gender: record.gender || '',
    fitnessGoals: record.fitness_goals || [],
    experienceLevel: record.experience_level || ''
  };
}
