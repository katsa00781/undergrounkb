import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronRight, Copy, Plus, Save, Search, Trash2, Sparkles, RotateCw, Share2, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Exercise, getExercises } from '../lib/exercises';
import { createWorkout, updateWorkout, Workout } from '../lib/workouts';
import { mapGeneratedWorkoutToPlannerSections } from '../lib/workoutPlannerGeneration';
import { filterExercisesList, getAvailableMovementPatternOptions, getExerciseCategories, getExerciseCategoryLabel, getExerciseFMSFocuses, getExerciseTaxonomyDimensionOptions, getFMSFocusLabel, getFMSFocusOptions, getMovementPatternLabel, getMovementPatterns } from '../lib/exerciseService';
import { listFMSAssessmentSubjects, FMSAssessmentSubject } from '../lib/fms';
import { CycleWeek, WorkoutDay, generateWorkoutPlanV2, ProgramType, TrainingFocus } from '../lib/workoutGenerator.fixed';
import {
  generatePwronWorkoutPlan,
  getPwronWeeklySetPatternOptions,
  PwronPrescriptionMode,
  PwronProgramType,
  PwronSessionVariant,
  PwronWeekNumber,
} from '../lib/pwronWorkoutGenerator';
import { createManualGuest, deleteManualGuest, listManualGuests, ManualGuest, updateManualGuest } from '../lib/manualGuests';
import WorkoutSharingDialog from '../components/WorkoutSharingDialog';
import { PeriodizedGeneratorPanel, PwronGeneratorPanel, TemplateGeneratorPanel } from '../components/workouts/WorkoutGeneratorPanels';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
import toast from 'react-hot-toast';

