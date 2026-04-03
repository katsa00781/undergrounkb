import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronRight, Copy, Plus, Save, Search, Trash2, Sparkles, RotateCw, Share2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Exercise, getExercises } from '../lib/exercises';
import { createWorkout, updateWorkout, Workout } from '../lib/workouts';
import { getExerciseCategories, getExerciseCategoryLabel, getExerciseFMSFocuses, getFMSFocusLabel, getFMSFocusOptions, getMovementPatternLabel, getMovementPatterns } from '../lib/exerciseService';
import { WorkoutDay, generateWorkoutPlanV2, ProgramType } from '../lib/workoutGenerator.fixed';
import WorkoutSharingDialog from '../components/WorkoutSharingDialog';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
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

type SectionExercise = {
  id: string;
  exerciseId?: string;
  name?: string;
  exerciseName?: string;
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

const createDefaultExercise = (id: string): SectionExercise => ({
  id,
  sets: 3,
  reps: 8,
  weight: undefined,
  notes: '',
  restPeriod: undefined,
});

const createDefaultSection = (id: string, name = ''): Section => ({
  id,
  name,
  exercises: [createDefaultExercise(`${id}-1`)],
});

const getDifficultyLabel = (difficulty?: number) => {
  if (!difficulty) return 'Nincs megadva';

  if (difficulty <= 2) return 'Könnyű';
  if (difficulty === 3) return 'Közepes';
  return 'Haladó';
};

const getPlaceholderExerciseMeta = (placeholderId?: string) => {
  if (!placeholderId?.startsWith('placeholder-')) {
    return null;
  }

  if (placeholderId.includes('terddom-bi')) {
    return {
      title: 'Térd domináns bilaterális gyakorlat',
      description: 'Keress egy kétoldali, térd domináns fő gyakorlatot ehhez a blokkhoz.',
      movementPatternId: 'knee_dominant_bilateral',
      movementPatternLabel: 'Térd domináns – bilaterális',
    };
  }

  if (placeholderId.includes('terddom-uni')) {
    return {
      title: 'Térd domináns unilaterális gyakorlat',
      description: 'Keress egy egyoldali, térd domináns gyakorlatot oldalankénti munkához.',
      movementPatternId: 'knee_dominant_unilateral',
      movementPatternLabel: 'Térd domináns – unilaterális',
    };
  }

  if (placeholderId.includes('csipo-bi')) {
    return {
      title: 'Csípő domináns bilaterális gyakorlat',
      description: 'Keress egy kétoldali csípő domináns fő emelést vagy hinget.',
      movementPatternId: 'hip_dominant_bilateral',
      movementPatternLabel: 'Csípő domináns – bilaterális',
    };
  }

  if (placeholderId.includes('csipo-uni')) {
    return {
      title: 'Csípő domináns unilaterális gyakorlat',
      description: 'Keress egy egyoldali csípő domináns gyakorlatot stabilitási fókuszhoz.',
      movementPatternId: 'hip_dominant_unilateral',
      movementPatternLabel: 'Csípő domináns – unilaterális',
    };
  }

  if (placeholderId.includes('csipo-hajlitott')) {
    return {
      title: 'Csípő domináns hajlított lábas gyakorlat',
      description: 'Keress egy hajlított lábas hinge variációt vagy csípődomináns gyakorlatot.',
      movementPatternId: 'hip_dominant_bilateral',
      movementPatternLabel: 'Csípő domináns – bilaterális',
    };
  }

  if (placeholderId.includes('csipo-nyujtott')) {
    return {
      title: 'Csípő domináns nyújtott lábas gyakorlat',
      description: 'Keress egy nyújtott lábas hinge vagy posterior chain fókuszú gyakorlatot.',
      movementPatternId: 'hip_dominant_bilateral',
      movementPatternLabel: 'Csípő domináns – bilaterális',
    };
  }

  if (placeholderId.includes('horiz-nyomas-bi')) {
    return {
      title: 'Horizontális nyomás bilaterális gyakorlat',
      description: 'Keress egy kétoldali horizontális nyomó gyakorlatot a fő blokkhoz.',
      movementPatternId: 'horizontal_push_bilateral',
      movementPatternLabel: 'Horizontális nyomás – bilaterális',
    };
  }

  if (placeholderId.includes('horiz-nyomas-uni')) {
    return {
      title: 'Horizontális nyomás unilaterális gyakorlat',
      description: 'Keress egy egyoldali horizontális nyomó gyakorlatot stabilitási terheléssel.',
      movementPatternId: 'horizontal_push_unilateral',
      movementPatternLabel: 'Horizontális nyomás – unilaterális',
    };
  }

  if (placeholderId.includes('horiz-huzas-bi')) {
    return {
      title: 'Horizontális húzás bilaterális gyakorlat',
      description: 'Keress egy kétoldali horizontális húzó gyakorlatot a blokk egyensúlyához.',
      movementPatternId: 'horizontal_pull_bilateral',
      movementPatternLabel: 'Horizontális húzás – bilaterális',
    };
  }

  if (placeholderId.includes('horiz-huzas-uni')) {
    return {
      title: 'Horizontális húzás unilaterális gyakorlat',
      description: 'Keress egy egyoldali horizontális húzó gyakorlatot törzsstabilitási terheléssel.',
      movementPatternId: 'horizontal_pull_unilateral',
      movementPatternLabel: 'Horizontális húzás – unilaterális',
    };
  }

  if (placeholderId.includes('vert-nyomas-bi')) {
    return {
      title: 'Vertikális nyomás bilaterális gyakorlat',
      description: 'Keress egy kétoldali fej fölé nyomó gyakorlatot.',
      movementPatternId: 'vertical_push_bilateral',
      movementPatternLabel: 'Vertikális nyomás – bilaterális',
    };
  }

  if (placeholderId.includes('vert-nyomas-uni')) {
    return {
      title: 'Vertikális nyomás unilaterális gyakorlat',
      description: 'Keress egy egyoldali fej fölé nyomó gyakorlatot kontrollált kivitelezéssel.',
      movementPatternId: 'vertical_push_unilateral',
      movementPatternLabel: 'Vertikális nyomás – unilaterális',
    };
  }

  if (placeholderId.includes('vert-huzas')) {
    return {
      title: 'Vertikális húzás gyakorlat',
      description: 'Keress egy vertikális húzó gyakorlatot, ami illik a blokk terheléséhez.',
      movementPatternId: 'vertical_pull_bilateral',
      movementPatternLabel: 'Vertikális húzás – bilaterális',
    };
  }

  if (placeholderId.includes('fms')) {
    return {
      title: 'FMS korrekciós gyakorlat',
      description: 'Keress egy mobilizációs vagy korrekciós gyakorlatot az FMS ajánláshoz igazítva.',
      movementPatternId: 'mobilization',
      movementPatternLabel: 'Mobilizálás',
    };
  }

  if (placeholderId.includes('gait')) {
    return {
      title: 'Gait vagy törzsstabilitási gyakorlat',
      description: 'Keress egy törzsstabilitást fejlesztő gait jellegű gyakorlatot.',
      movementPatternId: 'gait_stability',
      movementPatternLabel: 'Gait – törzs stabilitás',
    };
  }

  if (placeholderId.includes('rotacios')) {
    return {
      title: 'Rotációs vagy anti-rotációs gyakorlat',
      description: 'Keress egy törzs rotációs kontrollját fejlesztő gyakorlatot.',
      movementPatternId: 'stability_anti_rotation',
      movementPatternLabel: 'Stabilitás – anti-rotáció',
    };
  }

  if (placeholderId.includes('rehab')) {
    return {
      title: 'Regenerációs vagy rehabilitációs gyakorlat',
      description: 'Keress egy alacsony terhelésű, mobilizáló vagy korrekciós gyakorlatot.',
      movementPatternId: 'mobilization',
      movementPatternLabel: 'Mobilizálás',
    };
  }

  return {
    title: 'Generált helykitöltő gyakorlat',
    description: 'Válassz egy valós gyakorlatot a blokk céljának megfelelően.',
    movementPatternId: undefined,
    movementPatternLabel: undefined,
  };
};

const WorkoutPlanner = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const editWorkout = location.state?.editWorkout as Workout | undefined;
  const copyWorkout = location.state?.copyWorkout as Workout | undefined;
  const sourceWorkout = editWorkout ?? copyWorkout;
  const isEditMode = !!editWorkout;
  const isCopyMode = !editWorkout && !!copyWorkout;
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sections, setSections] = useState<Section[]>([createDefaultSection('1', 'Main Workout')]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // Change filters to be per exercise instead of per section
  const [categoryFilters, setCategoryFilters] = useState<{ [exerciseKey: string]: string }>({});
  const [movementPatternFilters, setMovementPatternFilters] = useState<{ [exerciseKey: string]: string }>({});
  const [fmsFocusFilters, setFmsFocusFilters] = useState<{ [exerciseKey: string]: string }>({});
  const [exerciseSearchQueries, setExerciseSearchQueries] = useState<{ [exerciseKey: string]: string }>({});
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDay>(1);
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramType>('4napos');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  const [lastCreatedWorkoutId, setLastCreatedWorkoutId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isGeneratedPlan, setIsGeneratedPlan] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      sections: [{
        name: 'Main Workout',
        exercises: [{
          exerciseId: '',
          sets: 3,
          reps: 8,
          weight: undefined,
          notes: '',
          restPeriod: undefined,
        }],
      }],
    },
  });

  const watchedTitle = watch('title');
  const watchedDate = watch('date');
  const watchedDuration = watch('duration');
  const movementPatterns = getMovementPatterns();
  const exerciseCategories = getExerciseCategories();
  const fmsFocusOptions = getFMSFocusOptions();

  const isExerciseFMSCandidate = (exercise: Exercise) => exercise.category === 'fms' || getExerciseFMSFocuses(exercise).length > 0;

  useEffect(() => {
    loadExercises();
  }, []);

  // Initialize form with workout data when editing or copying
  useEffect(() => {
    if (sourceWorkout) {
      const formSections = sourceWorkout.sections.map((section) => ({
        name: section.name,
        exercises: section.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          notes: exercise.notes || '',
          restPeriod: exercise.restPeriod,
        }))
      }));

      const sectionsWithIds = formSections.map((section, index) => ({
        id: (index + 1).toString(),
        name: section.name,
        exercises: section.exercises.map((exercise, exerciseIndex) => ({
          id: (exerciseIndex + 1).toString(),
          ...exercise
        }))
      }));

      setSections(sectionsWithIds);
      setCollapsedSections({});
      setIsGeneratedPlan(Boolean(sourceWorkout.notes?.includes('Generált edzésterv')));

      reset({
        title: isCopyMode ? `${sourceWorkout.title} másolat` : sourceWorkout.title,
        date: isCopyMode ? new Date().toISOString().split('T')[0] : sourceWorkout.date,
        duration: sourceWorkout.duration,
        notes: sourceWorkout.notes || '',
        sections: formSections,
      });

      setLastCreatedWorkoutId(null);
    }
  }, [sourceWorkout, isCopyMode, reset]);

  const loadExercises = async () => {
    try {
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      toast.error('Nem sikerült betölteni a gyakorlatokat');
    }
  };

  const onSubmit = async (data: WorkoutFormData) => {
    try {
      setIsLoading(true);
      
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
      
      if (isEditMode && editWorkout) {
        const updatedWorkout = await updateWorkout(editWorkout.id, {
          ...data,
          user_id: user.id,
        });

        setLastCreatedWorkoutId(updatedWorkout.id);
        toast.success('Edzésterv sikeresen frissítve');
        navigate('/log');
      } else {
        const createdWorkout = await createWorkout({
          ...data,
          user_id: user.id,
        });

        setLastCreatedWorkoutId(createdWorkout.id);
        toast.success(isCopyMode ? 'Edzés sikeresen lemásolva' : 'Edzés sikeresen mentve');
        reset();
        setSections([createDefaultSection('1', 'Main Workout')]);
        setCategoryFilters({});
        setMovementPatternFilters({});
        setFmsFocusFilters({});
        setExerciseSearchQueries({});
        setCollapsedSections({});
        setIsGeneratedPlan(false);
        navigate('/workout-planner', { replace: true });
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nem sikerült menteni az edzést';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addSection = () => {
    const newSectionId = Date.now().toString();
    setSections([...sections, createDefaultSection(newSectionId)]);
    setCollapsedSections(prev => ({ ...prev, [newSectionId]: false }));
  };

  const removeSection = (sectionIndex: number) => {
    setSections(sections.filter((_, i) => i !== sectionIndex));
    const sectionId = sections[sectionIndex].id;
    setCategoryFilters(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${sectionId}-`))));
    setMovementPatternFilters(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${sectionId}-`))));
    setFmsFocusFilters(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${sectionId}-`))));
    setExerciseSearchQueries(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${sectionId}-`))));
    setCollapsedSections(prev => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  };

  const addExercise = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].exercises.push(createDefaultExercise(Date.now().toString()));
    setSections(newSections);
  };

  const removeExercise = (sectionIndex: number, exerciseIndex: number) => {
    const newSections = [...sections];
    const sectionId = newSections[sectionIndex].id;
    const exerciseId = newSections[sectionIndex].exercises[exerciseIndex].id;
    newSections[sectionIndex].exercises = newSections[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setSections(newSections);
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    setCategoryFilters(prev => {
      const next = { ...prev };
      delete next[exerciseKey];
      return next;
    });
    setMovementPatternFilters(prev => {
      const next = { ...prev };
      delete next[exerciseKey];
      return next;
    });
    setFmsFocusFilters(prev => {
      const next = { ...prev };
      delete next[exerciseKey];
      return next;
    });
    setExerciseSearchQueries(prev => {
      const next = { ...prev };
      delete next[exerciseKey];
      return next;
    });
  };

  const duplicateSection = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    const duplicatedSectionId = `${Date.now()}-${sectionIndex}`;
    const duplicatedSection: Section = {
      id: duplicatedSectionId,
      name: section.name ? `${section.name} másolat` : 'Új szekció másolat',
      exercises: section.exercises.map((exercise, exerciseIndex) => ({
        ...exercise,
        id: `${duplicatedSectionId}-${exerciseIndex + 1}`,
      })),
    };

    const newSections = [...sections];
    newSections.splice(sectionIndex + 1, 0, duplicatedSection);
    setSections(newSections);
    setCollapsedSections(prev => ({ ...prev, [duplicatedSectionId]: false }));
  };

  const duplicateExercise = (sectionIndex: number, exerciseIndex: number) => {
    const newSections = [...sections];
    const duplicatedExercise = {
      ...newSections[sectionIndex].exercises[exerciseIndex],
      id: `${Date.now()}-${exerciseIndex}`,
    };

    newSections[sectionIndex].exercises.splice(exerciseIndex + 1, 0, duplicatedExercise);
    setSections(newSections);
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const categories = Array.from(new Set(exercises.map(ex => ex.category)));
  const categoryOptions = [
    ...exerciseCategories,
    ...categories
      .filter(category => !exerciseCategories.some(option => option.id === category))
      .map(category => ({ id: category as typeof exerciseCategories[number]['id'], label: getExerciseCategoryLabel(category) })),
  ];

  // Helper function to create exercise key
  const getExerciseKey = (sectionId: string, exerciseId: string) => `${sectionId}-${exerciseId}`;

  const getFilteredExercises = (sectionId: string, exerciseId: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    const selectedCategory = categoryFilters[exerciseKey];
    const selectedMovementPattern = movementPatternFilters[exerciseKey];
    const selectedFMSFocus = fmsFocusFilters[exerciseKey];
    const searchQuery = exerciseSearchQueries[exerciseKey]?.trim().toLowerCase() || '';
    
    return exercises.filter(ex => {
      // FMS category is treated as an intelligent correction bucket because legacy DB rows may still use mobility/recovery categories.
      const matchesCategory = !selectedCategory || (selectedCategory === 'fms'
        ? isExerciseFMSCandidate(ex)
        : ex.category === selectedCategory);
      
      // Apply movement pattern filter - exact match
      const matchesMovementPattern = !selectedMovementPattern || ex.movement_pattern === selectedMovementPattern;

      const matchesFMSFocus = !selectedFMSFocus || getExerciseFMSFocuses(ex).includes(selectedFMSFocus as ReturnType<typeof getFMSFocusOptions>[number]['id']);

      const matchesSearch = !searchQuery ||
        ex.name.toLowerCase().includes(searchQuery) ||
        ex.description?.toLowerCase().includes(searchQuery) ||
        ex.instructions?.toLowerCase().includes(searchQuery);
      
      return matchesCategory && matchesMovementPattern && matchesFMSFocus && matchesSearch;
    });
  };

  const getAvailableMovementPatterns = (sectionId: string, exerciseId: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    const selectedCategory = categoryFilters[exerciseKey];
    const availablePatternIds = new Set(
      exercises
        .filter(ex => !selectedCategory || (selectedCategory === 'fms' ? isExerciseFMSCandidate(ex) : ex.category === selectedCategory))
        .map(ex => ex.movement_pattern),
    );

    return movementPatterns.filter(pattern => availablePatternIds.has(pattern.id));
  };

  const getExerciseOptionLabel = (exercise: Exercise, categoryFilter?: string) => {
    if (categoryFilter === 'fms') {
      const primaryFocus = getExerciseFMSFocuses(exercise)[0];
      const focusLabel = getFMSFocusLabel(primaryFocus);

      if (focusLabel) {
        return `${focusLabel} • ${exercise.name}`;
      }
    }

    return exercise.name;
  };

  const updateCategoryFilter = (sectionId: string, exerciseId: string, category: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    
    // Update category filter
    setCategoryFilters(prev => {
      const newCategory = category === prev[exerciseKey] ? '' : category;
      return {
        ...prev,
        [exerciseKey]: newCategory,
      };
    });
    
    // Reset movement pattern filter when category changes
    setMovementPatternFilters(prev => ({
      ...prev,
      [exerciseKey]: '', 
    }));

    setFmsFocusFilters(prev => ({
      ...prev,
      [exerciseKey]: '',
    }));
  };
  
  const updateMovementPatternFilter = (sectionId: string, exerciseId: string, movementPattern: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    
    setMovementPatternFilters(prev => ({
      ...prev,
      [exerciseKey]: movementPattern === prev[exerciseKey] ? '' : movementPattern,
    }));
  };

  const updateFMSFocusFilter = (sectionId: string, exerciseId: string, fmsFocus: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    setFmsFocusFilters(prev => ({
      ...prev,
      [exerciseKey]: fmsFocus === prev[exerciseKey] ? '' : fmsFocus,
    }));
  };

  const setMovementPatternForPlaceholder = (sectionId: string, exerciseId: string, placeholderId: string) => {
    const movementPattern = getPlaceholderExerciseMeta(placeholderId)?.movementPatternId;

    if (movementPattern) {
      const exerciseKey = getExerciseKey(sectionId, exerciseId);
      setMovementPatternFilters(prev => ({
        ...prev,
        [exerciseKey]: movementPattern,
      }));
    }
  };

  const handleGenerateWorkout = async () => {
    if (!user?.id) {
      toast.error('Az edzésterv generálásához be kell jelentkezned');
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
          exercises: section.exercises.map((exercise) => {
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
              // Only set weight if it's a valid number, otherwise undefined
              weight: (exercise.weight && !isNaN(Number(exercise.weight)) && Number(exercise.weight) > 0) 
                ? Number(exercise.weight) 
                : undefined,
              notes: exercise.instruction || undefined,
              restPeriod: (exercise.restPeriod && !isNaN(Number(exercise.restPeriod)) && Number(exercise.restPeriod) > 0)
                ? Number(exercise.restPeriod)
                : undefined,
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
      const newSections = formattedSections.map((section, index) => ({
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
      }));
      
      setSections(newSections);

      // Clear existing filters before setting new ones
      setCategoryFilters({});
      setMovementPatternFilters({});
      setFmsFocusFilters({});
      setExerciseSearchQueries({});
      
      // Set movement pattern filters for placeholders immediately after state update
      // This needs to happen after setSections completes, so we use a timeout
      setTimeout(() => {
        newSections.forEach((section) => {
          section.exercises.forEach((exercise) => {
            if (exercise.exerciseId?.startsWith('placeholder-')) {
              setMovementPatternForPlaceholder(section.id, exercise.id, exercise.exerciseId);
            }
          });
        });
      }, 200);

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
      
      toast.success('Az edzésterv sikeresen legenerálva');
      setIsGeneratedPlan(true);
    } catch (error) {
      console.error('Failed to generate workout plan:', error);
      toast.error('Nem sikerült legenerálni az edzéstervet');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGenerateForm = () => {
    setShowGenerateForm(!showGenerateForm);
  };

  const totalExerciseCount = sections.reduce((total, section) => total + section.exercises.length, 0);
  const totalSetCount = sections.reduce(
    (total, section) => total + section.exercises.reduce((sectionTotal, exercise) => sectionTotal + (exercise.sets || 0), 0),
    0,
  );

  const getSectionSummary = (section: Section) => {
    const setCount = section.exercises.reduce((total, exercise) => total + (exercise.sets || 0), 0);
    return `${section.exercises.length} gyakorlat • ${setCount} sorozat`;
  };

  const getExerciseSummary = (exercise: SectionExercise) => {
    const prescription = `${exercise.sets || '-'} × ${exercise.reps || '-'}`;
    return exercise.weight ? `${prescription} • ${exercise.weight} kg` : prescription;
  };

  return (
    <div className="container py-8">
      <WorkoutSectionHeader
        title="Edzéstervező"
        description="Új edzést állíthatsz össze, meglévőt szerkeszthetsz, vagy egy korábbi tervből gyorsan új másolatot készíthetsz."
        actions={(
          <button
            type="button"
            onClick={toggleGenerateForm}
            className="btn btn-primary flex items-center gap-2"
          >
            <Sparkles size={16} />
            Edzés generálása
          </button>
        )}
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Workout</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {watchedTitle?.trim() || 'Még nincs cím megadva'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isEditMode ? 'Szerkesztés alatt' : isCopyMode ? 'Másolat készítése' : isGeneratedPlan ? 'Generált terv' : 'Kézi terv'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Szekciók</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{sections.length}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Aktív blokk</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Gyakorlatok</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{totalExerciseCount}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Összesen {totalSetCount} sorozat</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tervezett idő</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{watchedDuration || 0} perc</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{watchedDate || 'Dátum nélkül'}</p>
        </div>
      </div>

      {/* Generate Workout Form */}
      {showGenerateForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Generált edzésterv</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Válassz programtípust és napot, majd generálj egy előre strukturált edzéstervet. A rendszer a programlogika és az elérhető FMS információk alapján tölti ki az alapblokkot.
          </p>
          
          {/* Program Type Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Programtípus
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
              Edzésnap
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
              Notes <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="General workout notes or instructions (optional)"
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
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex flex-1 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse(section.id)}
                    className="mt-2 rounded-md border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label={collapsedSections[section.id] ? 'Szekció kinyitása' : 'Szekció összecsukása'}
                  >
                    {collapsedSections[section.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
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
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{getSectionSummary(section)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => duplicateSection(sectionIndex)}
                    className="rounded-md border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    title="Szekció duplikálása"
                  >
                    <Copy size={16} />
                  </button>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(sectionIndex)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Szekció törlése"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Exercises */}
              {!collapsedSections[section.id] && (
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
                    {(() => {
                      const exerciseKey = getExerciseKey(section.id, exercise.id);
                      const selectedExercise = exercise.exerciseId && !exercise.exerciseId.startsWith('placeholder-')
                        ? exercises.find(ex => ex.id === exercise.exerciseId)
                        : null;
                      const placeholderMeta = getPlaceholderExerciseMeta(exercise.exerciseId);
                      const selectedFMSFocus = fmsFocusFilters[exerciseKey];
                      const selectedExerciseFMSFocuses = selectedExercise ? getExerciseFMSFocuses(selectedExercise) : [];
                      const activeFilterCount = [
                        categoryFilters[exerciseKey],
                        movementPatternFilters[exerciseKey],
                        fmsFocusFilters[exerciseKey],
                        exerciseSearchQueries[exerciseKey],
                      ].filter(Boolean).length;
                      const selectedMovementPatternLabel = selectedExercise
                        ? getMovementPatternLabel(selectedExercise.movement_pattern)
                        : placeholderMeta?.movementPatternLabel;

                      return (
                        <>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Exercise {exerciseIndex + 1}
                        </span>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{getExerciseSummary(exercise)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateExercise(sectionIndex, exerciseIndex)}
                          className="rounded-md border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                          title="Gyakorlat duplikálása"
                        >
                          <Copy size={14} />
                        </button>
                        {section.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExercise(sectionIndex, exerciseIndex)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Gyakorlat törlése"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Exercise Selection */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Exercise
                        </label>
                        
                        <div className="mb-3 mt-2 space-y-2">
                          {exercises.length > 0 && (
                            <>
                              <div className="relative">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  value={exerciseSearchQueries[exerciseKey] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setExerciseSearchQueries(prev => ({
                                      ...prev,
                                      [exerciseKey]: value,
                                    }));
                                  }}
                                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                  placeholder="Keresés név, leírás vagy instrukció alapján"
                                />
                              </div>
                              <details className="rounded-md border border-gray-200 bg-white/70 px-3 py-2 dark:border-gray-600 dark:bg-gray-800/60">
                                <summary className="cursor-pointer list-none text-xs font-medium text-gray-600 dark:text-gray-300">
                                  Speciális szűrők{activeFilterCount > 0 ? ` • ${activeFilterCount} aktív` : ''}
                                </summary>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                      Kategória
                                    </label>
                                    <select
                                      value={categoryFilters[exerciseKey] || ''}
                                      onChange={(e) => updateCategoryFilter(section.id, exercise.id, e.target.value)}
                                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                      <option value="">Összes kategória</option>
                                      {categoryOptions.map((category) => (
                                        <option key={category.id} value={category.id}>
                                          {category.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {categoryFilters[exerciseKey] === 'fms' && (
                                    <div className="sm:col-span-2">
                                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        FMS fókusz
                                      </label>
                                      <select
                                        value={selectedFMSFocus || ''}
                                        onChange={(e) => updateFMSFocusFilter(section.id, exercise.id, e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                      >
                                        <option value="">Mind a 7 FMS minta</option>
                                        {fmsFocusOptions.map((focus) => (
                                          <option key={focus.id} value={focus.id}>
                                            {focus.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                      Mozgásminta
                                    </label>
                                    <select
                                      value={movementPatternFilters[exerciseKey] || ''}
                                      onChange={(e) => updateMovementPatternFilter(section.id, exercise.id, e.target.value)}
                                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                      <option value="">Összes mozgásminta</option>
                                      {getAvailableMovementPatterns(section.id, exercise.id).map((pattern) => (
                                        <option key={pattern.id} value={pattern.id}>
                                          {pattern.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </details>
                            </>
                          )}
                          
                          {exercises.length === 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Szűrők betöltése...</span>
                            </div>
                          )}
                        </div>
                        
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
                          <option value="">Válassz gyakorlatot</option>
                          {getFilteredExercises(section.id, exercise.id).map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {getExerciseOptionLabel(ex, categoryFilters[exerciseKey])}
                            </option>
                          ))}
                        </select>
                        
                        {/* Show filter info */}
                        {exercises.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {getFilteredExercises(section.id, exercise.id).length} / {exercises.length} gyakorlat látható
                            {(categoryFilters[getExerciseKey(section.id, exercise.id)] || movementPatternFilters[getExerciseKey(section.id, exercise.id)] || fmsFocusFilters[getExerciseKey(section.id, exercise.id)] || exerciseSearchQueries[getExerciseKey(section.id, exercise.id)]) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const exerciseKey = getExerciseKey(section.id, exercise.id);
                                  setCategoryFilters(prev => ({ ...prev, [exerciseKey]: '' }));
                                  setMovementPatternFilters(prev => ({ ...prev, [exerciseKey]: '' }));
                                  setFmsFocusFilters(prev => ({ ...prev, [exerciseKey]: '' }));
                                  setExerciseSearchQueries(prev => ({ ...prev, [exerciseKey]: '' }));
                                }}
                                className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                Összes szűrő törlése
                              </button>
                            )}
                          </div>
                        )}
                        
                        {selectedExercise && (
                          <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{selectedExercise.name}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                              <span className="rounded-full bg-white/80 px-2 py-1 dark:bg-emerald-900/60">{getExerciseCategoryLabel(selectedExercise.category)}</span>
                              {selectedMovementPatternLabel && (
                                <span className="rounded-full bg-white/80 px-2 py-1 dark:bg-emerald-900/60">{selectedMovementPatternLabel}</span>
                              )}
                              {selectedExerciseFMSFocuses.map((focusId) => (
                                <span key={focusId} className="rounded-full bg-white/80 px-2 py-1 dark:bg-emerald-900/60">
                                  FMS: {getFMSFocusLabel(focusId)}
                                </span>
                              ))}
                              <span className="rounded-full bg-white/80 px-2 py-1 dark:bg-emerald-900/60">Nehézség: {getDifficultyLabel(selectedExercise.difficulty)}</span>
                            </div>
                            {selectedExercise.description && (
                              <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">{selectedExercise.description}</p>
                            )}
                          </div>
                        )}

                        {placeholderMeta && (
                          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                              Generált helykitöltő: {placeholderMeta.title}
                            </p>
                            <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                              {placeholderMeta.description}
                            </p>
                            {placeholderMeta.movementPatternLabel && (
                              <p className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-100">
                                Ajánlott mozgásminta: {placeholderMeta.movementPatternLabel}
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
                          placeholder="3"
                          value={exercise.sets || ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const newSections = [...sections];
                            const value = e.target.value;
                            newSections[sectionIndex].exercises[exerciseIndex].sets = value === '' ? undefined : Number(value) || 1;
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
                          placeholder="8"
                          value={exercise.reps || ''}
                          onFocus={(e) => e.target.select()}
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
                          Weight (kg) <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.weight`, { 
                            setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                          })}
                          type="number"
                          step="0.5"
                          min="0"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Leave empty if bodyweight exercise"
                          value={exercise.weight || ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const newSections = [...sections];
                            const value = e.target.value;
                            newSections[sectionIndex].exercises[exerciseIndex].weight = value === '' ? undefined : Number(value) || undefined;
                            setSections(newSections);
                          }}
                        />
                      </div>

                      {/* Rest Period */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Rest (seconds) <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.restPeriod`, { 
                            setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                          })}
                          type="number"
                          min="0"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="e.g. 60 (default if empty)"
                          value={exercise.restPeriod || ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const newSections = [...sections];
                            const value = e.target.value;
                            newSections[sectionIndex].exercises[exerciseIndex].restPeriod = value === '' ? undefined : Number(value) || undefined;
                            setSections(newSections);
                          }}
                        />
                      </div>

                      {/* Notes */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Notes <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.notes`)}
                          type="text"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Additional exercise notes or instructions"
                          value={exercise.notes || ''}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sectionIndex].exercises[exerciseIndex].notes = e.target.value;
                            setSections(newSections);
                          }}
                        />
                      </div>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-4 z-10 flex justify-end gap-4 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RotateCw size={16} className="animate-spin" />
                Mentés...
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditMode ? 'Módosítások mentése' : isCopyMode ? 'Másolat mentése' : 'Edzés mentése'}
              </>
            )}
          </button>
          
          {lastCreatedWorkoutId && (
            <button
              type="button"
              onClick={() => setShowSharingDialog(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Share2 size={16} />
              Edzés megosztása
            </button>
          )}
        </div>
      </form>
      
      {/* Workout Sharing Dialog */}
      <WorkoutSharingDialog
        workoutId={lastCreatedWorkoutId || ''}
        isOpen={showSharingDialog}
        onClose={() => setShowSharingDialog(false)}
        onSuccess={() => {
          toast.success('Edzés sikeresen megosztva!');
          setShowSharingDialog(false);
        }}
      />
    </div>
  );
};

export default WorkoutPlanner;
