import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Calendar, Scale, Ruler, Target, X } from 'lucide-react';
import { useProfileProvider } from '../hooks/useProfileProvider';
import SchemaFixNotification from '../components/SchemaFixNotification';
import { showSchemaFixNotification } from '../utils/schemaNotifications';

// Elérhető fitness célok
const AVAILABLE_FITNESS_GOALS = ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'Flexibility'];

// Form validation schema
const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  height: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  birthdate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  fitnessGoals: z.array(z.string()).default([]),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', '']).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile = () => {
  const { userProfile, updateUserProfile, isLoading } = useProfileProvider();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSchemaFix, setShowSchemaFix] = useState(false);

  // Clear error state on component mount
  useEffect(() => {
    setErrorMessage('');
    setShowSchemaFix(false);
  }, []);
  // Form setup with React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    // Use minimal default values - we'll set real values from userProfile in useEffect
    defaultValues: {
      displayName: '',
      height: null,
      weight: null,
      birthdate: '',
      gender: '',
      fitnessGoals: [],
      experienceLevel: '',
    }
  });

  // Use a ref to track initialization
  const initializedRef = useRef(false);

  // Reset form when userProfile changes, with a more controlled approach
  useEffect(() => {
    // Do nothing if userProfile is not loaded yet
    if (!userProfile) return;

    // Set form values only once when the profile first loads
    if (!initializedRef.current) {

      // Create a stable set of values for the form
      const formValues: ProfileFormData = {
        displayName: userProfile.displayName || '',
        height: userProfile.height ?? null,
        weight: userProfile.weight ?? null,
        birthdate: userProfile.birthdate || '',
        gender: userProfile.gender || '',
        fitnessGoals: userProfile.fitnessGoals || [],
        experienceLevel: userProfile.experienceLevel || '',
      };

      // Reset the form with these values
      reset(formValues);

      // Mark as initialized
      initializedRef.current = true;
    }
  }, [userProfile, reset]);

  // Form submission handler
  const onSubmit = async (data: ProfileFormData) => {
    // Clear any previous messages
    setSuccessMessage('');
    setErrorMessage('');

    // Győződjünk meg róla, hogy a fitnessGoals tömb típusú
    const preparedData: ProfileFormData = {
      ...data,
      fitnessGoals: Array.isArray(data.fitnessGoals) ? data.fitnessGoals : []
    };

    try {
      // Auto-fix attempt for database schema issues
      if (errorMessage && errorMessage.includes('missing some profile fields')) {

        try {
          // Try to run the fix script via fetch API
          await fetch('/api/fix-profile-schema', { method: 'POST' })
            .catch(() => {
              // No server-side fix endpoint available, continuing with client-side
            });
        } catch {
          // Auto-fix attempt failed, continuing with submission
        }
      }

      // The useProfileProvider hook handles name splitting internally
      await updateUserProfile(preparedData);
      setSuccessMessage('Profile updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);

      // Set appropriate error message
      if (error instanceof Error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const errorMsg = 'Database schema issue detected. Please run the fix script to add required columns.';
          setErrorMessage(errorMsg);
          console.warn('Schema issue: Missing required database columns. Fix with fix-profile-database.sh');
          setShowSchemaFix(true);
          // Also show toast notification for better visibility
          showSchemaFixNotification('Missing database columns detected in the profile table.');
        } else if (error.message.includes('not found in the schema cache')) {
          const errorMsg = 'Database schema cache issue. Please run the fix script and refresh the page.';
          setErrorMessage(errorMsg);
          console.warn('Schema cache issue detected. Run fix-profile-database.sh');
          setShowSchemaFix(true);
          // Also show toast notification for schema cache issues
          showSchemaFixNotification('Schema cache issue detected. Run the reset script and refresh your browser.');
        } else {
          setErrorMessage(error.message || 'Failed to update profile');
        }
      } else {
        setErrorMessage('An unexpected error occurred');
      }

      // Clear error after 8 seconds
      setTimeout(() => setErrorMessage(''), 8000);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update your personal information and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="displayName"
                  {...register('displayName')}
                  className="input pl-10 w-full"
                  placeholder="Your full name"
                />
              </div>
              {errors.displayName && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.displayName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Birth Date
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="birthdate"
                  {...register('birthdate')}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Height (cm)
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Ruler className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="height"
                    {...register('height', { 
                      valueAsNumber: true,
                      setValueAs: v => v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v)
                    })}
                    className="input pl-10 w-full"
                    placeholder="Height in cm"
                    step="1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weight (kg)
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Scale className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="weight"
                    {...register('weight', { 
                      valueAsNumber: true,
                      setValueAs: v => v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v) 
                    })}
                    className="input pl-10 w-full"
                    placeholder="Weight in kg"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <select
                id="gender"
                {...register('gender')}
                className="input mt-1 w-full"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Fitness Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Experience Level
              </label>
              <select
                id="experienceLevel"
                {...register('experienceLevel')}
                className="input mt-1 w-full"
              >
                <option value="">Select your experience level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fitness Goals
              </label>
              <div className="mt-2 space-y-2">
                {AVAILABLE_FITNESS_GOALS.map((goal) => {
                  // Használjuk a Controller komponenst a komplex mezők kezeléséhez
                  const goalsArray = Array.isArray(watch('fitnessGoals')) ? watch('fitnessGoals') : [];
                  const isChecked = goalsArray.includes(goal);

                  return (
                    <label key={goal} className="flex items-center">
                      <input
                        type="checkbox"
                        value={goal}
                        checked={isChecked}
                        onChange={(e) => {
                          let updatedGoals = [...goalsArray];
                          if (e.target.checked) {
                            // Ha bejelöltük és még nincs benne, adjuk hozzá
                            if (!updatedGoals.includes(goal)) {
                              updatedGoals.push(goal);
                            }
                          } else {
                            // Ha kijelöltük, távolítsuk el
                            updatedGoals = updatedGoals.filter(g => g !== goal);
                          }
                          // Frissítsük a form értékét
                          reset({ ...watch(), fitnessGoals: updatedGoals }, { keepValues: true });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">{goal}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-md bg-success-50 p-4 dark:bg-success-900/30">
            <div className="flex">
              <div className="flex-shrink-0">
                <Target className="h-5 w-5 text-success-400 dark:text-success-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-success-800 dark:text-success-200">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md bg-error-50 p-4 dark:bg-error-900/30">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-error-400 dark:text-error-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-error-800 dark:text-error-200">
                  {errorMessage}
                </p>
                {errorMessage.includes('missing some profile fields') && (
                  <div className="mt-2 text-sm text-error-700 dark:text-error-300">
                    <p>Run <code className="bg-error-100 dark:bg-error-800 px-1 py-0.5 rounded">npm run fix:profile:all</code> in your terminal to fix this issue.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {isLoading && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent dark:border-gray-400"></div>
              <span className="ml-2">Processing...</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span className="ml-2">Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* Schema Fix Notification */}
      <SchemaFixNotification 
        show={showSchemaFix}
        message="Your profile can't be saved because of database schema issues. This requires a quick fix."
        onDismiss={() => setShowSchemaFix(false)}
      />
    </div>
  );
};

export default Profile;
