import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Plus,
  ChevronRight,
  Award,
  Flame,
  BarChart3
} from 'lucide-react';
import { 
  getGoals, 
  getGoalProgress, 
  completeGoal,
  Goal, 
  GoalProgress
} from '../lib/goals';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const GoalsDashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalProgress, setGoalProgress] = useState<Record<string, GoalProgress>>({});
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [currentMonth] = useState(new Date());
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await getGoals('active');
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
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (goalId: string, value: number = 1) => {
    try {
      setMarkingComplete(goalId);
      await completeGoal({
        goal_id: goalId,
        completion_date: new Date().toISOString().split('T')[0],
        value_achieved: value
      });
      
      // Frissítjük a progress adatokat
      const updatedProgress = await getGoalProgress(goalId);
      setGoalProgress(prev => ({
        ...prev,
        [goalId]: updatedProgress
      }));
    } catch (error) {
      console.error('Error marking goal complete:', error);
      alert('Nem sikerült a cél teljesítését rögzíteni');
    } finally {
      setMarkingComplete(null);
    }
  };

  // Ellenőrzi, hogy egy heti/havi cél ma már teljesítve lett-e
  const isTodayCompletedForPeriodic = (goalId: string) => {
    const progress = goalProgress[goalId];
    if (!progress) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return progress.completions.some(c => c.completion_date === today);
  };

  // Számítja a helyes progress százalékot a cél típusa alapján
  const getCorrectProgressRate = (goal: Goal) => {
    const progress = goalProgress[goal.id];
    if (!progress) return 0;

    if (goal.type === 'daily') {
      // Napi céloknál a teljes időtartamhoz viszonyítjuk
      return progress.completionRate;
    } else if (goal.type === 'weekly' || goal.type === 'monthly') {
      // Heti/havi céloknál az aktuális periódushoz viszonyítjuk
      const periodProgress = getCurrentPeriodProgress(goal);
      return Math.min(100, (periodProgress.current / periodProgress.target) * 100);
    } else {
      // Egyéb típusoknál az eredeti logika
      return progress.completionRate;
    }
  };

  // Számítja a heti/havi célok aktuális teljesítését
  const getCurrentPeriodProgress = (goal: Goal) => {
    const progress = goalProgress[goal.id];
    if (!progress) return { current: 0, target: goal.target_value || 1 };
    
    const now = new Date();
    let periodStart: Date;
    
    if (goal.type === 'weekly') {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday start
      periodStart = new Date(now.setDate(diff));
      periodStart.setHours(0, 0, 0, 0);
    } else if (goal.type === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      return { current: 0, target: goal.target_value || 1 };
    }
    
    const periodStartStr = periodStart.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    const currentPeriodCompletions = progress.completions.filter(c => 
      c.completion_date >= periodStartStr && c.completion_date <= todayStr
    );
    
    const current = currentPeriodCompletions.reduce((sum, c) => sum + (c.value_achieved || 1), 0);
    
    return { current, target: goal.target_value || 1 };
  };

  const getGoalTypeLabel = (type: string) => {
    const labels = {
      daily: 'Napi',
      weekly: 'Heti',
      monthly: 'Havi',
      quarterly: 'Negyedéves',
      yearly: 'Éves'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getGoalCategoryIcon = (category: string) => {
    const icons = {
      fitness: <Target className="h-4 w-4" />,
      health: <Flame className="h-4 w-4" />,
      nutrition: <Award className="h-4 w-4" />,
      lifestyle: <Clock className="h-4 w-4" />,
      personal: <TrendingUp className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || <Target className="h-4 w-4" />;
  };

  const getProgressColor = (completionRate: number) => {
    if (completionRate >= 80) return 'bg-green-500';
    if (completionRate >= 60) return 'bg-yellow-500';
    if (completionRate >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const isTodayCompleted = (goalId: string) => {
    const progress = goalProgress[goalId];
    if (!progress) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return progress.completions.some(c => c.completion_date === today);
  };

  const getWeeklyCalendar = (goal: Goal) => {
    const progress = goalProgress[goal.id];
    if (!progress) return [];

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday start
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }

    return weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const completions = progress.completions.filter(c => c.completion_date === dayStr);
      const isToday_ = isToday(day);
      
      return {
        date: day,
        dateStr: dayStr,
        completions: completions.length,
        isToday: isToday_
      };
    });
  };

  const getMonthlyCalendar = (goal: Goal) => {
    const progress = goalProgress[goal.id];
    if (!progress) return [];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isCompleted = progress.completions.some(c => c.completion_date === dayStr);
      const isToday_ = isToday(day);
      
      return {
        date: day,
        dateStr: dayStr,
        isCompleted,
        isToday: isToday_
      };
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-500" />
              Aktív céljaim
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kövesse nyomon céljait és jelölje be teljesítéseit
            </p>
          </div>
          <Link
            to="/goals"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Új cél
          </Link>
        </div>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nincs aktív célod
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Hozz létre célokat a fejlődésed nyomon követéséhez
          </p>
          <Link
            to="/goals"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Első cél létrehozása
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = goalProgress[goal.id];
            const todayCompleted = isTodayCompleted(goal.id);
            
            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                      {getGoalCategoryIcon(goal.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getGoalTypeLabel(goal.type)} cél
                      </p>
                      {goal.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Teljesítési gombok */}
                  {goal.type === 'daily' ? (
                    <button
                      onClick={() => handleMarkComplete(goal.id)}
                      disabled={todayCompleted || markingComplete === goal.id}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        todayCompleted
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-not-allowed'
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {markingComplete === goal.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : todayCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {todayCompleted ? 'Ma teljesítve' : 'Teljesítés'}
                    </button>
                  ) : (goal.type === 'weekly' || goal.type === 'monthly') ? (
                    (() => {
                      const periodProgress = getCurrentPeriodProgress(goal);
                      const canComplete = periodProgress.current < periodProgress.target;
                      const todayCompletedPeriodic = isTodayCompletedForPeriodic(goal.id);
                      
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {periodProgress.current}/{periodProgress.target} {goal.target_unit || 'alkalom'}
                          </span>
                          <button
                            onClick={() => handleMarkComplete(goal.id)}
                            disabled={!canComplete || todayCompletedPeriodic || markingComplete === goal.id}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              !canComplete || todayCompletedPeriodic
                                ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {markingComplete === goal.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : todayCompletedPeriodic ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : !canComplete ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            {!canComplete ? 'Cél teljesítve' : todayCompletedPeriodic ? 'Ma hozzáadva' : '+1 teljesítés'}
                          </button>
                        </div>
                      );
                    })()
                  ) : null}
                </div>

                {/* Progress */}
                {progress && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Teljesítés</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getCorrectProgressRate(goal).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getCorrectProgressRate(goal))}`}
                        style={{ width: `${Math.min(100, getCorrectProgressRate(goal))}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        {progress.streak > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span>{progress.streak} napos sorozat</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{progress.daysRemaining} nap hátra</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Részletek
                        <ChevronRight className={`h-4 w-4 transition-transform ${selectedGoal?.id === goal.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>

                    {/* Calendar view for goals */}
                    {selectedGoal?.id === goal.id && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {goal.type === 'daily' && (
                          <>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                              {format(currentMonth, 'yyyy. MMMM', { locale: hu })} teljesítések
                            </h4>
                            <div className="grid grid-cols-7 gap-2">
                              {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                                  {day}
                                </div>
                              ))}
                              {getMonthlyCalendar(goal).map(({ date, dateStr, isCompleted, isToday: isToday_ }) => (
                                <div
                                  key={dateStr}
                                  className={`aspect-square flex items-center justify-center text-xs rounded ${
                                    isCompleted
                                      ? 'bg-green-500 text-white'
                                      : isToday_
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ring-2 ring-blue-500'
                                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  {format(date, 'd')}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {goal.type === 'weekly' && (
                          <>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                              Aktuális hét teljesítései
                            </h4>
                            <div className="grid grid-cols-7 gap-2">
                              {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                                  {day}
                                </div>
                              ))}
                              {getWeeklyCalendar(goal).map(({ date, dateStr, completions, isToday: isToday_ }) => (
                                <div
                                  key={dateStr}
                                  className={`aspect-square flex items-center justify-center text-xs rounded relative ${
                                    completions > 0
                                      ? 'bg-green-500 text-white'
                                      : isToday_
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ring-2 ring-blue-500'
                                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  {format(date, 'd')}
                                  {completions > 1 && (
                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                      {completions}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {goal.type === 'monthly' && (
                          <>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                              {format(currentMonth, 'yyyy. MMMM', { locale: hu })} teljesítések
                            </h4>
                            <div className="grid grid-cols-7 gap-2">
                              {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                                  {day}
                                </div>
                              ))}
                              {getMonthlyCalendar(goal).map(({ date, dateStr, isCompleted, isToday: isToday_ }) => (
                                <div
                                  key={dateStr}
                                  className={`aspect-square flex items-center justify-center text-xs rounded ${
                                    isCompleted
                                      ? 'bg-green-500 text-white'
                                      : isToday_
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ring-2 ring-blue-500'
                                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  {format(date, 'd')}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalsDashboard;
