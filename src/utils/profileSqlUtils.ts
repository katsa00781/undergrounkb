// ProfileFormData SQL konverziós utility-k
// Ez a fájl tartalmazza a helper függvényeket a ProfileFormData
// és SQL adatbázis műveletek közötti konverzióhoz

import { z } from 'zod';

// ProfileFormData schema (sync with Profile.tsx)
export const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  height: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  birthdate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  fitnessGoals: z.array(z.string()).default([]),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', '']).optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Adatbázis profil típus (amit a profiles táblából kapunk)
export interface ProfileRecord {
  id: string;
  display_name?: string | null;
  full_name?: string | null;
  height?: number | null;
  weight?: number | null;
  birthdate?: string | null; // DATE as string in YYYY-MM-DD format
  gender?: string | null;
  fitness_goals?: unknown; // JSONB as unknown
  experience_level?: string | null;
  created_at?: string;
  updated_at?: string;
}

// SQL parameterek típusa
export interface ProfileSqlParams {
  userId: string;
  displayName: string | null;
  height: number | null;
  weight: number | null;
  birthdate: string | null;
  gender: string | null;
  fitnessGoals: string; // JSON stringified
  experienceLevel: string | null;
}

/**
 * ProfileFormData konvertálása SQL paraméterekre
 */
export function profileFormDataToSqlParams(
  userId: string,
  data: ProfileFormData
): ProfileSqlParams {
  return {
    userId,
    displayName: data.displayName || null,
    height: data.height ?? null,
    weight: data.weight ?? null,
    birthdate: data.birthdate || null,
    gender: data.gender || null,
    fitnessGoals: JSON.stringify(data.fitnessGoals || []),
    experienceLevel: data.experienceLevel || null,
  };
}

/**
 * SQL paraméterek konvertálása tömbre (prepared statement-hez)
 */
export function sqlParamsToArray(params: ProfileSqlParams): (string | number | null)[] {
  return [
    params.userId,        // $1
    params.displayName,   // $2
    params.height,        // $3
    params.weight,        // $4
    params.birthdate,     // $5
    params.gender,        // $6
    params.fitnessGoals,  // $7
    params.experienceLevel // $8
  ];
}

/**
 * ProfileRecord (adatbázisból) konvertálása ProfileFormData-ra
 */
export function profileRecordToFormData(record: ProfileRecord): ProfileFormData {
  // Fitness goals parsing - handle different formats
  let fitnessGoals: string[] = [];
  if (record.fitness_goals) {
    try {
      if (typeof record.fitness_goals === 'string') {
        fitnessGoals = JSON.parse(record.fitness_goals);
      } else if (Array.isArray(record.fitness_goals)) {
        fitnessGoals = record.fitness_goals;
      }
    } catch (error) {
      console.warn('Failed to parse fitness_goals:', error);
      fitnessGoals = [];
    }
  }

  // Type safe casting with validation
  const gender = record.gender as ProfileFormData['gender'];
  const experienceLevel = record.experience_level as ProfileFormData['experienceLevel'];

  return {
    displayName: record.display_name || record.full_name || '',
    height: record.height ?? null,
    weight: record.weight ?? null,
    birthdate: record.birthdate || '',
    gender: gender || '',
    fitnessGoals,
    experienceLevel: experienceLevel || '',
  };
}

/**
 * ProfileFormData validáció
 */
export function validateProfileFormData(data: unknown): ProfileFormData {
  return profileSchema.parse(data);
}

/**
 * Biztonságos ProfileFormData létrehozás default értékekkel
 */
export function createDefaultProfileFormData(): ProfileFormData {
  return {
    displayName: '',
    height: null,
    weight: null,
    birthdate: '',
    gender: '',
    fitnessGoals: [],
    experienceLevel: '',
  };
}

/**
 * SQL query strings - használatra kész lekérdezések
 */