const workoutSchema = z.object({
  title: z.string().min(1, 'A cím megadása kötelező'),
  date: z.string().min(1, 'A dátum megadása kötelező'),
  duration: z.number().min(1, 'Az időtartam legalább 1 perc legyen'),
  notes: z.string().optional(),
  sections: z.array(z.object({
    name: z.string().min(1, 'A szekció neve kötelező'),
    exercises: z.array(z.object({
      exerciseId: z.string(), // Allow empty exercises (placeholders)
      exerciseName: z.string().optional(), // For storing placeholder exercise names
      sets: z.number().min(1, 'Legalább 1 sorozat szükséges'),
      reps: z.union([
        z.number().min(1, 'Legalább 1 ismétlés szükséges'),
        z.string().min(1, 'Add meg az ismétlésszámot')
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

export type PlannerMode = 'template' | 'periodized' | 'pwron';

interface WorkoutPlannerProps {
  forcedGeneratorMode?: PlannerMode;
}

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

  if (placeholderId.includes('core')) {
    return {
      title: 'Core vagy stabilizáló gyakorlat',
      description: 'Keress egy törzsstabilitást vagy kontrollt fejlesztő gyakorlatot ehhez a blokkhoz.',
      movementPatternId: 'core_other',
      movementPatternLabel: 'Core – egyéb',
    };
  }

  if (placeholderId.includes('gait')) {
    return {
      title: 'Gait vagy cipelés gyakorlat',
      description: 'Keress egy gait, cipelés vagy járásmintát fejlesztő gyakorlatot.',
      movementPatternId: 'gait_stability',
      movementPatternLabel: 'Gait – törzs stabilitás',
    };
  }

  if (placeholderId.includes('stretch')) {
    return {
      title: 'Horpaszizom nyújtás',
      description: 'Keress egy csípőhajlító vagy horpaszizom nyújtó gyakorlatot a blokk elejére.',
      movementPatternId: 'mobilization',
      movementPatternLabel: 'Mobilizálás',
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

  if (placeholderId.includes('pwron-power-swing')) {
    return {
      title: 'Pwron power swing gyakorlat',
      description: 'Keress swing vagy robbanékony csípődomináns gyakorlatot a Power blokkhoz.',
      categoryId: 'kettlebell',
      categoryLabel: 'Kettlebell',
      movementPatternId: 'hip_dominant_bilateral',
      movementPatternLabel: 'Csípő domináns – bilaterális',
    };
  }

  if (placeholderId.includes('pwron-power-jump')) {
    return {
      title: 'Pwron power ugrás gyakorlat',
      description: 'Keress robbanékony ugrás variációt a Power blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'knee_dominant_bilateral',
      movementPatternLabel: 'Térd domináns – bilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-horizontal-push')) {
    return {
      title: 'Pwron horizontális nyomás gyakorlat',
      description: 'Keress egy horizontális nyomó gyakorlatot a Pwron fő blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'horizontal_push_unilateral',
      movementPatternLabel: 'Horizontális nyomás – unilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-horizontal-pull')) {
    return {
      title: 'Pwron horizontális húzás gyakorlat',
      description: 'Keress egy horizontális húzó gyakorlatot a Pwron fő blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'horizontal_pull_unilateral',
      movementPatternLabel: 'Horizontális húzás – unilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-vertical-push')) {
    return {
      title: 'Pwron vertikális nyomás gyakorlat',
      description: 'Keress egy vertikális nyomó gyakorlatot a Pwron fő blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'vertical_push_unilateral',
      movementPatternLabel: 'Vertikális nyomás – unilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-vertical-pull')) {
    return {
      title: 'Pwron vertikális húzás gyakorlat',
      description: 'Keress egy vertikális húzó gyakorlatot a Pwron fő blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'vertical_pull_bilateral',
      movementPatternLabel: 'Vertikális húzás – bilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-knee')) {
    return {
      title: 'Pwron térd domináns gyakorlat',
      description: 'Keress egy térd domináns fő gyakorlatot a Pwron blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'knee_dominant_bilateral',
      movementPatternLabel: 'Térd domináns – bilaterális',
    };
  }

  if (placeholderId.includes('pwron-main-hip')) {
    return {
      title: 'Pwron csípő domináns gyakorlat',
      description: 'Keress egy csípő domináns fő gyakorlatot a Pwron blokkhoz.',
      categoryId: 'strength_training',
      categoryLabel: 'Erőedzés',
      movementPatternId: 'hip_dominant_unilateral',
      movementPatternLabel: 'Csípő domináns – unilaterális',
    };
  }

  if (placeholderId.includes('pwron-metcon-rope') || placeholderId.includes('pwron-metcon-swing')) {
    return {
      title: 'Pwron metcon gyakorlat',
      description: 'Keress egy kondicionáló gyakorlatot a Pwron metabolikus blokkhoz.',
      categoryId: placeholderId.includes('rope') ? 'cardio' : 'kettlebell',
      categoryLabel: placeholderId.includes('rope') ? 'Kardió' : 'Kettlebell',
      movementPatternId: undefined,
      movementPatternLabel: undefined,
    };
  }

  if (placeholderId.includes('pwron-pfe') || placeholderId.includes('pwron-smr') || placeholderId.includes('pwron-integration') || placeholderId.includes('pwron-recovery') || placeholderId.includes('pwron-skill-swing')) {
    return {
      title: 'Pwron szabad mezős blokk',
      description: 'A Program lap alapján szabadon kitölthető blokk, amelyhez választhatsz gyakorlatot a könyvtárból.',
      categoryId: placeholderId.includes('skill-swing') ? 'kettlebell' : placeholderId.includes('smr') ? 'smr' : placeholderId.includes('recovery') ? 'recovery' : placeholderId.includes('integration') ? 'mobility_flexibility' : 'fms',
      categoryLabel: placeholderId.includes('skill-swing') ? 'Kettlebell' : placeholderId.includes('smr') ? 'SMR' : placeholderId.includes('recovery') ? 'Regeneráció' : placeholderId.includes('integration') ? 'Mobilitás/Nyújtás' : 'FMS',
      movementPatternId: placeholderId.includes('skill-swing') ? 'hip_dominant_bilateral' : placeholderId.includes('integration') ? 'mobilization' : undefined,
      movementPatternLabel: placeholderId.includes('skill-swing') ? 'Csípő domináns – bilaterális' : placeholderId.includes('integration') ? 'Mobilizálás' : undefined,
    };
  }

  return {
    title: 'Generált helykitöltő gyakorlat',
    description: 'Válassz egy valós gyakorlatot a blokk céljának megfelelően.',
    movementPatternId: undefined,
    movementPatternLabel: undefined,
  };
};

const WorkoutPlanner = ({ forcedGeneratorMode }: WorkoutPlannerProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const generateFormRef = useRef<HTMLDivElement | null>(null);
  
  const editWorkout = location.state?.editWorkout as Workout | undefined;
  const copyWorkout = location.state?.copyWorkout as Workout | undefined;
  const sourceWorkout = editWorkout ?? copyWorkout;
  const isEditMode = !!editWorkout;
  const isCopyMode = !editWorkout && !!copyWorkout;
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sections, setSections] = useState<Section[]>([createDefaultSection('1', 'Fő blokk')]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // Change filters to be per exercise instead of per section
  const [categoryFilters, setCategoryFilters] = useState<{ [exerciseKey: string]: string }>({});
  const [movementPatternFilters, setMovementPatternFilters] = useState<{ [exerciseKey: string]: string }>({});
  const [patternFamilyFilters, setPatternFamilyFilters] = useState<{ [exerciseKey: string]: string }>({});
  const [lateralityFilters, setLateralityFilters] = useState<{ [exerciseKey: string]: string }>({});
  const [fmsFocusFilters, setFmsFocusFilters] = useState<{ [exerciseKey: string]: string }>({});
  const [exerciseSearchQueries, setExerciseSearchQueries] = useState<{ [exerciseKey: string]: string }>({});
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDay>(1);
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramType>('4napos');
  const [selectedCycleWeek, setSelectedCycleWeek] = useState<CycleWeek>(1);
  const [selectedTrainingFocus, setSelectedTrainingFocus] = useState<TrainingFocus>('ero');
  const [selectedPwronProgramType, setSelectedPwronProgramType] = useState<PwronProgramType>('ERO');
  const [selectedPwronWeek, setSelectedPwronWeek] = useState<PwronWeekNumber>(1);
  const [selectedPwronVariant, setSelectedPwronVariant] = useState<PwronSessionVariant>('A');
  const [selectedPwronPrescriptionMode, setSelectedPwronPrescriptionMode] = useState<PwronPrescriptionMode>('auto');
  const [selectedPwronPowerSetPattern, setSelectedPwronPowerSetPattern] = useState('');
  const [selectedPwronMainSetPattern, setSelectedPwronMainSetPattern] = useState('');
  const [pwronAthleteName, setPwronAthleteName] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  const [lastCreatedWorkoutId, setLastCreatedWorkoutId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isGeneratedPlan, setIsGeneratedPlan] = useState(false);
  const [guestUsers, setGuestUsers] = useState<ManualGuest[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const [fmsSubjects, setFmsSubjects] = useState<FMSAssessmentSubject[]>([]);
  const [isLoadingFmsSubjects, setIsLoadingFmsSubjects] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [selectedFmsUserId, setSelectedFmsUserId] = useState('');

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
        name: 'Fő blokk',
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
  const generatorRouteMode: PlannerMode | null = forcedGeneratorMode
    ?? (location.pathname.endsWith('/template-generator')
    ? 'template'
    : location.pathname.endsWith('/periodized-generator')
      ? 'periodized'
      : location.pathname.endsWith('/pwron-generator')
        ? 'pwron'
      : null);
  const isGenerateRoute = Boolean(generatorRouteMode);
  const selectedPlannerMode: PlannerMode = generatorRouteMode ?? 'template';
  const movementPatterns = getMovementPatterns();
  const exerciseCategories = getExerciseCategories();
  const fmsFocusOptions = getFMSFocusOptions();

  const isExerciseFMSCandidate = (exercise: Exercise) => exercise.category === 'fms' || getExerciseFMSFocuses(exercise).length > 0;

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    loadGuestUsers();
    loadFmsSubjects();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || fmsSubjects.length === 0 || guestUsers.length === 0) {
      return;
    }

    const syncAutoLinks = async () => {
      let hasChanges = false;

      for (const guestUser of guestUsers) {
        if (guestUser.linkedFmsUserId) {
          continue;
        }

        const matchedSubjectId = findAutoLinkedFmsSubjectId(guestUser.name);
        if (!matchedSubjectId) {
          continue;
        }

        await updateManualGuest(user.id, guestUser.id, { linkedFmsUserId: matchedSubjectId });
        hasChanges = true;
      }

      if (hasChanges) {
        setGuestUsers(await listManualGuests(user.id));
      }
    };

    void syncAutoLinks();
  }, [guestUsers, fmsSubjects, user?.id]);

  useEffect(() => {
    if (!selectedParticipantIds.length) {
      setSelectedFmsUserId('');
      return;
    }

    setSelectedFmsUserId((current) => (current && selectedParticipantIds.includes(current) ? current : selectedParticipantIds[0]));
  }, [selectedParticipantIds]);

  useEffect(() => {
    const patternOptions = getPwronWeeklySetPatternOptions(selectedPwronProgramType, selectedPwronWeek);

    if (selectedPwronPrescriptionMode !== 'manual') {
      return;
    }

    setSelectedPwronPowerSetPattern((current) => (
      patternOptions.power.includes(current) ? current : (patternOptions.power[0] || '')
    ));
    setSelectedPwronMainSetPattern((current) => (
      patternOptions.main.includes(current) ? current : (patternOptions.main[0] || '')
    ));
  }, [selectedPwronProgramType, selectedPwronWeek, selectedPwronPrescriptionMode]);

  useEffect(() => {
    if (!isGenerateRoute) {
      setShowGenerateForm(false);
      return;
    }

    setShowGenerateForm(true);

    window.requestAnimationFrame(() => {
      generateFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [isGenerateRoute]);

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

  const loadGuestUsers = async () => {
    if (!user?.id) {
      setGuestUsers([]);
      return;
    }

    try {
      setIsLoadingGuests(true);
      setGuestUsers(await listManualGuests(user.id));
    } catch (error) {
      console.error('Failed to load manual guests:', error);
      toast.error('Nem sikerült betölteni a vendéglistát');
    } finally {
      setIsLoadingGuests(false);
    }
  };

  const loadFmsSubjects = async () => {
    try {
      setIsLoadingFmsSubjects(true);
      setFmsSubjects(await listFMSAssessmentSubjects());
    } catch (error) {
      console.error('Failed to load FMS subjects:', error);
      toast.error('Nem sikerült betölteni az FMS alanyokat');
    } finally {
      setIsLoadingFmsSubjects(false);
    }
  };

  const normalizeHungarianText = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('hu')
    .replace(/\s+/g, ' ')
    .trim();

  const findAutoLinkedFmsSubjectId = (guestName: string) => {
    const normalizedGuestName = normalizeHungarianText(guestName);
    const exactMatch = fmsSubjects.find((subject) => normalizeHungarianText(subject.displayName) === normalizedGuestName);
    return exactMatch?.userId || null;
  };

  const handleAddGuest = async () => {
    if (!user?.id) {
      toast.error('A vendéglista kezeléséhez be kell jelentkezned');
      return;
    }

    try {
      const createdGuest = await createManualGuest(user.id, newGuestName);
      const autoLinkedFmsUserId = findAutoLinkedFmsSubjectId(createdGuest.name);
      if (autoLinkedFmsUserId) {
        await updateManualGuest(user.id, createdGuest.id, { linkedFmsUserId: autoLinkedFmsUserId });
      }

      const updatedGuests = await listManualGuests(user.id);
      setGuestUsers(updatedGuests);
      setNewGuestName('');
      setSelectedParticipantIds((prev) => (prev.includes(createdGuest.id) ? prev : [...prev, createdGuest.id]));
      setSelectedFmsUserId(createdGuest.id);
      toast.success(autoLinkedFmsUserId ? 'Vendég hozzáadva, FMS méréshez kapcsolva' : 'Vendég hozzáadva a listához');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nem sikerült hozzáadni a vendéget');
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    if (!user?.id) {
      toast.error('A vendéglista kezeléséhez be kell jelentkezned');
      return;
    }

    try {
      await deleteManualGuest(user.id, guestId);
      const updatedGuests = await listManualGuests(user.id);
      setGuestUsers(updatedGuests);
      setSelectedParticipantIds((prev) => prev.filter((id) => id !== guestId));
      setSelectedFmsUserId((current) => (current === guestId ? '' : current));
      toast.success('Vendég törölve a listából');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nem sikerült törölni a vendéget');
    }
  };

  const handleGuestFmsLinkChange = async (guestId: string, linkedFmsUserId: string) => {
    if (!user?.id) {
      toast.error('A vendéglista kezeléséhez be kell jelentkezned');
      return;
    }

    try {
      await updateManualGuest(user.id, guestId, {
        linkedFmsUserId: linkedFmsUserId || null,
      });
      setGuestUsers(await listManualGuests(user.id));
      toast.success(linkedFmsUserId ? 'FMS kapcsolat elmentve' : 'FMS kapcsolat eltávolítva');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nem sikerült menteni az FMS kapcsolatot');
    }
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipantIds((prev) => (
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    ));
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

        const unresolvedPlaceholder = section.exercises.find((exercise) => exercise.exerciseId?.startsWith('placeholder-'));
        if (unresolvedPlaceholder) {
          throw new Error(`A(z) "${section.name}" blokkban még nincs kiválasztva valódi gyakorlat: ${unresolvedPlaceholder.name || 'helykitöltő tétel'}`);
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
        toast.success(
          isCopyMode
            ? 'Edzés sikeresen lemásolva'
            : 'Edzés sikeresen mentve'
        );
        reset();
        setSections([createDefaultSection('1', 'Fő blokk')]);
        setCategoryFilters({});
        setMovementPatternFilters({});
        setPatternFamilyFilters({});
        setLateralityFilters({});
        setFmsFocusFilters({});
        setExerciseSearchQueries({});
        setCollapsedSections({});
        setIsGeneratedPlan(false);
        setSelectedParticipantIds([]);
        setSelectedFmsUserId('');
        setParticipantSearchQuery('');
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
    setPatternFamilyFilters(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${sectionId}-`))));
    setLateralityFilters(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${sectionId}-`))));
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
    setPatternFamilyFilters(prev => {
      const next = { ...prev };
      delete next[exerciseKey];
      return next;
    });
    setLateralityFilters(prev => {
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
  const patternFamilyOptions = getExerciseTaxonomyDimensionOptions(exercises, 'pattern_family');
  const lateralityOptions = getExerciseTaxonomyDimensionOptions(exercises, 'laterality');

  // Helper function to create exercise key
  const getExerciseKey = (sectionId: string, exerciseId: string) => `${sectionId}-${exerciseId}`;

  const getFilteredExercises = (sectionId: string, exerciseId: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    return filterExercisesList(exercises, {
      searchQuery: exerciseSearchQueries[exerciseKey] || '',
      selectedCategory: categoryFilters[exerciseKey] || null,
      selectedMovementPattern: movementPatternFilters[exerciseKey] || null,
      selectedPatternFamily: patternFamilyFilters[exerciseKey] || null,
      selectedLaterality: lateralityFilters[exerciseKey] || null,
      selectedFMSFocus: fmsFocusFilters[exerciseKey] || null,
      selectedDifficulty: null,
      showInactive: true,
    }, {
      isFmsCandidate: isExerciseFMSCandidate,
    });
  };

  const getAvailableMovementPatterns = (sectionId: string, exerciseId: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);
    return getAvailableMovementPatternOptions(exercises, {
      searchQuery: exerciseSearchQueries[exerciseKey] || '',
      selectedCategory: categoryFilters[exerciseKey] || null,
      selectedPatternFamily: patternFamilyFilters[exerciseKey] || null,
      selectedLaterality: lateralityFilters[exerciseKey] || null,
      selectedFMSFocus: fmsFocusFilters[exerciseKey] || null,
    }, {
      isFmsCandidate: isExerciseFMSCandidate,
    });
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

  const updatePatternFamilyFilter = (sectionId: string, exerciseId: string, patternFamily: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    setPatternFamilyFilters(prev => ({
      ...prev,
      [exerciseKey]: patternFamily === prev[exerciseKey] ? '' : patternFamily,
    }));
  };

  const updateLateralityFilter = (sectionId: string, exerciseId: string, laterality: string) => {
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    setLateralityFilters(prev => ({
      ...prev,
      [exerciseKey]: laterality === prev[exerciseKey] ? '' : laterality,
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
    const placeholderMeta = getPlaceholderExerciseMeta(placeholderId);
    const movementPattern = placeholderMeta?.movementPatternId;
    const category = placeholderMeta?.categoryId;
    const exerciseKey = getExerciseKey(sectionId, exerciseId);

    if (category) {
      setCategoryFilters(prev => ({
        ...prev,
        [exerciseKey]: category,
      }));
    }

    if (movementPattern) {
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
      const selectedFmsGuest = guestUsers.find((guestUser) => guestUser.id === selectedFmsUserId);
      const fmsTargetUserId = selectedFmsGuest?.linkedFmsUserId || user.id;
      const shouldAdjustForFms = Boolean(selectedFmsGuest?.linkedFmsUserId);
      
      const generatedWorkout = selectedPlannerMode === 'pwron'
        ? await generatePwronWorkoutPlan({
            userId: user.id,
            programType: selectedPwronProgramType,
            weekNumber: selectedPwronWeek,
            sessionVariant: selectedPwronVariant,
            athleteName: pwronAthleteName.trim() || undefined,
            prescriptionMode: selectedPwronPrescriptionMode,
            powerSetPattern: selectedPwronPrescriptionMode === 'manual' ? selectedPwronPowerSetPattern : undefined,
            mainSetPattern: selectedPwronPrescriptionMode === 'manual' ? selectedPwronMainSetPattern : undefined,
          })
        : await generateWorkoutPlanV2({
            userId: fmsTargetUserId,
            programType: selectedProgramType,
            day: selectedWorkoutDay,
            cycleWeek: selectedCycleWeek,
            trainingFocus: selectedTrainingFocus,
            usePeriodizationPresets: selectedPlannerMode === 'periodized',
            includeWeights: true,
            adjustForFMS: shouldAdjustForFms,
          });
      
      const { formattedSections, uiSections } = mapGeneratedWorkoutToPlannerSections(generatedWorkout, exercises);

      // Reset form with generated data
      reset({
        title: generatedWorkout.title,
        date: generatedWorkout.date,
        duration: generatedWorkout.duration,
        notes: generatedWorkout.notes || '',
        sections: formattedSections
      });
      
      setSections(uiSections);

      // Clear existing filters before setting new ones
      setCategoryFilters({});
      setMovementPatternFilters({});
      setPatternFamilyFilters({});
      setLateralityFilters({});
      setFmsFocusFilters({});
      setExerciseSearchQueries({});
      
      // Set movement pattern filters for placeholders immediately after state update
      // This needs to happen after setSections completes, so we use a timeout
      setTimeout(() => {
        uiSections.forEach((section) => {
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
      if (isGenerateRoute && !forcedGeneratorMode) {
        navigate('/workout-planner', { replace: true, state: location.state });
      }
    } catch (error) {
      console.error('Failed to generate workout plan:', error);
      toast.error('Nem sikerült legenerálni az edzéstervet');
    } finally {
      setIsGenerating(false);
    }
  };

  const closeGenerateForm = () => {
    setShowGenerateForm(false);
    if (isGenerateRoute && !forcedGeneratorMode) {
      navigate('/workout-planner', { replace: true, state: location.state });
    }
  };

  const openGenerator = (mode: PlannerMode) => {
    const routeSuffix = mode === 'template'
      ? 'template-generator'
      : mode === 'periodized'
        ? 'periodized-generator'
        : 'pwron-generator';

    navigate(`/workout-planner/${routeSuffix}`, {
      state: location.state,
    });
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

  const filteredGuestUsers = guestUsers.filter((guestUser) => {
    const haystack = guestUser.name.toLowerCase();
    return haystack.includes(participantSearchQuery.trim().toLowerCase());
  });

  const selectedGuests = guestUsers.filter((guestUser) => selectedParticipantIds.includes(guestUser.id));
  const getFmsSubject = (linkedFmsUserId?: string | null) => {
    if (!linkedFmsUserId) {
      return null;
    }

    return fmsSubjects.find((item) => item.userId === linkedFmsUserId) || null;
  };

  const getFmsSubjectLabel = (linkedFmsUserId?: string | null) => {
    if (!linkedFmsUserId) {
      return 'FMS kapcsolat még nincs hozzárendelve';
    }

    const subject = getFmsSubject(linkedFmsUserId);
    if (!subject) {
      return 'Kapcsolt FMS alany nem található';
    }

    const scoreLabel = subject.latestTotalScore ? ` • összpontszám: ${subject.latestTotalScore}` : '';
    const dateLabel = subject.latestAssessmentDate ? ` • mérés: ${subject.latestAssessmentDate}` : '';
    return `${subject.displayName}${dateLabel}${scoreLabel}`;
  };

  return (
    <div className="container py-8">
      <WorkoutSectionHeader
        title="Edzéstervező"
        description="Új edzést állíthatsz össze, meglévőt szerkeszthetsz, vagy egy korábbi tervből gyorsan új másolatot készíthetsz."
        actions={(
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openGenerator('template')}
              className="btn btn-outline flex items-center gap-2"
            >
              <Sparkles size={16} />
              Sablon generátor
            </button>
            <button
              type="button"
              onClick={() => openGenerator('periodized')}
              className="btn btn-primary flex items-center gap-2"
            >
              <Sparkles size={16} />
              Ciklus generátor
            </button>
          </div>
        )}
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Edzés</p>
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

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Users size={18} />
              <h2 className="text-lg font-semibold">Résztvevők kiválasztása</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              A résztvevőket most külön, kézzel karbantartott vendéglistából választod ki. Ez a lista független az auth felhasználóktól, így nem keveredik más appok profiljaival.
            </p>
            {isEditMode && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Meglévő edzés szerkesztésekor a résztvevők kijelölése továbbra is csak a generálási célbeállításokat befolyásolja.
              </p>
            )}
          </div>

          <div className="w-full lg:max-w-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">FMS-alapú generálás célvendége</label>
            <select
              value={selectedFmsUserId}
              onChange={(e) => setSelectedFmsUserId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              disabled={selectedParticipantIds.length === 0}
            >
              <option value="">{selectedParticipantIds.length === 0 ? 'Előbb válassz résztvevőt' : 'Válassz résztvevőt'}</option>
              {selectedGuests.map((guestUser) => (
                <option key={guestUser.id} value={guestUser.id}>
                  {guestUser.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              A generátor a vendéghez rendelt adatbázisos FMS felmérést használja. A kapcsolat név alapján automatikusan javasolható, de kézzel is kiválasztható.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGuest();
                  }
                }}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Új vendég neve"
              />
              <button
                type="button"
                onClick={handleAddGuest}
                className="btn btn-primary whitespace-nowrap"
              >
                Vendég hozzáadása
              </button>
            </div>

            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={participantSearchQuery}
                onChange={(e) => setParticipantSearchQuery(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Keresés név alapján"
              />
            </div>

            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
              {filteredGuestUsers.map((guestUser) => {
                const isSelected = selectedParticipantIds.includes(guestUser.id);
                const linkedFmsSubject = getFmsSubject(guestUser.linkedFmsUserId);

                return (
                  <div
                    key={guestUser.id}
                    className={`rounded-lg border px-3 py-3 transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleParticipant(guestUser.id)}
                        className="flex min-w-0 flex-1 items-center justify-between text-left"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{guestUser.name || 'Névtelen vendég'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getFmsSubjectLabel(guestUser.linkedFmsUserId)}
                          </p>
                        </div>
                        <div className={`h-5 w-5 rounded border-2 ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'}`}></div>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveGuest(guestUser.id)}
                          className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                          aria-label={`${guestUser.name} törlése`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Kapcsolt FMS felmérés</label>
                      <select
                        value={guestUser.linkedFmsUserId || ''}
                        onChange={(e) => handleGuestFmsLinkChange(guestUser.id, e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="">Nincs hozzárendelve</option>
                        {fmsSubjects.map((subject) => (
                          <option key={subject.userId} value={subject.userId}>
                            {subject.displayName}{subject.latestAssessmentDate ? ` • ${subject.latestAssessmentDate}` : ''}{subject.latestTotalScore ? ` • ${subject.latestTotalScore} pont` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {linkedFmsSubject && (
                      <div className="mt-3 grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100 md:grid-cols-2">
                        <p>Kapcsolt alany: {linkedFmsSubject.displayName}</p>
                        <p>Utolsó mérés: {linkedFmsSubject.latestAssessmentDate || 'nincs dátum'}</p>
                        <p>Összpontszám: {linkedFmsSubject.latestTotalScore ?? 'n/a'}</p>
                        <p>Adatbázis azonosító: {linkedFmsSubject.userId.slice(0, 8)}...</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isLoadingGuests && filteredGuestUsers.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  {guestUsers.length === 0 ? 'Még nincs manuálisan felvett vendég a listában.' : 'Nincs találat a vendéglistában.'}
                </div>
              )}

              {isLoadingGuests && (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Vendéglista betöltése...
                </div>
              )}

              {!isLoadingGuests && !isLoadingFmsSubjects && fmsSubjects.length === 0 && guestUsers.length > 0 && (
                <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  Nem találtam adatbázisban FMS felméréssel rendelkező alanyt, ezért a vendégekhez még nem rendelhető mérés.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Kiválasztott vendégek ({selectedParticipantIds.length})
            </h3>
            <div className="mt-3 space-y-2">
              {selectedGuests.map((guestUser) => (
                <div key={guestUser.id} className="rounded-md bg-white px-3 py-2 text-sm shadow-sm dark:bg-gray-800">
                  <p className="font-medium text-gray-900 dark:text-white">{guestUser.name || 'Névtelen vendég'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getFmsSubjectLabel(guestUser.linkedFmsUserId)}
                  </p>
                </div>
              ))}

              {selectedGuests.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Még nincs kiválasztott résztvevő.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Workout Form */}
      {showGenerateForm && (
        <div ref={generateFormRef}>
          {selectedPlannerMode === 'template' ? (
            <TemplateGeneratorPanel
              fmsMessage={selectedFmsUserId
                ? selectedGuests.find((guestUser) => guestUser.id === selectedFmsUserId)?.linkedFmsUserId
                  ? `Az FMS-alapú generálás a kiválasztott vendéghez igazodik: ${selectedGuests.find((guestUser) => guestUser.id === selectedFmsUserId)?.name || 'kiválasztott vendég'}.`
                  : `A kiválasztott vendéghez még nincs FMS eredmény hozzárendelve: ${selectedGuests.find((guestUser) => guestUser.id === selectedFmsUserId)?.name || 'kiválasztott vendég'}.`
                : 'Ha személyre szabott FMS-alapú tervet szeretnél, előbb válassz ki legalább egy résztvevőt. Az FMS-kötés a manuális vendéglistához fog tartozni.'}
              selectedProgramType={selectedProgramType}
              selectedWorkoutDay={selectedWorkoutDay}
              onProgramTypeChange={(programType) => {
                setSelectedProgramType(programType);
                if (programType === '2napos' && selectedWorkoutDay > 2) {
                  setSelectedWorkoutDay(1);
                }
                if (programType === '3napos' && selectedWorkoutDay === 4) {
                  setSelectedWorkoutDay(1);
                }
              }}
              onWorkoutDayChange={setSelectedWorkoutDay}
              onSwitchToPeriodized={() => openGenerator('periodized')}
              onClose={closeGenerateForm}
              onGenerate={handleGenerateWorkout}
              isGenerating={isGenerating}
            />
          ) : (
            selectedPlannerMode === 'pwron' ? (
              <PwronGeneratorPanel
                message="A Pwron generátor külön rendszerként működik: a Program lap napi sablonját tölti fel a kiválasztott program és hét periodizációs paramétereivel. Jelenleg nem a 2/3/4 napos logikát használja."
                selectedProgramType={selectedPwronProgramType}
                selectedWeek={selectedPwronWeek}
                selectedVariant={selectedPwronVariant}
                selectedPrescriptionMode={selectedPwronPrescriptionMode}
                selectedPowerSetPattern={selectedPwronPowerSetPattern}
                selectedMainSetPattern={selectedPwronMainSetPattern}
                athleteName={pwronAthleteName}
                onProgramTypeChange={setSelectedPwronProgramType}
                onWeekChange={setSelectedPwronWeek}
                onVariantChange={setSelectedPwronVariant}
                onPrescriptionModeChange={(mode) => {
                  setSelectedPwronPrescriptionMode(mode);

                  if (mode === 'manual') {
                    const patternOptions = getPwronWeeklySetPatternOptions(selectedPwronProgramType, selectedPwronWeek);
                    setSelectedPwronPowerSetPattern((current) => current || patternOptions.power[0] || '');
                    setSelectedPwronMainSetPattern((current) => current || patternOptions.main[0] || '');
                  }
                }}
                onPowerSetPatternChange={setSelectedPwronPowerSetPattern}
                onMainSetPatternChange={setSelectedPwronMainSetPattern}
                onAthleteNameChange={setPwronAthleteName}
                onSwitchToTemplate={() => openGenerator('template')}
                onClose={closeGenerateForm}
                onGenerate={handleGenerateWorkout}
                isGenerating={isGenerating}
              />
            ) : (
            <PeriodizedGeneratorPanel
              fmsMessage={selectedFmsUserId
                ? selectedGuests.find((guestUser) => guestUser.id === selectedFmsUserId)?.linkedFmsUserId
                  ? `Az FMS-alapú generálás a kiválasztott vendéghez igazodik: ${selectedGuests.find((guestUser) => guestUser.id === selectedFmsUserId)?.name || 'kiválasztott vendég'}.`
                  : `A kiválasztott vendéghez még nincs FMS eredmény hozzárendelve: ${selectedGuests.find((guestUser) => guestUser.id === selectedFmsUserId)?.name || 'kiválasztott vendég'}.`
                : 'Ha személyre szabott FMS-alapú tervet szeretnél, előbb válassz ki legalább egy résztvevőt. Az FMS-kötés a manuális vendéglistához fog tartozni.'}
              selectedProgramType={selectedProgramType}
              selectedWorkoutDay={selectedWorkoutDay}
              selectedCycleWeek={selectedCycleWeek}
              selectedTrainingFocus={selectedTrainingFocus}
              onProgramTypeChange={(programType) => {
                setSelectedProgramType(programType);
                if (programType === '2napos' && selectedWorkoutDay > 2) {
                  setSelectedWorkoutDay(1);
                }
                if (programType === '3napos' && selectedWorkoutDay === 4) {
                  setSelectedWorkoutDay(1);
                }
              }}
              onWorkoutDayChange={setSelectedWorkoutDay}
              onCycleWeekChange={setSelectedCycleWeek}
              onTrainingFocusChange={setSelectedTrainingFocus}
              onSwitchToTemplate={() => openGenerator('template')}
              onClose={closeGenerateForm}
              onGenerate={handleGenerateWorkout}
              isGenerating={isGenerating}
            />
            )
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Workout Info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Edzés címe
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Add meg az edzés címét"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dátum
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
                Időtartam (perc)
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
              Megjegyzés <span className="text-gray-400 text-xs">(opcionális)</span>
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Általános megjegyzések vagy instrukciók az edzéshez"
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
              Szekció hozzáadása
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
                    placeholder="Szekció neve, pl. Bemelegítés, fő blokk, levezetés"
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
                    Gyakorlat hozzáadása
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
                        patternFamilyFilters[exerciseKey],
                        lateralityFilters[exerciseKey],
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
                          Gyakorlat {exerciseIndex + 1}
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Exercise Selection */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <div className="rounded-xl border border-gray-200 bg-white/80 p-3 shadow-sm dark:border-gray-600 dark:bg-gray-800/50 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                        <div className="mb-3 flex items-center justify-between sm:hidden">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Gyakorlatválasztó</p>
                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                              {selectedExercise?.name || placeholderMeta?.title || 'Válassz gyakorlatot'}
                            </p>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {getFilteredExercises(section.id, exercise.id).length} találat
                          </span>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Gyakorlat
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
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                      Mozgáscsalád
                                    </label>
                                    <select
                                      value={patternFamilyFilters[exerciseKey] || ''}
                                      onChange={(e) => updatePatternFamilyFilter(section.id, exercise.id, e.target.value)}
                                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                      <option value="">Összes család</option>
                                      {patternFamilyOptions.map((patternFamily) => (
                                        <option key={patternFamily.value} value={patternFamily.value}>
                                          {patternFamily.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                      Oldaliság
                                    </label>
                                    <select
                                      value={lateralityFilters[exerciseKey] || ''}
                                      onChange={(e) => updateLateralityFilter(section.id, exercise.id, e.target.value)}
                                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                      <option value="">Összes forma</option>
                                      {lateralityOptions.map((laterality) => (
                                        <option key={laterality.value} value={laterality.value}>
                                          {laterality.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {categoryFilters[exerciseKey] === 'fms' && (
                                    <div className="sm:col-span-2 lg:col-span-3">
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
                            {(categoryFilters[getExerciseKey(section.id, exercise.id)] || movementPatternFilters[getExerciseKey(section.id, exercise.id)] || patternFamilyFilters[getExerciseKey(section.id, exercise.id)] || lateralityFilters[getExerciseKey(section.id, exercise.id)] || fmsFocusFilters[getExerciseKey(section.id, exercise.id)] || exerciseSearchQueries[getExerciseKey(section.id, exercise.id)]) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const exerciseKey = getExerciseKey(section.id, exercise.id);
                                  setCategoryFilters(prev => ({ ...prev, [exerciseKey]: '' }));
                                  setMovementPatternFilters(prev => ({ ...prev, [exerciseKey]: '' }));
                                  setPatternFamilyFilters(prev => ({ ...prev, [exerciseKey]: '' }));
                                  setLateralityFilters(prev => ({ ...prev, [exerciseKey]: '' }));
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
                            {placeholderMeta.categoryLabel && (
                              <p className="mt-1 text-xs font-medium text-amber-900 dark:text-amber-100">
                                Ajánlott kategória: {placeholderMeta.categoryLabel}
                              </p>
                            )}
                          </div>
                        )}
                        </div>
                      </div>

                      {/* Sets */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sorozat
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
                          Ismétlés
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
                          Súly (kg) <span className="text-gray-400 text-xs">(opcionális)</span>
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.weight`, { 
                            setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                          })}
                          type="number"
                          step="0.5"
                          min="0"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Testsúlyos gyakorlatnál hagyd üresen"
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
                          Pihenő (mp) <span className="text-gray-400 text-xs">(opcionális)</span>
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.restPeriod`, { 
                            setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                          })}
                          type="number"
                          min="0"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="pl. 60, üresen hagyva alapérték marad"
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
                          Megjegyzés <span className="text-gray-400 text-xs">(opcionális)</span>
                        </label>
                        <input
                          {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.notes`)}
                          type="text"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Kiegészítő megjegyzés vagy instrukció"
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
