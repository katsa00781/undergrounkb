import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

export type ProfileFormData = {
  displayName?: string;
  height?: number | null;
  weight?: number | null;
  birthdate?: string;
  gender?: 'male' | 'female' | 'other' | '';
  fitnessGoals?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | '';
};

// Define a type for database profile updates
// This allows optional fields for schema flexibility
export type ProfileDatabaseUpdate = {
  height?: number | null;
  weight?: number | null;
  birthdate?: string | null;
  gender?: string | null;
  fitness_goals?: string[];
  experience_level?: string | null;
  updated_at: string;
  full_name?: string | null;
  display_name?: string | null;
};

// Function to check if the db schema has the required columns
async function verifyProfileSchema(): Promise<boolean> {
  try {
    // First check the table exists with basic query
    const { error: simpleError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    // If we can't even get the id, there's a more serious issue
    if (simpleError) {
      console.error('Basic profile table query failed:', simpleError);
      return false;
    }

    // Now check for the full_name column specifically
    const { error: nameError } = await supabase
      .from('profiles')
      .select('full_name')
      .limit(1);

    if (nameError) {
      // Check if the error is specifically about the missing column
      if (nameError.message.includes('does not exist')) {
        console.warn('Schema verification: full_name column does not exist in profiles table');
      } else {
        console.warn('Profile schema verification failed with unexpected error:', nameError.message);
      }
      return false;
    }

    // Check additional required columns
    const { error: additionalError } = await supabase
      .from('profiles')
      .select('height, weight, fitness_goals')
      .limit(1);

    if (additionalError) {
      console.warn('Additional profile columns verification failed:', additionalError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error verifying profile schema:', err);
    return false;
  }
}

export const useProfileProvider = () => {
  const { user } = useAuth();
  const { profile, setProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  // Verify schema once on component mount
  useEffect(() => {
    const checkSchema = async () => {
      const isValid = await verifyProfileSchema();

      if (!isValid) {
        // Use console.info instead of warn to avoid polluting error logs
        // This is expected behavior during initial load when columns might be missing
        console.info('Profile schema might be missing required columns. This will be handled gracefully.');
      } else {
        console.info('Profile schema verification successful.');
      }
    };

    checkSchema();
  }, []);

  // Debug profile properties

  // Safely check for property existence
  const hasFullName = profile && 'full_name' in profile;

  // Convert database profile to form data format
  const userProfile: ProfileFormData | null = profile ? {
    displayName: 
      // Check for full_name property existence first, then check value
      hasFullName && profile.full_name
        ? String(profile.full_name)
        : (profile.email || ''),
    // Use type-safe access to profile fields
    height: profile.height || null,
    weight: profile.weight || null,
    birthdate: profile.birthdate || '',
    gender: (profile.gender || '') as 'male' | 'female' | 'other' | '',
    fitnessGoals: Array.isArray(profile.fitness_goals) ? profile.fitness_goals : [],
    experienceLevel: (profile.experience_level || '') as 'beginner' | 'intermediate' | 'advanced' | ''
  } : null;

  const updateUserProfile = async (data: ProfileFormData) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return null;
    }

    try {
      setIsLoading(true);

      // Prepare the updates object with all fields
      // Make sure fitness_goals is always a valid array
      const fitnessGoalsArray = Array.isArray(data.fitnessGoals) ? data.fitnessGoals : [];

      // If fitnessGoals array is empty, provide default values
      const backupGoals = ['Strength', 'Flexibility'].filter(g => !fitnessGoalsArray.includes(g));

      // Verify schema but don't stop the operation if it fails
      const schemaValid = await verifyProfileSchema();
      if (!schemaValid) {
        console.info('Schema validation did not pass, but we will attempt to use fallback approaches');
        // We don't show toast error here anymore to reduce user confusion
      }

      // Create the updates object based on what fields are available
      // Using our ProfileDatabaseUpdate type for type safety
      const updates: ProfileDatabaseUpdate = {
        height: data.height,
        weight: data.weight,
        birthdate: data.birthdate || null,
        gender: data.gender || null,
        // Explicitly set the typed array for the `fitness_goals` field
        fitness_goals: fitnessGoalsArray.length > 0 ? fitnessGoalsArray : backupGoals,
        experience_level: data.experienceLevel || null,
        updated_at: new Date().toISOString()
      };

      // Add full name and display name conditionally
      if (data.displayName && data.displayName.trim()) {
        updates.full_name = data.displayName.trim();
        // We also send display_name for SQL compatibility
        updates.display_name = data.displayName.trim();
      }

      // Try-Catch block specifically for the update operation
      try {

        // ELSŐ MEGOLDÁS: Security Definer function használata (biztonságosabb)
        const { data: functionResult, error: functionError } = await supabase
          .rpc('update_user_profile', {
            user_id: user.id,
            profile_data: updates
          });

        if (!functionError && functionResult && functionResult.length > 0) {
          const updatedProfile = functionResult[0];
          setProfile(updatedProfile);
          toast.success('Profile updated successfully');
          return updatedProfile;
        }

        // Ha a function nem működik, próbáljuk a direkt UPDATE-et
        console.info('Function approach failed, trying direct update:', functionError?.message);

        // MÁSODIK MEGOLDÁS: Direkt tábla frissítés
        let result = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        // If there's a schema error, try again with a reduced set of fields
        if (result.error && result.error.message.includes('column') && result.error.message.includes('does not exist')) {
          console.warn('Column error detected, trying with reduced field set:', result.error.message);

          // Strip out the problematic fields based on the error message
          const errorField = result.error.message.match(/column ["']([^"']+)["']/)?.[1];
          if (errorField && errorField in updates) {

            // Create a new object without the problematic field
            // Using explicit typing to avoid TypeScript errors
            const safeUpdates: ProfileDatabaseUpdate = Object.fromEntries(
              Object.entries(updates).filter(([key]) => key !== errorField)
            ) as ProfileDatabaseUpdate;

            // Try again with the reduced field set
            result = await supabase
              .from('profiles')
              .update(safeUpdates)
              .eq('id', user.id)
              .select()
              .single();
          }
        }

        // Check if we still have an error
        if (result.error) {
          console.error('Database update error after retry:', result.error);
          throw result.error;
        }

        const updatedProfile = result.data;

        // Update the local profile state
        if (updatedProfile) {
          setProfile(updatedProfile);
          toast.success('Profile updated successfully');
          return updatedProfile;
        }
      } catch (updateError) {
        console.error('Error during profile update operation:', updateError);
        throw updateError; // Re-throw to be caught by the outer try-catch
      }

      return null;
    } catch (error: unknown) {
      console.error('Error updating profile:', error);

      // More user-friendly error message based on error type
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          toast.error('Engedély hiba: RLS policy-k szükségesek. Futtasd le a fix_profiles_permissions.sql script-et!');
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          toast.error('Database schema mismatch. Please contact the administrator.');
        } else if (error.message.includes('not found in the schema cache')) {
          toast.error('Schema cache issue. Please reload the page and try again.');
        } else if (error.message.includes('42501')) {
          toast.error('Adatbázis jogosultsági hiba. Ellenőrizd a RLS policy-kat a profiles táblán.');
        } else {
          toast.error('Failed to update profile: ' + error.message);
        }
      } else {
        toast.error('Failed to update profile');
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userProfile,
    updateUserProfile,
    isLoading
  };
};
