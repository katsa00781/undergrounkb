import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Sparkles, RotateCw, Share2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Exercise, getExercises } from '../lib/exercises';
import { createWorkout, updateWorkout, Workout } from '../lib/workouts';
import { mapGeneratedWorkoutToPlannerSections } from '../lib/workoutPlannerGeneration';
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
import {
  createDefaultExercise,
  createDefaultSection,
  normalizeHungarianText,
  PlannerMode,
  Section,
  workoutSchema,
  WorkoutFormData,
} from '../lib/workoutPlannerHelpers';
import { useSectionExerciseFilters } from '../hooks/useSectionExerciseFilters';
import WorkoutSharingDialog from '../components/WorkoutSharingDialog';
import KettlebellComplexBuilder from '../components/workouts/KettlebellComplexBuilder';
import CardioSectionBuilder from '../components/workouts/CardioSectionBuilder';
import { PeriodizedGeneratorPanel, PwronGeneratorPanel, TemplateGeneratorPanel } from '../components/workouts/WorkoutGeneratorPanels';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
import ParticipantSelector from '../components/workouts/ParticipantSelector';
import WorkoutSummaryCards from '../components/workouts/WorkoutSummaryCards';
import WorkoutSectionsEditor from '../components/workouts/WorkoutSectionsEditor';
import toast from 'react-hot-toast';

// A típusok és tiszta segédfüggvények a ../lib/workoutPlannerHelpers modulban élnek,
// hogy a szekció-builder komponensek körkörös import nélkül használhassák őket.
export type { Section, SectionExercise, PlannerMode } from '../lib/workoutPlannerHelpers';