export const PROFILE_SQL_QUERIES = {
  // UPSERT profil
  UPSERT: `
    INSERT INTO public.profiles (
        id, display_name, full_name, height, weight, birthdate, 
        gender, fitness_goals, experience_level, updated_at
    ) VALUES (
        $1, $2, $2, $3, $4, $5::DATE, $6, $7::JSONB, $8, NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        full_name = EXCLUDED.display_name,
        height = EXCLUDED.height,
        weight = EXCLUDED.weight,
        birthdate = EXCLUDED.birthdate,
        gender = EXCLUDED.gender,
        fitness_goals = EXCLUDED.fitness_goals,
        experience_level = EXCLUDED.experience_level,
        updated_at = NOW()
  `,

  // SELECT profil
  SELECT: `
    SELECT 
        id,
        COALESCE(display_name, full_name, '') as display_name,
        COALESCE(full_name, display_name, '') as full_name,
        height,
        weight,
        TO_CHAR(birthdate, 'YYYY-MM-DD') as birthdate,
        COALESCE(gender, '') as gender,
        COALESCE(fitness_goals, '[]'::jsonb) as fitness_goals,
        COALESCE(experience_level, '') as experience_level,
        created_at,
        updated_at
    FROM public.profiles 
    WHERE id = $1
  `,

  // UPDATE részleges
  UPDATE_PARTIAL: `
    UPDATE public.profiles SET
        display_name = CASE WHEN $2 IS NOT NULL THEN $2 ELSE display_name END,
        full_name = CASE WHEN $2 IS NOT NULL THEN $2 ELSE full_name END,
        height = CASE WHEN $3 IS NOT NULL THEN $3 ELSE height END,
        weight = CASE WHEN $4 IS NOT NULL THEN $4 ELSE weight END,
        birthdate = CASE WHEN $5 IS NOT NULL THEN $5::DATE ELSE birthdate END,
        gender = CASE WHEN $6 IS NOT NULL THEN $6 ELSE gender END,
        fitness_goals = CASE WHEN $7 IS NOT NULL THEN $7::JSONB ELSE fitness_goals END,
        experience_level = CASE WHEN $8 IS NOT NULL THEN $8 ELSE experience_level END,
        updated_at = NOW()
    WHERE id = $1
  `,

  // Profil létezésének ellenőrzése
  EXISTS: `
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = $1) as exists
  `,

  // Fitness goals frissítése
  UPDATE_FITNESS_GOALS: `
    UPDATE public.profiles 
    SET fitness_goals = $2::jsonb, updated_at = NOW()
    WHERE id = $1
  `,
} as const;

// Database client interface
interface DatabaseClient {
  rpc(functionName: string, params: { query: string; params: (string | number | null)[] }): Promise<{ 
    data: unknown; 
    error: { message: string } | null 
  }>;
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        single(): Promise<{ data: ProfileRecord | null; error: { code?: string; message: string } | null }>;
      };
    };
  };
}

/**
 * Példa használat Supabase/PostgreSQL klienssel
 */
export class ProfileSqlHelper {
  constructor(private dbClient: DatabaseClient) {}

  async upsertProfile(userId: string, formData: ProfileFormData): Promise<ProfileRecord | null> {
    const params = profileFormDataToSqlParams(userId, formData);
    const values = sqlParamsToArray(params);
    
    const { data, error } = await this.dbClient.rpc('execute_sql', {
      query: PROFILE_SQL_QUERIES.UPSERT,
      params: values
    });

    if (error) {
      throw new Error(`Profile upsert failed: ${error.message}`);
    }

    return data as ProfileRecord | null;
  }

  async getProfile(userId: string): Promise<ProfileFormData | null> {
    const { data, error } = await this.dbClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Profile fetch failed: ${error.message}`);
    }

    return data ? profileRecordToFormData(data) : null;
  }

  async profileExists(userId: string): Promise<boolean> {
    const { data, error } = await this.dbClient.rpc('execute_sql', {
      query: PROFILE_SQL_QUERIES.EXISTS,
      params: [userId]
    });

    if (error) {
      throw new Error(`Profile existence check failed: ${error.message}`);
    }

    return (data as { exists: boolean }[])?.[0]?.exists || false;
  }
}

/**
 * Form adatok preprocessing mentés előtt
 */
export function preprocessProfileFormData(data: ProfileFormData): ProfileFormData {
  // Safe casting for enum values
  const gender = data.gender?.trim() as ProfileFormData['gender'];
  const experienceLevel = data.experienceLevel?.trim() as ProfileFormData['experienceLevel'];

  return {
    ...data,
    // Üres stringek null-lá konvertálása
    displayName: data.displayName?.trim() || '',
    height: data.height === 0 ? null : data.height,
    weight: data.weight === 0 ? null : data.weight,
    birthdate: data.birthdate?.trim() || '',
    gender: gender || '',
    fitnessGoals: Array.isArray(data.fitnessGoals) ? data.fitnessGoals : [],
    experienceLevel: experienceLevel || '',
  };
}

/**
 * Fitness goals helper függvények
 */
export const FitnessGoalsHelper = {
  // Elérhető célok
  AVAILABLE_GOALS: ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'Flexibility'] as const,
  
  // Goal hozzáadása
  addGoal: (currentGoals: string[], newGoal: string): string[] => {
    if (!currentGoals.includes(newGoal)) {
      return [...currentGoals, newGoal];
    }
    return currentGoals;
  },
  
  // Goal eltávolítása
  removeGoal: (currentGoals: string[], goalToRemove: string): string[] => {
    return currentGoals.filter(goal => goal !== goalToRemove);
  },
  
  // Validáció
  validateGoals: (goals: string[]): boolean => {
    return goals.every(goal => (FitnessGoalsHelper.AVAILABLE_GOALS as readonly string[]).includes(goal));
  },
};
