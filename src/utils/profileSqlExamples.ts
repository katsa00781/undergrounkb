// ProfileFormData és SQL konverzió - Használati példák
// Ez a fájl bemutatja hogyan használható a profileSqlUtils.ts

import { ProfileFormData, profileFormDataToSqlParams } from './profileSqlUtils';

// ==========================================
// 1. Egyszerű konverzió példa
// ==========================================

const exampleFormData: ProfileFormData = {
  displayName: "John Doe",
  height: 180,
  weight: 75.5,
  birthdate: "1990-05-15",
  gender: "male",
  fitnessGoals: ["Weight Loss", "Strength"],
  experienceLevel: "intermediate"
};

// SQL paraméterekké konvertálás
const userId = "550e8400-e29b-41d4-a716-446655440000";
const sqlParams = profileFormDataToSqlParams(userId, exampleFormData);

console.log("SQL Parameters:", sqlParams);
// Output:
// {
//   userId: "550e8400-e29b-41d4-a716-446655440000",
//   displayName: "John Doe",
//   height: 180,
//   weight: 75.5,
//   birthdate: "1990-05-15",
//   gender: "male",
//   fitnessGoals: '["Weight Loss","Strength"]',
//   experienceLevel: "intermediate"
// }

// ==========================================
// 2. React Form submit handler példa
// ==========================================

/* 
// Profile.tsx-ben használható submit handler:

import { profileFormDataToSqlParams, sqlParamsToArray } from '../utils/profileSqlUtils';

const onSubmit = async (data: ProfileFormData) => {
  try {
    // 1. Konvertálás SQL paraméterekké
    const sqlParams = profileFormDataToSqlParams(user.id, data);
    const paramArray = sqlParamsToArray(sqlParams);
    
    // 2. SQL lekérdezés végrehajtása
    const { error } = await supabase.rpc('execute_sql', {
      query: `
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
      params: paramArray
    });
    
    if (error) {
      throw error;
    }
    
    setSuccessMessage('Profile updated successfully!');
  } catch (error) {
    setErrorMessage('Failed to update profile: ' + error.message);
  }
};
*/

// ==========================================
// 3. ProfileSqlHelper használata
// ==========================================

/*
// Supabase klienssel:

import { createClient } from '@supabase/supabase-js';
import { ProfileSqlHelper } from '../utils/profileSqlUtils';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const profileHelper = new ProfileSqlHelper(supabase);

// Profil mentése
const saveProfile = async (userId: string, formData: ProfileFormData) => {
  try {
    const result = await profileHelper.upsertProfile(userId, formData);
    console.log('Profile saved:', result);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

// Profil betöltése
const loadProfile = async (userId: string) => {
  try {
    const profileData = await profileHelper.getProfile(userId);
    if (profileData) {
      // Form feltöltése az adatokkal
      reset(profileData);
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};

// Profil létezésének ellenőrzése
const checkProfile = async (userId: string) => {
  try {
    const exists = await profileHelper.profileExists(userId);
    console.log('Profile exists:', exists);
  } catch (error) {
    console.error('Check failed:', error);
  }
};
*/

// ==========================================
// 4. Kézi SQL lekérdezés végrehajtása
// ==========================================

/*
// Direkt SQL lekérdezés Supabase-el:

const executeProfileUpsert = async (userId: string, formData: ProfileFormData) => {
  const sqlParams = profileFormDataToSqlParams(userId, formData);
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
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
      RETURNING *;
    `,
    params: [
      sqlParams.userId,
      sqlParams.displayName,
      sqlParams.height,
      sqlParams.weight,
      sqlParams.birthdate,
      sqlParams.gender,
      sqlParams.fitnessGoals,
      sqlParams.experienceLevel
    ]
  });
  
  return { data, error };
};
*/

// ==========================================
// 5. Fitness Goals manipuláció példák
// ==========================================

/*
import { FitnessGoalsHelper } from '../utils/profileSqlUtils';

// Goal hozzáadása
let currentGoals = ["Weight Loss"];
currentGoals = FitnessGoalsHelper.addGoal(currentGoals, "Strength");
console.log(currentGoals); // ["Weight Loss", "Strength"]

// Goal eltávolítása
currentGoals = FitnessGoalsHelper.removeGoal(currentGoals, "Weight Loss");
console.log(currentGoals); // ["Strength"]

// Validáció
const isValid = FitnessGoalsHelper.validateGoals(["Weight Loss", "InvalidGoal"]);
console.log(isValid); // false

// Elérhető célok
console.log(FitnessGoalsHelper.AVAILABLE_GOALS);
// ["Weight Loss", "Muscle Gain", "Strength", "Endurance", "Flexibility"]
*/

// ==========================================
// 6. Típus konverziók példái
// ==========================================

/*
import { 
  profileRecordToFormData, 
  preprocessProfileFormData,
  createDefaultProfileFormData 
} from '../utils/profileSqlUtils';

// Alapértelmezett form data létrehozása
const defaultFormData = createDefaultProfileFormData();
console.log(defaultFormData);

// Adatbázis rekord konvertálása form data-vá
const dbRecord = {
  id: "user123",
  display_name: "John Doe",
  height: 180,
  weight: 75.5,
  birthdate: "1990-05-15",
  gender: "male",
  fitness_goals: ["Weight Loss", "Strength"],
  experience_level: "intermediate"
};

const formData = profileRecordToFormData(dbRecord);
console.log(formData);

// Form data preprocessing mentés előtt
const rawFormData = {
  displayName: "  John Doe  ",
  height: 0, // Will be converted to null
  weight: 75.5,
  birthdate: "  ",
  gender: "male",
  fitnessGoals: ["Weight Loss"],
  experienceLevel: "  intermediate  "
};

const cleanedFormData = preprocessProfileFormData(rawFormData);
console.log(cleanedFormData);
*/

export { exampleFormData, sqlParams };
