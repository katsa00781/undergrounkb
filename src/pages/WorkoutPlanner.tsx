import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Trash2, GripVertical, Sparkles, RotateCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Exercise, getExercises } from '../lib/exercises';
import { createWorkout } from '../lib/workouts';
import { getMovementPatterns } from '../lib/exerciseService';
import { WorkoutDay, generateWorkoutPlan } from '../lib/workoutGenerator.fixed';
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

  // Get movement patterns for a given category


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

  const handleGenerateWorkout = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to generate a workout plan');
      return;
    }
    
    try {
      setIsGenerating(true);
      setShowGenerateForm(false);
      
      const generatedWorkout = await generateWorkoutPlan({
        userId: user.id,
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
            Choose a workout day to generate a structured training plan. Your workout will include exercises based on our program and any available FMS assessments.
          </p>
          
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Workout Day
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((day) => (
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
                  {day === 1 && 'Day 1 - Robbanékonyság'}
                  {day === 2 && 'Day 2 - Erő'}
                  {day === 3 && 'Day 3 - Kombináció'}
                  {day === 4 && 'Day 4 - Regeneráció'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowGenerateForm(false)}
              className="btn btn-ghost"
            >
              Cancel
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
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Plan
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Workout Details</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Workout Title
              </label>
              <input
                type="text"
                id="title"
                {...register('title')}
                className="input mt-1"
                placeholder="e.g., Upper Body Strength"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                type="date"
                id="date"
                {...register('date')}
                className="input mt-1"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes)
              </label>
              <input
                type="number"
                id="duration"
                {...register('duration', { valueAsNumber: true })}
                className="input mt-1"
                placeholder="60"
                min="1"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.duration.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                className="input mt-1"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workout Sections</h2>
            <button
              type="button"
              onClick={addSection}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Add Section</span>
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div
                key={section.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Section Name
                    </label>
                    <input
                      type="text"
                      {...register(`sections.${sectionIndex}.name`)}
                      className="input mt-1"
                      placeholder="e.g., Warm-up, Main Sets, Cool-down"
                    />
                  </div>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(sectionIndex)}
                      className="ml-4 text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                {/* Szekció-szintű szűrők eltávolítva, mivel minden gyakorlatnál elérhetőek */}

                <div className="space-y-4">
                  {section.exercises.map((exercise, exerciseIndex) => (
                    <div
                      key={exercise.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Exercise {exerciseIndex + 1}
                          </h3>
                        </div>
                        {section.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExercise(sectionIndex, exerciseIndex)}
                            className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Exercise
                          </label>
                          
                          {/* Exercise filters buttons */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <div className="flex-1">
                              <select
                                className="input mt-1 w-full"
                                onChange={(e) => updateCategoryFilter(section.id, e.target.value)}
                                value={categoryFilters[section.id] || ''}
                              >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex-1">
                              <select
                                className="input mt-1 w-full"
                                onChange={(e) => updateMovementPatternFilter(section.id, e.target.value)}
                                value={movementPatternFilters[section.id] || ''}
                                disabled={!categoryFilters[section.id]}
                              >
                                <option value="">All Movement Patterns</option>
                                {categoryFilters[section.id] && 
                                  exercises
                                    .filter(ex => ex.category.toLowerCase() === categoryFilters[section.id].toLowerCase())
                                    .map(ex => ex.movement_pattern)
                                    .filter((value, index, self) => self.indexOf(value) === index) // get unique values
                                    .map(pattern => {
                                      // Find the nice label for this pattern from the exerciseService
                                      const patternInfo = getMovementPatterns().find(p => p.id === pattern);
                                      const label = patternInfo ? patternInfo.label : pattern;
                                      return (
                                        <option key={pattern} value={pattern}>
                                          {label}
                                        </option>
                                      );
                                    })
                                }
                              </select>
                            </div>
                          </div>
                          
                          {/* Exercise select */}
                          <select
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.exerciseId`)}
                            className="input mt-1 w-full"
                          >
                            <option value="">Select an exercise</option>
                            {getFilteredExercises(section.id).map((ex) => (
                              <option 
                                key={ex.id} 
                                value={ex.id}
                              >
                                {ex.name}
                              </option>
                            ))}
                          </select>
                          
                          {/* Store exercise name for placeholders */}
                          {section.exercises[exerciseIndex]?.exerciseId?.startsWith?.('placeholder-') && (
                            <input
                              type="hidden"
                              {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.exerciseName`)}
                              value={section.exercises[exerciseIndex].name || 
                                     section.exercises[exerciseIndex].exerciseName || 
                                     "Placeholder gyakorlat"}
                            />
                          )}
                          
                          {/* Display placeholder exercise names */}
                          {section.exercises[exerciseIndex]?.exerciseId?.startsWith?.('placeholder-') && (
                            <div className="mt-1 text-sm text-amber-600">
                              {/* Try different ways to get the name */}
                              {section.exercises[exerciseIndex].name || 
                               section.exercises[exerciseIndex].exerciseName || 
                               "Placeholder gyakorlat"} (placeholder)
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sets
                          </label>
                          <input
                            type="number"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.sets`, { valueAsNumber: true })}
                            className="input mt-1"
                            placeholder="3"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reps
                          </label>
                          <input
                            type="text"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.reps`)}
                            className="input mt-1"
                            placeholder="10 vagy 8-12"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.weight`, { valueAsNumber: true })}
                            className="input mt-1"
                            placeholder="0"
                            min="0"
                            step="0.5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Rest Period (seconds)
                          </label>
                          <input
                            type="number"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.restPeriod`, { valueAsNumber: true })}
                            className="input mt-1"
                            placeholder="60"
                            min="0"
                            step="5"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Notes
                          </label>
                          <input
                            type="text"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.notes`)}
                            className="input mt-1"
                            placeholder="Any specific instructions..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addExercise(sectionIndex)}
                    className="btn btn-outline w-full"
                  >
                    <Plus size={20} />
                    <span>Add Exercise to Section</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              reset();
              setSections([{ id: '1', name: 'Main Workout', exercises: [{ id: '1' }] }]);
              setCategoryFilters({});
              setMovementPatternFilters({});
            }}
            className="btn btn-outline"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save size={20} />
                <span>Save Workout</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutPlanner;