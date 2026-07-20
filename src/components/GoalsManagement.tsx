import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Target, 
  Star, 
  X, 
  CheckCircle2, 
  Clock, 
  Trophy,
  TrendingUp,
  Flame,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  getGoals, 
  getGoalStats, 
  createGoal, 
  createGoalFromTemplate,
  completeGoal,
  updateGoal,
  deleteGoal,
  getGoalProgress,
  Goal, 
  GoalStats, 
  GoalProgress,
  GoalType, 
  GoalCategory,
  CreateGoalData,
  GOAL_TEMPLATES
} from '../lib/goals';
import toast from 'react-hot-toast';
import EnhancedGoalForm from './EnhancedGoalForm';
import GoalProgressScale from './GoalProgressScale';
import ConfirmDialog from './ui/ConfirmDialog';

const GoalsManagement: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [goalProgress, setGoalProgress] = useState<Record<string, GoalProgress>>({});
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [editingCurrentValue, setEditingCurrentValue] = useState<string | null>(null);
  const [tempCurrentValue, setTempCurrentValue] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'fitness' as GoalCategory,
    type: 'daily' as GoalType,
    starting_value: undefined as number | undefined,
    current_value: 0,
    target_value: 1,
    target_unit: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    loadGoals();
    loadStats();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await getGoals();
      console.log('Loaded all goals:', data);
      setGoals(data);
      
      // Progress adatok betöltése minden célhoz
      const progressData: Record<string, GoalProgress> = {};
      for (const goal of data) {
        try {
          progressData[goal.id] = await getGoalProgress(goal.id);
        } catch (error) {
          console.error(`Error loading progress for goal ${goal.id}:`, error);
        }
      }
      setGoalProgress(progressData);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast.error('Nem sikerült betölteni a célokat');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getGoalStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateGoal = async (goalData: CreateGoalData) => {
    try {
      console.log('===== GOALS MANAGEMENT: Creating new goal =====');
      console.log('Form data:', goalData);
      
      await createGoal(goalData);
      
      console.log('===== Reloading goals after creation =====');
      await loadGoals();
      await loadStats();
      setIsCreateDialogOpen(false);
      toast.success('Cél sikeresen létrehozva');
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Nem sikerült létrehozni a célt');
    }
  };

  const handleCreateFromTemplate = async () => {
    try {
      const template = GOAL_TEMPLATES.find((t) => t.title === selectedTemplate);
      if (!template) return;

      await createGoalFromTemplate(template);
      await loadGoals();
      await loadStats();
      setIsTemplateDialogOpen(false);
      setSelectedTemplate('');

      toast.success(`"${template.title}" cél létrehozva`);
    } catch (error) {
      console.error('Error creating goal from template:', error);
      toast.error('Nem sikerült létrehozni a célt a sablonból');
    }
  };

  const handleCompleteGoal = async (goalId: string, value?: number) => {
    try {
      await completeGoal({
        goal_id: goalId,
        value: value || 1
      });

      await loadGoals();
      await loadStats();

      toast.success('Cél teljesítés rögzítve');
    } catch (error) {
      console.error('Error completing goal:', error);
      toast.error('Nem sikerült rögzíteni a teljesítést');
    }
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      await deleteGoal(goalToDelete.id);
      await loadGoals();
      await loadStats();
      toast.success('Cél sikeresen törölve');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Nem sikerült törölni a célt');
    } finally {
      setGoalToDelete(null);
    }
  };

  const handleUpdateCurrentValue = async (goalId: string, newValue: number) => {
    try {
      console.log('Updating current_value:', goalId, newValue);
      const updated = await updateGoal(goalId, { current_value: newValue });
      console.log('Updated goal:', updated);
      await loadGoals();
      setEditingCurrentValue(null);
    } catch (error) {
      console.error('Error updating current value:', error);
      toast.error('Nem sikerült frissíteni az aktuális értéket: ' + (error as Error).message);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      type: goal.type,
      starting_value: goal.starting_value,
      current_value: goal.current_value || 0,
      target_value: goal.target_value || 1,
      target_unit: goal.target_unit || '',
      start_date: goal.start_date,
      end_date: goal.end_date
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;

    try {
      console.log('===== GOALS MANAGEMENT: Updating goal =====');
      console.log('Goal ID:', editingGoal.id);
      console.log('Updates:', formData);
      
      await updateGoal(editingGoal.id, formData);
      
      console.log('===== Reloading after update =====');
      await loadGoals();
      await loadStats();
      setIsEditDialogOpen(false);
      setEditingGoal(null);
      
      // Form reset
      setFormData({
        title: '',
        description: '',
        category: 'fitness',
        type: 'daily',
        starting_value: undefined,
        current_value: 0,
        target_value: 1,
        target_unit: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });

      toast.success('Cél sikeresen frissítve');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Nem sikerült frissíteni a célt');
    }
  };

  const getTypeColor = (type: GoalType): string => {
    switch (type) {
      case 'daily': return 'bg-primary-500 text-white dark:text-gray-900';
      case 'weekly': return 'bg-success-500 text-white dark:text-gray-900';
      case 'monthly': return 'bg-warning-500 text-white dark:text-gray-900';
      case 'quarterly': return 'bg-secondary-500 text-white dark:text-gray-900';
      case 'yearly': return 'bg-accent-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeLabel = (type: GoalType): string => {
    switch (type) {
      case 'daily': return 'Napi';
      case 'weekly': return 'Heti';
      case 'monthly': return 'Havi';
      case 'quarterly': return 'Negyedéves';
      case 'yearly': return 'Éves';
      default: return type;
    }
  };

  const getCategoryLabel = (category: GoalCategory): string => {
    switch (category) {
      case 'fitness': return 'Fitness';
      case 'nutrition': return 'Táplálkozás';
      case 'health': return 'Egészség';
      case 'lifestyle': return 'Életmód';
      case 'personal': return 'Személyes';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fejléc és gombok */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Célok kezelése</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsTemplateDialogOpen(true)}
            className="btn btn-outline gap-2"
          >
            <Star className="h-4 w-4" />
            Sablonból
          </button>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="btn btn-primary gap-2"
          >
            <Plus className="h-4 w-4" />
            Új cél
          </button>
        </div>
      </div>

      {/* Statisztikák */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary-500 dark:text-primary-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalGoals}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Összes cél</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning-500 dark:text-warning-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeGoals}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aktív</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-500 dark:text-success-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedGoals}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Befejezett</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent-500 dark:text-accent-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayCompletions}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mai teljesítés</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.weeklyCompletionRate)}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Heti ráta</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-error-500 dark:text-error-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.longestStreak}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leghosszabb sorozat</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Célok listája */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const progress = goalProgress[goal.id];
          
          return (
            <div key={goal.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${getTypeColor(goal.type)}`}>
                    {getTypeLabel(goal.type)}
                  </span>
                  <span className="px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {getCategoryLabel(goal.category)}
                  </span>
                </div>
              </div>
              
              {/* Progress információk */}
              {progress && (
                <div className="mb-4 space-y-3">
                  <GoalProgressScale
                    startingValue={goal.starting_value}
                    currentValue={goal.current_value}
                    targetValue={goal.target_value || 0}
                    unit={goal.target_unit}
                    startDate={goal.start_date}
                    endDate={goal.end_date}
                    isIncreasing={goal.category === 'fitness' || goal.type === 'daily'}
                  />
                  
                  {/* Aktuális érték módosítása - mindig látható input */}
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Aktuális érték frissítése
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editingCurrentValue === goal.id ? tempCurrentValue : goal.current_value}
                        onChange={(e) => {
                          setEditingCurrentValue(goal.id);
                          setTempCurrentValue(parseFloat(e.target.value) || 0);
                        }}
                        onFocus={(e) => {
                          e.target.select();
                          setEditingCurrentValue(goal.id);
                          setTempCurrentValue(goal.current_value);
                        }}
                        onBlur={() => {
                          if (editingCurrentValue === goal.id) {
                            handleUpdateCurrentValue(goal.id, tempCurrentValue);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCurrentValue(goal.id, tempCurrentValue);
                          } else if (e.key === 'Escape') {
                            setEditingCurrentValue(null);
                            setTempCurrentValue(goal.current_value);
                          }
                        }}
                        className="flex-1 p-2 border border-primary-300 dark:border-primary-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-fit">
                        {goal.target_unit || ''}
                      </span>
                      {editingCurrentValue === goal.id && (
                        <button
                          onClick={() => handleUpdateCurrentValue(goal.id, tempCurrentValue)}
                          className="px-3 py-2 bg-success-600 text-white dark:text-gray-900 text-sm rounded hover:bg-success-700 transition-colors"
                        >
                          Mentés
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter = mentés, Escape = mégse, vagy kattints ki az input mezőből
                    </p>
                  </div>
                </div>
              )}

              {/* Cél részletek és műveletek */}
              <div className="flex flex-col gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">Cél: {goal.target_value || 0} {goal.target_unit}</p>
                  <p>
                    {new Date(goal.start_date).toLocaleDateString()} -
                    {new Date(goal.end_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {goal.status === 'active' && goal.type === 'daily' && (
                    <button
                      onClick={() => handleCompleteGoal(goal.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-success-600 text-white dark:text-gray-900 text-sm rounded hover:bg-success-700 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mai napi cél teljesítve
                    </button>
                  )}

                  {goal.status === 'active' && goal.type !== 'daily' && (
                    <button
                      onClick={() => handleCompleteGoal(goal.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-success-600 text-white dark:text-gray-900 text-sm rounded hover:bg-success-700 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Cél teljesítve
                    </button>
                  )}

                  <button
                    onClick={() => handleEditGoal(goal)}
                    className="flex items-center gap-1 px-3 py-2 bg-primary-600 text-white dark:text-gray-900 text-sm rounded hover:bg-primary-700 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Szerkesztés
                  </button>

                  <button
                    onClick={() => setGoalToDelete(goal)}
                    className="flex items-center gap-1 px-3 py-2 bg-error-600 text-white text-sm rounded hover:bg-error-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Törlés
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Target className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Még nincsenek célok</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Kezdj el célokat kitűzni magadnak a fejlődésed érdekében!
          </p>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="btn btn-primary gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Első cél létrehozása
          </button>
        </div>
      )}

      {/* Sablon kiválasztási dialog */}
      {isTemplateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cél létrehozása sablonból</h3>
              <button
                onClick={() => setIsTemplateDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Válassz egy előre definiált célt a listából</p>

            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="input mb-4"
            >
              <option value="">Válassz sablont...</option>
              {GOAL_TEMPLATES.map((template) => (
                <option key={template.title} value={template.title}>
                  {template.title} ({getTypeLabel(template.type)})
                </option>
              ))}
            </select>

            {selectedTemplate && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {GOAL_TEMPLATES.find((t) => t.title === selectedTemplate)?.description}
                </p>
              </div>
            )}

            <button
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplate}
              className="btn btn-primary w-full disabled:bg-gray-300"
            >
              Cél létrehozása
            </button>
          </div>
        </div>
      )}

      {/* Új cél létrehozási dialog - EnhancedGoalForm */}
      {isCreateDialogOpen && (
        <EnhancedGoalForm
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSubmit={handleCreateGoal}
        />
      )}

      {/* Cél szerkesztési dialog */}
      {isEditDialogOpen && editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cél szerkesztése</h3>
              <button 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingGoal(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Módosítsd a cél adatait</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Cél neve</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="pl. Napi 10,000 lépés"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Leírás</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Részletek a célról..."
                  className="input h-20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Kategória</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as GoalCategory }))}
                    className="input"
                  >
                    <option value="fitness">Fitness</option>
                    <option value="nutrition">Táplálkozás</option>
                    <option value="health">Egészség</option>
                    <option value="lifestyle">Életmód</option>
                    <option value="personal">Személyes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Típus</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as GoalType }))}
                    className="input"
                  >
                    <option value="daily">Napi</option>
                    <option value="weekly">Heti</option>
                    <option value="monthly">Havi</option>
                    <option value="quarterly">Negyedéves</option>
                    <option value="yearly">Éves</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Célérték</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.target_value || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        target_value: value === '' ? 0 : parseInt(value) || 1 
                      }));
                    }}
                    placeholder="Célérték"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Egység</label>
                  <input
                    type="text"
                    value={formData.target_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_unit: e.target.value }))}
                    placeholder="pl. lépés, liter, perc"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Kezdő dátum</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Záró dátum</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingGoal(null);
                  }}
                  className="btn btn-outline flex-1"
                >
                  Mégse
                </button>
                <button
                  onClick={handleUpdateGoal}
                  className="btn btn-primary flex-1"
                >
                  Frissítés
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Törlés megerősítése */}
      <ConfirmDialog
        isOpen={goalToDelete !== null}
        title="Cél törlése"
        message={`Biztosan törölni szeretnéd a(z) "${goalToDelete?.title}" célt?`}
        confirmLabel="Törlés"
        cancelLabel="Mégse"
        onConfirm={confirmDeleteGoal}
        onCancel={() => setGoalToDelete(null)}
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default GoalsManagement;
