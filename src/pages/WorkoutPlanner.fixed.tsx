import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, RotateCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Exercise } from '../lib/exercises';
import { createWorkout } from '../lib/workouts';
import { getExercises } from '../lib/exerciseService';
import { WorkoutDay, generateWorkoutPlanV2, ProgramType } from '../lib/workoutGenerator.fixed';
import toast from 'react-hot-toast';

const workoutSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  notes: z.string().optional(),
  sections: z.array(z.object({
    name: z.string().min(1, 'Section name is required'),
    exercises: z.array(z.object({
      exerciseId: z.string(), // Allow empty exercises (placeholders)
      exerciseName: z.string().optional(), // For storing placeholder exercise names
      sets: z.number().min(1, 'Must have at least 1 set'),
      reps: z.union([
        z.number().min(1, 'Must have at least 1 rep'),
        z.string().min(1, 'Must specify reps')
      ]), // Support both string and number for reps
      weight: z.number().optional(),
      notes: z.string().optional(),
      restPeriod: z.number().optional(),
    })),
  })),
});

type WorkoutFormData = z.infer<typeof workoutSchema>;

const WorkoutPlanner = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  type SectionExercise = { 
    id: string; 
    exerciseId?: string; 
    name?: string;
    exerciseName?: string; // For storing placeholder names
    sets?: number;
    reps?: number | string;
    weight?: number;
    notes?: string;
    restPeriod?: number;
  };
  
  type Section = {
    id: string;
    name: string;
    exercises: SectionExercise[];
  };
  
  const [sections, setSections] = useState<Section[]>([{ id: '1', name: 'Main Workout', exercises: [{ id: '1' }] }]);
  const [_isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<{ [sectionId: string]: string }>({});
  const [movementPatternFilters, setMovementPatternFilters] = useState<{ [sectionId: string]: string }>({});
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDay>(1);
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramType>('4napos');
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const {
    register: _register,
    handleSubmit: _handleSubmit,
    formState: { errors: _errors },
    reset,
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      sections: [{ name: 'Main Workout', exercises: [{ sets: 3, reps: 10 }] }],
    },
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      toast.error('Failed to load exercises');
    }
  };

  const _onSubmit = async (data: WorkoutFormData) => {
    try {
      setIsLoading(true);
      console.log('Form data to submit:', JSON.stringify(data, null, 2));
      
      if (!user) {
        throw new Error('User is not logged in');
      }
      
      // Validate sections before saving
      if (!data.sections || data.sections.length === 0) {
        throw new Error('Workout must have at least one section');
      }
      
      for (const section of data.sections) {
        if (!section.exercises || section.exercises.length === 0) {
          throw new Error(`Section "${section.name}" must have at least one exercise`);
        }
        
        // Remove placeholder exercises before saving
        section.exercises = section.exercises.filter(exercise => 
          exercise.exerciseId && !exercise.exerciseId.startsWith('placeholder-')
        );
        
        // Remove exerciseName field which is only used for UI display
        section.exercises.forEach(exercise => {
          if ('exerciseName' in exercise) {
            delete (exercise as {exerciseName?: string}).exerciseName;
          }
        });
        
        if (section.exercises.length === 0) {
          throw new Error(`Section "${section.name}" must have at least one real exercise`);
        }
      }
      
      console.log('Calling createWorkout with user_id:', user.id);
      
      const savedWorkout = await createWorkout({
        ...data,
        user_id: user.id,
      });

      console.log('Workout saved successfully:', savedWorkout);
      toast.success('Workout saved successfully');
      reset();
      setSections([{ id: '1', name: 'Main Workout', exercises: [{ id: '1' }] }]);
      setCategoryFilters({});
      setMovementPatternFilters({});
    } catch (error) {
      console.error('Error saving workout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save workout';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const _addSection = () => {
    const newSectionId = Date.now().toString();
    setSections([...sections, { id: newSectionId, name: '', exercises: [{ id: '1' }] }]);
  };

  const _removeSection = (sectionIndex: number) => {
    setSections(sections.filter((_, i) => i !== sectionIndex));
    const newCategoryFilters = { ...categoryFilters };
    delete newCategoryFilters[sections[sectionIndex].id];
    setCategoryFilters(newCategoryFilters);
  };

  const _addExercise = (sectionIndex: number) => {
    const newSections = [...sections];
    // Simply add a new exercise with a unique ID
    newSections[sectionIndex].exercises.push({ 
      id: Date.now().toString(),
      sets: 3,
      reps: 10
    });
    setSections(newSections);
  };

  const _removeExercise = (sectionIndex: number, exerciseIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].exercises = newSections[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setSections(newSections);
  };

  const _categories = Array.from(new Set(exercises.map(ex => ex.category)));

  const _getFilteredExercises = (sectionId: string) => {
    const selectedCategory = categoryFilters[sectionId];
    const selectedMovementPattern = movementPatternFilters[sectionId];
    
    return exercises.filter(ex => {
      // Apply category filter
      const matchesCategory = !selectedCategory || ex.category.toLowerCase() === selectedCategory.toLowerCase();
      
      // Apply movement pattern filter
      const matchesMovementPattern = !selectedMovementPattern || ex.movement_pattern === selectedMovementPattern;
      
      return matchesCategory && matchesMovementPattern;
    });
  };

  const _updateCategoryFilter = (sectionId: string, category: string) => {
    // Update category filter
    setCategoryFilters(prev => {
      const newCategory = category === prev[sectionId] ? '' : category;
      return {
        ...prev,
        [sectionId]: newCategory,
      };
    });
    
    // Reset movement pattern filter when category changes
    setMovementPatternFilters(prev => ({
      ...prev,
      [sectionId]: '', 
    }));
  };
  
  const _updateMovementPatternFilter = (sectionId: string, movementPattern: string) => {
    setMovementPatternFilters(prev => ({
      ...prev,
      [sectionId]: movementPattern === prev[sectionId] ? '' : movementPattern,
    }));
  };

  const handleGenerateWorkout = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to generate a workout plan');
      return;
    }
    
    try {
      setIsGenerating(true);
      setShowGenerateForm(false);
      
      // Use the new V2 generator with program type support
      const generatedWorkout = await generateWorkoutPlanV2({
        userId: user.id,
        programType: selectedProgramType,
        day: selectedWorkoutDay,
        includeWeights: true,
        adjustForFMS: true
      });
      
      // Map the generated workout structure to our form structure
      const formattedSections = generatedWorkout.sections.map((section) => {
        return {
          name: section.name,
          exercises: section.exercises.map(exercise => {
            // For placeholders, we need to save the name 
            const isPlaceholder = exercise.exerciseId.startsWith('placeholder-');
            
            return {
              exerciseId: exercise.exerciseId,
              // For placeholders, store name to display it later
              exerciseName: isPlaceholder ? exercise.name : undefined,
              sets: Number(exercise.sets) || 3,
              // Preserve string reps like "6-8" or "10 mindkét oldalra"
              reps: typeof exercise.reps === 'string' && isNaN(Number(exercise.reps)) 
                ? exercise.reps 
                : (Number(exercise.reps) || 10),
              weight: exercise.weight || undefined,
              notes: exercise.instruction || undefined,
              restPeriod: exercise.restPeriod || 60,
            };
          })
        };
      });

      // Reset form with generated data
      reset({
        title: generatedWorkout.title,
        date: generatedWorkout.date,
        duration: generatedWorkout.duration,
        notes: generatedWorkout.notes || '',
        sections: formattedSections
      });
      
      // Update sections state for UI rendering with names
      setSections(formattedSections.map((section, index) => ({
        id: (index + 1).toString(),
        name: section.name,
        exercises: section.exercises.map((exercise, exIndex) => {
          // Try to find the exercise in our loaded exercises list
          const exerciseDetails = exercise.exerciseId && !exercise.exerciseId.startsWith('placeholder-') 
            ? exercises.find(e => e.id === exercise.exerciseId) 
            : null;
          
          return { 
            id: `${index + 1}-${exIndex + 1}`,
            ...exercise,
            // For placeholders, use the name from the generated workout
            name: exerciseDetails?.name || 
                  (exercise.exerciseId?.startsWith('placeholder-') ? exercise.exerciseName : undefined)
          };
        })
      })));
      
      toast.success('Workout plan generated successfully');
    } catch (error) {
      console.error('Failed to generate workout plan:', error);
      toast.error('Failed to generate workout plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGenerateForm = () => {
    setShowGenerateForm(!showGenerateForm);
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Planner</h1>
        
        <div className="mt-4 flex space-x-2 sm:mt-0">
          <button
            type="button"
            onClick={toggleGenerateForm}
            className="btn btn-primary flex items-center gap-2"
          >
            <Sparkles size={16} />
            Generate Workout
          </button>
        </div>
      </div>

      {/* Generate Workout Form */}
      {showGenerateForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Generate Workout Plan</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Choose a workout program type and day to generate a structured training plan. Your workout will include exercises based on our program and any available FMS assessments.
          </p>
          
          {/* Program Type Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Program Type
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedProgramType('2napos');
                  // Reset day if it's day 3 or 4 (not valid in 2-day program)
                  if (selectedWorkoutDay > 2) {
                    setSelectedWorkoutDay(1);
                  }
                }}
                className={`rounded-md px-4 py-2 ${
                  selectedProgramType === '2napos' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                2 napos program
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProgramType('3napos');
                  // Reset day if it's day 4 (not valid in 3-day program)
                  if (selectedWorkoutDay === 4) {
                    setSelectedWorkoutDay(1);
                  }
                }}
                className={`rounded-md px-4 py-2 ${
                  selectedProgramType === '3napos' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                3 napos program
              </button>
              <button
                type="button"
                onClick={() => setSelectedProgramType('4napos')}
                className={`rounded-md px-4 py-2 ${
                  selectedProgramType === '4napos' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                4 napos program
              </button>
            </div>
          </div>
          
          {/* Workout Day Selection */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Workout Day
            </label>
            <div className="flex flex-wrap gap-2">
              {/* Show only relevant days based on program type */}
              {(selectedProgramType === '2napos' ? [1, 2] : 
                selectedProgramType === '3napos' ? [1, 2, 3] : 
                [1, 2, 3, 4]).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedWorkoutDay(day as WorkoutDay)}
                  className={`rounded-md px-4 py-2 ${
                    selectedWorkoutDay === day 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {selectedProgramType === '2napos' ? (
                    <>
                      {day === 1 && 'Nap 1 - Teljes test A'}
                      {day === 2 && 'Nap 2 - Teljes test B'}
                    </>
                  ) : selectedProgramType === '3napos' ? (
                    <>
                      {day === 1 && 'Nap 1 - Robbanékonság/Erő'}
                      {day === 2 && 'Nap 2 - Erő/Robbanékonyság'}
                      {day === 3 && 'Nap 3 - Robbanékonság/Erő'}
                    </>
                  ) : (
                    <>
                      {day === 1 && 'Nap 1 - Robbanékonyság'}
                      {day === 2 && 'Nap 2 - Erő'}
                      {day === 3 && 'Nap 3 - Kombináció'}
                      {day === 4 && 'Nap 4 - Regeneráció'}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Program summary */}
          <div className="mb-6 mt-4 rounded bg-gray-50 p-3 dark:bg-gray-700">
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Kiválasztott program:
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedProgramType === '2napos' ? '2 napos program - ' : 
               selectedProgramType === '3napos' ? '3 napos program - ' : 
               '4 napos program - '}
              {selectedProgramType === '2napos' ? (
                <>
                  {selectedWorkoutDay === 1 && 'Nap 1 - Teljes test A'}
                  {selectedWorkoutDay === 2 && 'Nap 2 - Teljes test B'}
                </>
              ) : selectedProgramType === '3napos' ? (
                <>
                  {selectedWorkoutDay === 1 && 'Nap 1 - Robbanékonság/Erő'}
                  {selectedWorkoutDay === 2 && 'Nap 2 - Erő/Robbanékonyság'}
                  {selectedWorkoutDay === 3 && 'Nap 3 - Robbanékonság/Erő'}
                </>
              ) : (
                <>
                  {selectedWorkoutDay === 1 && 'Nap 1 - Robbanékonyság'}
                  {selectedWorkoutDay === 2 && 'Nap 2 - Erő'}
                  {selectedWorkoutDay === 3 && 'Nap 3 - Kombináció'}
                  {selectedWorkoutDay === 4 && 'Nap 4 - Regeneráció'}
                </>
              )}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowGenerateForm(false)}
              className="btn btn-ghost"
            >
              Mégse
            </button>
            <button
              type="button"
              onClick={handleGenerateWorkout}
              className="btn btn-primary flex items-center gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  Generálás...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Terv generálása
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Rest of the component with form fields - continuing from the original code... */}
      {/* This part would contain the rest of the form rendering logic */}
    </div>
  );
};

export default WorkoutPlanner;
