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
  Calendar,
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
import EnhancedGoalForm from './EnhancedGoalForm';const GoalsManagement: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [goalProgress, setGoalProgress] = useState<Record<string, GoalProgress>>({});
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'fitness' as GoalCategory,
    type: 'daily' as GoalType,
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
      alert('Nem sikerült betölteni a célokat');
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
      await createGoal(goalData);
      await loadGoals();
      await loadStats();
      setIsCreateDialogOpen(false);
      alert('Cél sikeresen létrehozva');
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Nem sikerült létrehozni a célt');
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

      alert(`"${template.title}" cél létrehozva`);
    } catch (error) {
      console.error('Error creating goal from template:', error);
      alert('Nem sikerült létrehozni a célt a sablonból');
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

      alert('Cél teljesítés rögzítve');
    } catch (error) {
      console.error('Error completing goal:', error);
      alert('Nem sikerült rögzíteni a teljesítést');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a célt?')) {
      return;
    }

    try {
      await deleteGoal(goalId);
      await loadGoals();
      await loadStats();
      alert('Cél sikeresen törölve');
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Nem sikerült törölni a célt');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      type: goal.type,
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
      await updateGoal(editingGoal.id, formData);
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
        target_value: 1,
        target_unit: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });

      alert('Cél sikeresen frissítve');
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Nem sikerült frissíteni a célt');
    }
  };

  const getTypeColor = (type: GoalType): string => {
    switch (type) {
      case 'daily': return 'bg-blue-500 text-white';
      case 'weekly': return 'bg-green-500 text-white';
      case 'monthly': return 'bg-yellow-500 text-white';
      case 'quarterly': return 'bg-orange-500 text-white';
      case 'yearly': return 'bg-purple-500 text-white';
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Fejléc és gombok */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Célok kezelése</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsTemplateDialogOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white text-gray-700 transition-colors"
          >
            <Star className="h-4 w-4" />
            Sablonból
          </button>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Új cél
          </button>
        </div>
      </div>

      {/* Statisztikák */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGoals}</p>
                <p className="text-sm text-gray-600">Összes cél</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeGoals}</p>
                <p className="text-sm text-gray-600">Aktív</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedGoals}</p>
                <p className="text-sm text-gray-600">Befejezett</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCompletions}</p>
                <p className="text-sm text-gray-600">Mai teljesítés</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{Math.round(stats.weeklyCompletionRate)}%</p>
                <p className="text-sm text-gray-600">Heti ráta</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.longestStreak}</p>
                <p className="text-sm text-gray-600">Leghosszabb sorozat</p>
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
            <div key={goal.id} className="bg-white rounded-lg border shadow-sm p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${getTypeColor(goal.type)}`}>
                    {getTypeLabel(goal.type)}
                  </span>
                  <span className="px-2 py-1 text-xs border rounded bg-gray-50 text-gray-700">
                    {getCategoryLabel(goal.category)}
                  </span>
                </div>
              </div>
              
              {/* Progress információk */}
              {progress && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Teljesítés</span>
                    <span>{Math.round(progress.completionRate)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, progress.completionRate)}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      <span>{progress.streak} nap</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{progress.daysRemaining} nap hátra</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className={progress.isOnTrack ? 'text-green-600' : 'text-red-600'}>
                        {progress.isOnTrack ? 'Jó ütemben' : 'Lemaradás'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cél részletek és műveletek */}
              <div className="flex flex-col gap-3">
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">Cél: {goal.target_value || 0} {goal.target_unit}</p>
                  <p>
                    {new Date(goal.start_date).toLocaleDateString()} - 
                    {new Date(goal.end_date).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {goal.status === 'active' && (
                    <button 
                      onClick={() => handleCompleteGoal(goal.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Teljesítve
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleEditGoal(goal)}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Szerkesztés
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
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
        <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900">Még nincsenek célok</h3>
          <p className="text-gray-600 mb-4">
            Kezdj el célokat kitűzni magadnak a fejlődésed érdekében!
          </p>
          <button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Leírás</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Részletek a célról..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg h-20 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Kategória</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as GoalCategory }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Egység</label>
                  <input
                    type="text"
                    value={formData.target_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_unit: e.target.value }))}
                    placeholder="pl. lépés, liter, perc"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Záró dátum</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingGoal(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Mégse
                </button>
                <button 
                  onClick={handleUpdateGoal} 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Frissítés
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsManagement;
