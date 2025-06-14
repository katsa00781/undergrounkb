import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Info,
  Save,
  User
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createFMSAssessment, getAllUsers } from '../lib/fms';
import toast from 'react-hot-toast';

const movementSchema = z.object({
  user_id: z.string().min(1, 'Please select a user'),
  deepSquat: z.number().min(0).max(3),
  hurdleStep: z.number().min(0).max(3),
  inlineLunge: z.number().min(0).max(3),
  shoulderMobility: z.number().min(0).max(3),
  activeStraightLegRaise: z.number().min(0).max(3),
  trunkStabilityPushup: z.number().min(0).max(3),
  rotaryStability: z.number().min(0).max(3),
  notes: z.string().optional(),
});

type MovementScores = z.infer<typeof movementSchema>;

interface User {
  id: string;
  email: string | null;
  name: string | null;
}

const FMSAssessment = () => {
  // We still need useAuth for authentication context, but we're not using the user object directly
  useAuth();
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<MovementScores>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      deepSquat: 0,
      hurdleStep: 0,
      inlineLunge: 0,
      shoulderMobility: 0,
      activeStraightLegRaise: 0,
      trunkStabilityPushup: 0,
      rotaryStability: 0,
    },
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Loading users for FMS assessment...');
      
      const data = await getAllUsers();
      console.log('Users loaded successfully:', data.length);
      console.log('User data:', data);
      
      if (data.length === 0) {
        console.warn('No users found in the database');
        toast('No users found in the database. Please add users first.', {
          icon: '⚠️',
          duration: 5000
        });
      } else {
        // Log each user before setting state
        data.forEach(user => {
          console.log(`User: ID=${user.id}, Email=${user.email}, Name="${user.name}"`);
        });
        
        setUsers(data);
        toast.success(`Loaded ${data.length} user${data.length === 1 ? '' : 's'}`);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      
      // Provide more helpful error message
      let errorMessage = 'Failed to load users';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        console.error('Error details:', error);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Define movement keys as a type to ensure type safety
  type MovementKey = keyof Omit<MovementScores, 'user_id' | 'notes'>;
  
  const movements = [
    {
      id: 'deepSquat' as MovementKey,
      name: 'Deep Squat',
      description: 'Tests mobility of hips, knees, and ankles',
      instructions: [
        'Stand with feet shoulder width apart',
        'Hold dowel overhead with wide grip',
        'Squat as deep as possible while keeping heels on ground',
        'Keep dowel overhead with arms extended',
      ],
    },
    {
      id: 'hurdleStep' as MovementKey,
      name: 'Hurdle Step',
      description: 'Tests stride mechanics and stability',
      instructions: [
        'Place dowel across shoulders',
        'Step over hurdle with one leg',
        'Touch heel to ground and return',
        'Maintain upright posture throughout',
      ],
    },
    {
      id: 'inlineLunge' as MovementKey,
      name: 'Inline Lunge',
      description: 'Tests mobility and stability of hips and torso',
      instructions: [
        'Place feet inline on board',
        'Lower back knee to touch board',
        'Maintain upright posture',
        'Return to starting position',
      ],
    },
    {
      id: 'shoulderMobility' as MovementKey,
      name: 'Shoulder Mobility',
      description: 'Tests bilateral shoulder range of motion',
      instructions: [
        'Make fists with both hands',
        'Place one fist behind neck',
        'Place other fist behind back',
        'Measure distance between fists',
      ],
    },
    {
      id: 'activeStraightLegRaise' as MovementKey,
      name: 'Active Straight Leg Raise',
      description: 'Tests flexibility of hamstrings and calf',
      instructions: [
        'Lie on back with legs straight',
        'Raise one leg as high as possible',
        'Keep opposite leg on ground',
        'Keep raised leg straight',
      ],
    },
    {
      id: 'trunkStabilityPushup' as MovementKey,
      name: 'Trunk Stability Pushup',
      description: 'Tests core stability and strength',
      instructions: [
        'Start in pushup position',
        'Hands shoulder width apart',
        'Perform pushup with body moving as unit',
        'No lag in lower back',
      ],
    },
    {
      id: 'rotaryStability' as MovementKey,
      name: 'Rotary Stability',
      description: 'Tests multi-plane stability',
      instructions: [
        'Start on hands and knees',
        'Extend same side arm and leg',
        'Touch elbow to knee',
        'Return to start position',
      ],
    },
  ];

  const onSubmit = async (data: MovementScores) => {
    try {
      setIsSubmitting(true);
      console.log('Submitting FMS assessment data:', data);

      const assessment = {
        user_id: data.user_id,
        date: new Date().toISOString().split('T')[0],
        deep_squat: data.deepSquat,
        hurdle_step: data.hurdleStep,
        inline_lunge: data.inlineLunge,
        shoulder_mobility: data.shoulderMobility,
        active_straight_leg_raise: data.activeStraightLegRaise,
        trunk_stability_pushup: data.trunkStabilityPushup,
        rotary_stability: data.rotaryStability,
        notes: data.notes || '',
      };

      console.log('Formatted assessment data:', assessment);
      const result = await createFMSAssessment(assessment);
      console.log('Assessment saved successfully:', result);
      toast.success('Assessment saved successfully');
      reset();
      setCurrentStep(0);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to save assessment:', error);
      let errorMessage = 'Failed to save assessment';
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        console.error('Error details:', error);
      } else {
        console.error('Unknown error type:', error);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMovement = movements[currentStep];
  const scores = watch();
  
  // Calculate the total score by explicitly summing the movement scores
  const totalScore = 
    (typeof scores.deepSquat === 'number' ? scores.deepSquat : 0) +
    (typeof scores.hurdleStep === 'number' ? scores.hurdleStep : 0) +
    (typeof scores.inlineLunge === 'number' ? scores.inlineLunge : 0) +
    (typeof scores.shoulderMobility === 'number' ? scores.shoulderMobility : 0) +
    (typeof scores.activeStraightLegRaise === 'number' ? scores.activeStraightLegRaise : 0) +
    (typeof scores.trunkStabilityPushup === 'number' ? scores.trunkStabilityPushup : 0) +
    (typeof scores.rotaryStability === 'number' ? scores.rotaryStability : 0);

  const handleScoreSelect = (score: number) => {
    // We've already typed currentMovement.id as MovementKey which is keyof MovementScores
    setValue(currentMovement.id, score, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleNext = () => {
    // Type assertion is not needed as we've properly typed currentMovement.id
    const currentScore = watch(currentMovement.id);
    if (currentScore === undefined || currentScore === null) {
      toast.error('Please select a score before continuing');
      return;
    }
    setCurrentStep(Math.min(movements.length - 1, currentStep + 1));
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleSaveClick = () => {
    // Type assertion is not needed as we've properly typed currentMovement.id
    const currentScore = watch(currentMovement.id);
    if (currentScore === undefined || currentScore === null) {
      toast.error('Please select a score before saving');
      return;
    }
    setShowConfirmDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Functional Movement Screen
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Assess movement patterns and identify limitations
          </p>
        </div>
        
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="btn btn-outline inline-flex items-center gap-2"
        >
          <Info size={20} />
          <span>Instructions</span>
          <ChevronDown
            size={20}
            className={`transform transition-transform ${
              showInstructions ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {showInstructions && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            How to Score Movements
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300">
                3
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Perfect form, no compensation
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300">
                2
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Completes movement with compensation
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300">
                1
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Unable to complete movement pattern
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                0
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Pain during movement
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                <Activity className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentMovement.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentMovement.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Movement {currentStep + 1} of {movements.length}
              </p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {totalScore}
                <span className="text-sm text-gray-500 dark:text-gray-400">/21</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select User
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  <select
                    {...register('user_id')}
                    className="input pl-10 flex-grow"
                    disabled={users.length === 0}
                  >
                    <option value="">
                      {users.length === 0 
                        ? 'No users available - Please add users first' 
                        : 'Select a user'}
                    </option>
                    {users.map((user) => {
                      // Create a display string that shows whatever information is available
                      const displayName = user.name || user.email || `User ${user.id.slice(0, 8)}`;
                      
                      return (
                        <option key={user.id} value={user.id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                  <button 
                    type="button"
                    onClick={() => loadUsers()}
                    className="btn btn-outline btn-sm"
                    title="Refresh user list"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                      <path d="M8 16H3v5"></path>
                    </svg>
                  </button>
                </div>
              </div>
              {errors.user_id && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                  {errors.user_id.message}
                </p>
              )}
            </div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Score
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((score) => {
                // Type assertion is not needed as we've properly typed currentMovement.id
                const currentScore = watch(currentMovement.id);
                const isSelected = currentScore === score;
                
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreSelect(score)}
                    className={`relative flex cursor-pointer items-center justify-center rounded-lg border p-4 transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`text-2xl font-bold ${
                        isSelected
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {score}
                    </span>
                    {isSelected && (
                      <div className="absolute -right-1 -top-1">
                        <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {errors[currentMovement.id] && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                Please select a score
              </p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Movement Instructions
            </h3>
            <ul className="space-y-2">
              {currentMovement.instructions.map((instruction, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                    {index + 1}
                  </span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>

          {currentStep === movements.length - 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input mt-1"
                placeholder="Add any observations or notes about the assessment..."
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="btn btn-outline"
            >
              Previous
            </button>
            
            {currentStep < movements.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <span>Next Movement</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSubmitting}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Save size={20} />
                <span>Complete Assessment</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-primary-600 transition-all dark:bg-primary-400"
          style={{
            width: `${((currentStep + 1) / movements.length) * 100}%`,
          }}
        ></div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Save Assessment
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Are you sure you want to save this FMS assessment? Total score: {totalScore}/21
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Confirm & Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FMSAssessment;