interface WorkoutPlannerProps {
  forcedGeneratorMode?: PlannerMode;
}

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
  const [showComplexBuilder, setShowComplexBuilder] = useState(false);
  const [showCardioBuilder, setShowCardioBuilder] = useState(false);
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

  const filters = useSectionExerciseFilters(exercises);

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

      const isFakeId = (id?: string) =>
        !id || id.startsWith('placeholder-') || id.startsWith('fms-correction-');

      // Use sections state (not form data) to preserve cardio and complex extra fields
      const cleanedSections = sections
        .map((section) => ({
          ...section,
          exercises: section.exercises
            .filter((exercise) => !isFakeId(exercise.exerciseId))
            .map(({ exerciseName: _en, name: _n, ...rest }) => rest),
        }))
        .filter((section) => section.exercises.length > 0);

      if (cleanedSections.length === 0) {
        throw new Error('Az edzéstervhez legalább egy valódi gyakorlatot ki kell választani');
      }

      const workoutPayload = {
        title: data.title,
        date: data.date,
        duration: data.duration,
        notes: data.notes,
        user_id: user.id,
        sections: cleanedSections as import('../lib/workouts').WorkoutSection[],
      };

      if (isEditMode && editWorkout) {
        const updatedWorkout = await updateWorkout(editWorkout.id, workoutPayload);

        setLastCreatedWorkoutId(updatedWorkout.id);
        toast.success('Edzésterv sikeresen frissítve');
        navigate('/log');
      } else {
        const createdWorkout = await createWorkout(workoutPayload);

        setLastCreatedWorkoutId(createdWorkout.id);
        toast.success(
          isCopyMode
            ? 'Edzés sikeresen lemásolva'
            : 'Edzés sikeresen mentve'
        );
        reset();
        setSections([createDefaultSection('1', 'Fő blokk')]);
        filters.resetAllFilters();
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

  const handleAddComplex = (section: Section) => {
    setSections((prev) => [...prev, section]);
    setCollapsedSections((prev) => ({ ...prev, [section.id]: false }));
    setShowComplexBuilder(false);
  };

  const handleAddCardio = (section: Section) => {
    setSections((prev) => [...prev, section]);
    setCollapsedSections((prev) => ({ ...prev, [section.id]: false }));
    setShowCardioBuilder(false);
  };

  const removeSection = (sectionIndex: number) => {
    const sectionId = sections[sectionIndex].id;
    setSections(sections.filter((_, i) => i !== sectionIndex));
    filters.clearFiltersForSection(sectionId);
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
    filters.clearFiltersForExercise(filters.getExerciseKey(sectionId, exerciseId));
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
      filters.resetAllFilters();

      // Set movement pattern filters for placeholders immediately after state update
      // This needs to happen after setSections completes, so we use a timeout
      setTimeout(() => {
        uiSections.forEach((section) => {
          section.exercises.forEach((exercise) => {
            if (exercise.exerciseId?.startsWith('placeholder-')) {
              filters.setMovementPatternForPlaceholder(section.id, exercise.id, exercise.exerciseId);
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
  const statusLabel = isEditMode ? 'Szerkesztés alatt' : isCopyMode ? 'Másolat készítése' : isGeneratedPlan ? 'Generált terv' : 'Kézi terv';

  const selectedGuests = guestUsers.filter((guestUser) => selectedParticipantIds.includes(guestUser.id));
  const selectedFmsGuestName = selectedGuests.find((guestUser) => guestUser.id === selectedFmsUserId)?.name || 'kiválasztott vendég';
  const selectedFmsGuestHasLink = Boolean(selectedGuests.find((guestUser) => guestUser.id === selectedFmsUserId)?.linkedFmsUserId);
  const generatorFmsMessage = selectedFmsUserId
    ? selectedFmsGuestHasLink
      ? `Az FMS-alapú generálás a kiválasztott vendéghez igazodik: ${selectedFmsGuestName}.`
      : `A kiválasztott vendéghez még nincs FMS eredmény hozzárendelve: ${selectedFmsGuestName}.`
    : 'Ha személyre szabott FMS-alapú tervet szeretnél, előbb válassz ki legalább egy résztvevőt. Az FMS-kötés a manuális vendéglistához fog tartozni.';

  const handleProgramTypeChange = (programType: ProgramType) => {
    setSelectedProgramType(programType);
    if (programType === '2napos' && selectedWorkoutDay > 2) {
      setSelectedWorkoutDay(1);
    }
    if (programType === '3napos' && selectedWorkoutDay === 4) {
      setSelectedWorkoutDay(1);
    }
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

      <WorkoutSummaryCards
        workoutTitle={watchedTitle}
        statusLabel={statusLabel}
        sectionsCount={sections.length}
        totalExerciseCount={totalExerciseCount}
        totalSetCount={totalSetCount}
        duration={watchedDuration}
        date={watchedDate}
      />

      <ParticipantSelector
        guestUsers={guestUsers}
        fmsSubjects={fmsSubjects}
        isLoadingGuests={isLoadingGuests}
        isLoadingFmsSubjects={isLoadingFmsSubjects}
        selectedParticipantIds={selectedParticipantIds}
        selectedFmsUserId={selectedFmsUserId}
        newGuestName={newGuestName}
        participantSearchQuery={participantSearchQuery}
        isEditMode={isEditMode}
        onNewGuestNameChange={setNewGuestName}
        onAddGuest={handleAddGuest}
        onParticipantSearchChange={setParticipantSearchQuery}
        onToggleParticipant={toggleParticipant}
        onRemoveGuest={handleRemoveGuest}
        onGuestFmsLinkChange={handleGuestFmsLinkChange}
        onSelectedFmsUserChange={setSelectedFmsUserId}
      />

      {/* Generate Workout Form */}
      {showGenerateForm && (
        <div ref={generateFormRef}>
          {selectedPlannerMode === 'template' ? (
            <TemplateGeneratorPanel
              fmsMessage={generatorFmsMessage}
              selectedProgramType={selectedProgramType}
              selectedWorkoutDay={selectedWorkoutDay}
              onProgramTypeChange={handleProgramTypeChange}
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
              fmsMessage={generatorFmsMessage}
              selectedProgramType={selectedProgramType}
              selectedWorkoutDay={selectedWorkoutDay}
              selectedCycleWeek={selectedCycleWeek}
              selectedTrainingFocus={selectedTrainingFocus}
              onProgramTypeChange={handleProgramTypeChange}
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

      <form onSubmit={handleSubmit(onSubmit, (errors) => { console.error('Form validation errors:', errors); toast.error('Töltsd ki a kötelező mezőket (cím, dátum, időtartam)'); })} className="space-y-8">
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
        <WorkoutSectionsEditor
          sections={sections}
          setSections={setSections}
          exercises={exercises}
          register={register}
          errors={errors}
          collapsedSections={collapsedSections}
          filters={filters}
          onToggleCollapse={toggleSectionCollapse}
          onAddSection={addSection}
          onOpenComplexBuilder={() => setShowComplexBuilder(true)}
          onOpenCardioBuilder={() => setShowCardioBuilder(true)}
          onRemoveSection={removeSection}
          onDuplicateSection={duplicateSection}
          onAddExercise={addExercise}
          onRemoveExercise={removeExercise}
          onDuplicateExercise={duplicateExercise}
        />

        {/* Submit Button */}
        <div className="flex flex-col-reverse gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 sm:w-auto"
            >
              <Share2 size={16} />
              Edzés megosztása
            </button>
          )}
        </div>
      </form>

      {/* Kettlebell Complex Builder */}
      {showComplexBuilder && (
        <KettlebellComplexBuilder
          exercises={exercises}
          onAdd={handleAddComplex}
          onClose={() => setShowComplexBuilder(false)}
        />
      )}

      {/* Cardio Section Builder */}
      {showCardioBuilder && (
        <CardioSectionBuilder
          onAdd={handleAddCardio}
          onClose={() => setShowCardioBuilder(false)}
        />
      )}

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
