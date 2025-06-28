import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Trash2, GripVertical, Sparkles, RotateCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Exercise, getExercises } from '../lib/exercises';
import { createWorkout } from '../lib/workouts';
import { getMovementPatterns } from '../lib/exerciseService';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<{ [sectionId: string]: string }>({});
  const [movementPatternFilters, setMovementPatternFilters] = useState<{ [sectionId: string]: string }>({});
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDay>(1);
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramType>('4napos');
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const onSubmit = async (data: WorkoutFormData) => {
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

  const addSection = () => {
    const newSectionId = Date.now().toString();
    setSections([...sections, { id: newSectionId, name: '', exercises: [{ id: '1' }] }]);
  };

  const removeSection = (sectionIndex: number) => {
    setSections(sections.filter((_, i) => i !== sectionIndex));
    const newCategoryFilters = { ...categoryFilters };
    delete newCategoryFilters[sections[sectionIndex].id];
    setCategoryFilters(newCategoryFilters);
  };

  const addExercise = (sectionIndex: number) => {
    const newSections = [...sections];
    // Simply add a new exercise with a unique ID
    newSections[sectionIndex].exercises.push({ 
      id: Date.now().toString(),
      sets: 3,
      reps: 10
    });
    setSections(newSections);
  };

  const removeExercise = (sectionIndex: number, exerciseIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].exercises = newSections[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setSections(newSections);
  };

  const categories = Array.from(new Set(exercises.map(ex => ex.category)));

  const getFilteredExercises = (sectionId: string) => {
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

  const updateCategoryFilter = (sectionId: string, category: string) => {
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
  
  const updateMovementPatternFilter = (sectionId: string, movementPattern: string) => {
    setMovementPatternFilters(prev => ({
      ...prev,
      [sectionId]: movementPattern === prev[sectionId] ? '' : movementPattern,
    }));
  };

  // Automatikusan beállítja a mozgásminta szűrőt a placeholder gyakorlat alapján
  const setMovementPatternForPlaceholder = (sectionId: string, placeholderId: string) => {
    let movementPattern = '';
    
    if (placeholderId.includes('terddom-bi')) {
      movementPattern = 'knee_dominant_bilateral';
    } else if (placeholderId.includes('terddom-uni')) {
      movementPattern = 'knee_dominant_unilateral';
    } else if (placeholderId.includes('csipo-bi') || placeholderId.includes('csipo-uni')) {
      movementPattern = placeholderId.includes('csipo-bi') ? 'hip_dominant_bilateral' : 'hip_dominant_unilateral';
    } else if (placeholderId.includes('horiz-nyomas-bi')) {
      movementPattern = 'horizontal_push_bilateral';
    } else if (placeholderId.includes('horiz-nyomas-uni')) {
      movementPattern = 'horizontal_push_unilateral';
    } else if (placeholderId.includes('vert-nyomas') || placeholderId.includes('vertikalis-nyomas')) {
      movementPattern = 'vertical_push_bilateral';
    } else if (placeholderId.includes('vert-huzas') || placeholderId.includes('vertikalis-huzas')) {
      movementPattern = 'vertical_pull_bilateral';
    } else if (placeholderId.includes('horiz-huzas-bi')) {
      movementPattern = 'horizontal_pull_bilateral';
    } else if (placeholderId.includes('horiz-huzas-uni')) {
      movementPattern = 'horizontal_pull_unilateral';
    } else if (placeholderId.includes('fms')) {
      movementPattern = 'mobilization'; // FMS korrekciós gyakorlatok általában mobilizációsak
    }
    
    if (movementPattern) {
      setMovementPatternFilters(prev => ({
        ...prev,
        [sectionId]: movementPattern,
      }));
    }
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

      // Automatikusan beállítjuk a mozgásminta szűrőket minden placeholder gyakorlathoz
      formattedSections.forEach((section, index) => {
        const sectionId = (index + 1).toString();
        
        // Ellenőrizzük, hogy van-e placeholder gyakorlat ebben a szekcióban
        const hasPlaceholder = section.exercises.some(exercise => 
          exercise.exerciseId?.startsWith('placeholder-')
        );
        
        if (hasPlaceholder) {
          // Megkeressük az első placeholder gyakorlatot és beállítjuk a szűrőt
          const firstPlaceholder = section.exercises.find(exercise => 
            exercise.exerciseId?.startsWith('placeholder-')
          );
          
          if (firstPlaceholder?.exerciseId) {
            setMovementPatternForPlaceholder(sectionId, firstPlaceholder.exerciseId);
          }
        }
      });

      // Force form to re-render with new values by updating form state
      setTimeout(() => {
        formattedSections.forEach((section, sectionIndex) => {
          section.exercises.forEach((exercise, exerciseIndex) => {
            // Set the exercise ID in the form
            if (exercise.exerciseId) {
              const fieldName = `sections.${sectionIndex}.exercises.${exerciseIndex}.exerciseId`;
              document.querySelector(`select[name="${fieldName}"]`)?.setAttribute('value', exercise.exerciseId);
            }
          });
        });
      }, 100);
      
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Workout Info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Workout Title
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Enter workout title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                {...register('date')}
                type="date"
                id="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes)
              </label>
              <input
                {...register('duration', { valueAsNumber: true })}
                type="number"
                id="duration"
                min="1"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="45"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Add any workout notes..."
            />
          </div>
        </div>

        {/* Workout Sections */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Workout Sections</h2>
            <button
              type="button"
              onClick={addSection}
              className="btn btn-outline flex items-center gap-2"
            >
              <Plus size={16} />
              Add Section
            </button>
          </div>

          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex-1">
                  <input
                    {...register(`sections.${sectionIndex}.name`)}
                    type="text"
                    placeholder="Section name (e.g., Warm-up, Main Set, Cool-down)"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-medium shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    value={section.name}
                    onChange={(e) => {
                      const newSections = [...sections];
                      newSections[sectionIndex].name = e.target.value;
                      setSections(newSections);
                    }}
                  />
                  {errors.sections?.[sectionIndex]?.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.sections[sectionIndex]?.name?.message}
                    </p>
                  )}
                </div>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(sectionIndex)}
                    className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              {/* Exercise Filters */}
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filter by Category
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => updateCategoryFilter(section.id, category)}
                        className={`rounded-md px-3 py-1 text-sm ${
                          categoryFilters[section.id] === category
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Movement Pattern Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filter by Movement Pattern
                    {movementPatternFilters[section.id] && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        (szűrő aktív)
                      </span>
                    )}
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getMovementPatterns().map((pattern) => (
                      <button
                        key={pattern.id}
                        type="button"
                        onClick={() => updateMovementPatternFilter(section.id, pattern.id)}
                        className={`rounded-md px-3 py-1 text-sm ${
                          movementPatternFilters[section.id] === pattern.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {pattern.label}
                        {movementPatternFilters[section.id] === pattern.id && (
                          <span className="ml-1 text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {movementPatternFilters[section.id] && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => updateMovementPatternFilter(section.id, '')}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Szűrő törlése
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Exercises */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">Exercises</h3>
                  <button
                    type="button"
                    onClick={() => addExercise(sectionIndex)}
                    className="btn btn-sm btn-outline flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Exercise
                  </button>
                </div>

                {section.exercises.map((exercise, exerciseIndex) => (
                  <div key={exercise.id} className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Exercise {exerciseIndex + 1}
                        </span>
                      </div>
                      {section.exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExercise(sectionIndex, exerciseIndex)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Exercise Selection */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Exercise
                        </label>
                        <select
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.exerciseId`)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          value={exercise.exerciseId || ''}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].exercises[exerciseIndex].exerciseId = e.target.value;
                            // Clear the placeholder name when a real exercise is selected
                            if (e.target.value && !e.target.value.startsWith('placeholder-')) {
                              newSections[sectionIndex].exercises[exerciseIndex].name = undefined;
                              newSections[sectionIndex].exercises[exerciseIndex].exerciseName = undefined;
                            }
                            setSections(newSections);
                          }}
                        >
                          <option value="">Select an exercise</option>
                          {getFilteredExercises(section.id).map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name}
                            </option>
                          ))}
                        </select>
                        
                        {/* Show placeholder exercise name and movement pattern below select */}
                        {exercise.exerciseId?.startsWith('placeholder-') && exercise.name && (
                          <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 p-2 dark:bg-yellow-900/20 dark:border-yellow-700">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                              Generált gyakorlat: {exercise.name}
                            </p>
                            {/* Show movement pattern info with clickable filter info */}
                            {exercise.exerciseId.includes('terddom') && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                                Mozgásminta: Térddomináns ({exercise.exerciseId.includes('bi') ? 'Kétoldali' : 'Egyoldali'})
                                <br />
                                <span className="italic">Szűrő automatikusan beállítva: "Knee Dominant {exercise.exerciseId.includes('bi') ? 'Bilateral' : 'Unilateral'}"</span>
                              </p>
                            )}
                            {exercise.exerciseId.includes('csipo') && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                                Mozgásminta: Csípődomináns ({exercise.exerciseId.includes('bi') ? 'Kétoldali' : 'Egyoldali'})
                                <br />
                                <span className="italic">Szűrő automatikusan beállítva: "Hip Dominant {exercise.exerciseId.includes('bi') ? 'Bilateral' : 'Unilateral'}"</span>
                              </p>
                            )}
                            {exercise.exerciseId.includes('nyomas') && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                                Mozgásminta: {exercise.exerciseId.includes('horiz') ? 'Horizontális' : 'Vertikális'} nyomás
                                <br />
                                <span className="italic">Szűrő automatikusan beállítva: "{exercise.exerciseId.includes('horiz') ? 'Horizontal' : 'Vertical'} Push"</span>
                              </p>
                            )}
                            {exercise.exerciseId.includes('huzas') && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                                Mozgásminta: {exercise.exerciseId.includes('horiz') ? 'Horizontális' : 'Vertikális'} húzás
                                <br />
                                <span className="italic">Szűrő automatikusan beállítva: "{exercise.exerciseId.includes('horiz') ? 'Horizontal' : 'Vertical'} Pull"</span>
                              </p>
                            )}
                            {exercise.exerciseId.includes('fms') && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                                Típus: FMS korrekciós gyakorlat
                                <br />
                                <span className="italic">Szűrő automatikusan beállítva: "Mobilization"</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sets */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sets
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.sets`, { valueAsNumber: true })}
                          type="number"
                          min="1"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          value={exercise.sets || 3}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].exercises[exerciseIndex].sets = Number(e.target.value);
                            setSections(newSections);
                          }}
                        />
                      </div>

                      {/* Reps */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Reps
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.reps`)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="10 or 8-12"
                          value={exercise.reps || 10}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].exercises[exerciseIndex].reps = e.target.value;
                            setSections(newSections);
                          }}
                        />
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Weight (kg)
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.weight`, { valueAsNumber: true })}
                          type="number"
                          step="0.5"
                          min="0"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Optional"
                          value={exercise.weight || ''}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].exercises[exerciseIndex].weight = Number(e.target.value) || undefined;
                            setSections(newSections);
                          }}
                        />
                      </div>

                      {/* Rest Period */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Rest (seconds)
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.restPeriod`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="60"
                          value={exercise.restPeriod || ''}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].exercises[exerciseIndex].restPeriod = Number(e.target.value) || undefined;
                            setSections(newSections);
                          }}
                        />
                      </div>

                      {/* Notes */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Notes
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.notes`)}
                          type="text"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Optional notes"
                          value={exercise.notes || ''}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].exercises[exerciseIndex].notes = e.target.value;
                            setSections(newSections);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RotateCw size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Workout
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutPlanner;
