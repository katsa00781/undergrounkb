// 🎯 Célkövetési rendszer TypeScript típusok és API

export type GoalType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type GoalCategory = 'fitness' | 'nutrition' | 'health' | 'lifestyle' | 'personal';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  type: GoalType;
  starting_value?: number; // Kiindulási/baseline érték
  target_value?: number;
  target_unit?: string; // 'kg', 'reps', 'minutes', 'days', etc.
  current_value: number;
  start_date: string; // YYYY-MM-DD format
  end_date: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface GoalCompletion {
  id: string;
  goal_id: string;
  user_id: string;
  completion_date: string; // YYYY-MM-DD format
  value_achieved?: number;
  notes?: string;
  created_at: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  category: GoalCategory;
  type: GoalType;
  starting_value?: number; // Kiindulási érték
  current_value?: number; // Jelenlegi érték
  target_value?: number;
  target_unit?: string;
  start_date: string;
  end_date: string;
}

export interface CreateCompletionData {
  goal_id: string;
  completion_date?: string; // Default: today
  value?: number; // Compatibility alias for value_achieved
  value_achieved?: number;
  notes?: string;
}

// Progress számítás típusok
export interface GoalProgress {
  goal: Goal;
  completions: GoalCompletion[];
  completionRate: number; // 0-100%
  streak: number; // Consecutive days completed
  daysRemaining: number;
  isOnTrack: boolean;
}

// Dashboard statisztikák
export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  todayCompletions: number;
  weeklyCompletionRate: number;
  longestStreak: number;
}

// Cél sablonok
export interface GoalTemplate {
  id?: string;
  title: string;
  description: string;
  category: GoalCategory;
  type: GoalType;
  target_value?: number;
  target_unit?: string;
  duration_days: number; // How many days the goal should last
}

// Előre definiált cél sablonok
export const GOAL_TEMPLATES: GoalTemplate[] = [
  // Napi célok
  {
    id: "daily-water",
    title: "8 pohár víz elfogyasztása",
    description: "Napi 2-2.5 liter víz fogyasztása az egészség megőrzéséért",
    category: "health",
    type: "daily",
    target_value: 8,
    target_unit: "pohár",
    duration_days: 30
  },
  {
    title: "10,000 lépés naponta",
    description: "Napi lépésszám cél az aktív életmód fenntartásához",
    category: "fitness",
    type: "daily", 
    target_value: 10000,
    target_unit: "lépés",
    duration_days: 30
  },
  {
    title: "30 perc mozgás",
    description: "Napi minimum 30 perc fizikai aktivitás",
    category: "fitness",
    type: "daily",
    target_value: 30,
    target_unit: "perc",
    duration_days: 30
  },
  {
    title: "7 óra alvás",
    description: "Egészséges alvási szokások kialakítása",
    category: "health",
    type: "daily",
    target_value: 7,
    target_unit: "óra", 
    duration_days: 30
  },
  
  // Heti célok
  {
    title: "3 edzés hetente",
    description: "Rendszeres edzés heti 3 alkalommal",
    category: "fitness",
    type: "weekly",
    target_value: 3,
    target_unit: "edzés",
    duration_days: 84 // 12 weeks
  },
  {
    title: "2 futás hetente", 
    description: "Kardio edzés heti 2 alkalommal futással",
    category: "fitness",
    type: "weekly",
    target_value: 2,
    target_unit: "futás",
    duration_days: 84
  },
  
  // Havi célok
  {
    title: "2 kg fogyás havonta",
    description: "Egészséges fogyás 2 kg/hónap ütemben",
    category: "fitness",
    type: "monthly",
    target_value: 2,
    target_unit: "kg",
    duration_days: 180 // 6 months
  },
  {
    title: "20 edzés havonta",
    description: "Intenzív edzési periódus 20 edzéssel",
    category: "fitness", 
    type: "monthly",
    target_value: 20,
    target_unit: "edzés",
    duration_days: 90 // 3 months
  },
  
  // Hosszú távú célok
  {
    title: "10 kg fogyás",
    description: "Hosszú távú fogyási cél egészséges ütemben",
    category: "fitness",
    type: "yearly",
    target_value: 10,
    target_unit: "kg",
    duration_days: 365
  },
  {
    title: "Marathon futás",
    description: "42.2 km-es futóverseny teljesítése",
    category: "fitness",
    type: "yearly",
    target_value: 42.2,
    target_unit: "km",
    duration_days: 365
  }
];

// Export sablonok
export const goalTemplates = GOAL_TEMPLATES;

// Supabase import
import { supabase } from '../config/supabase';

// ==========================================
// API FUNKCIÓK
// ==========================================

/**
 * Új cél létrehozása
 */
export async function createGoal(goalData: CreateGoalData): Promise<Goal> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  console.log('🎯 Creating new goal with data:', {
    ...goalData,
    user_id: user.user.id,
    status: 'active',
    current_value: goalData.current_value ?? 0
  });

  const { data, error } = await supabase
    .from('goals')
    .insert({
      ...goalData,
      user_id: user.user.id,
      status: 'active', // Explicit status beállítás
      current_value: goalData.current_value ?? 0 // Alapértelmezett current_value
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating goal:', error);
    throw error;
  }
  
  console.log('✅ Goal created successfully:', {
    id: data.id,
    title: data.title,
    status: data.status,
    end_date: data.end_date,
    fullData: data
  });
  return data as Goal;
}

/**
 * Felhasználó céljainak lekérése
 */
export async function getGoals(status?: GoalStatus): Promise<Goal[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  let query = supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
  
  console.log(`Fetched ${data.length} goals with status: ${status || 'all'}`, data);
  return data as Goal[];
}

/**
 * Cél frissítése
 */
export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
  console.log('🔄 Updating goal:', goalId, 'with updates:', updates);
  
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating goal:', error);
    throw error;
  }
  
  console.log('✅ Goal updated:', {
    id: data.id,
    title: data.title,
    status: data.status,
    changes: updates,
    fullData: data
  });
  
  return data as Goal;
}

/**
 * Cél törlése
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
}

/**
 * Cél teljesítés rögzítése
 */
export async function completeGoal(completionData: CreateCompletionData): Promise<GoalCompletion> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Handle value compatibility
  const valueAchieved = completionData.value || completionData.value_achieved || 1;

  console.log('📝 Recording goal completion:', {
    goal_id: completionData.goal_id,
    value_achieved: valueAchieved,
    completion_date: completionData.completion_date || new Date().toISOString().split('T')[0]
  });

  const { data, error } = await supabase
    .from('goal_completions')
    .insert({
      goal_id: completionData.goal_id,
      user_id: user.user.id,
      completion_date: completionData.completion_date || new Date().toISOString().split('T')[0],
      value_achieved: valueAchieved,
      notes: completionData.notes
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error recording completion:', error);
    throw error;
  }
  
  console.log('✅ Completion recorded:', data);
  console.log('⚠️ Note: Trigger may update goal status automatically');
  
  return data as GoalCompletion;
}

/**
 * Cél teljesítések lekérése
 */
export async function getGoalCompletions(goalId: string): Promise<GoalCompletion[]> {
  const { data, error } = await supabase
    .from('goal_completions')
    .select('*')
    .eq('goal_id', goalId)
    .order('completion_date', { ascending: false });

  if (error) throw error;
  return data as GoalCompletion[];
}

/**
 * Mai teljesítések lekérése
 */
export async function getTodayCompletions(): Promise<GoalCompletion[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('goal_completions')
    .select(`
      *,
      goal:goals(*)
    `)
    .eq('user_id', user.user.id)
    .eq('completion_date', today);

  if (error) throw error;
  return data as GoalCompletion[];
}

/**
 * Cél progress számítása
 */
export async function getGoalProgress(goalId: string): Promise<GoalProgress> {
  // Cél adatok lekérése
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (goalError) throw goalError;

  // Teljesítések lekérése
  const completions = await getGoalCompletions(goalId);

  // Progress számítások
  const startDate = new Date(goal.start_date);
  const endDate = new Date(goal.end_date);
  const today = new Date();
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Completion rate számítása
  let completionRate = 0;
  let expectedCompletions = 0;

  // Ha van target_value, current_value és starting_value, akkor érték alapú haladást számolunk
  if (goal.target_value && goal.current_value !== null && goal.current_value !== undefined) {
    const baseValue = goal.starting_value ?? 0;
    const totalChange = Math.abs(goal.target_value - baseValue);
    const currentChange = Math.abs(goal.current_value - baseValue);
    
    if (totalChange > 0) {
      completionRate = Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    }
  } else {
    // Egyébként completion alapú számítás
    switch (goal.type) {
      case 'daily':
        expectedCompletions = Math.min(elapsedDays, totalDays);
        completionRate = expectedCompletions > 0 ? (completions.length / expectedCompletions) * 100 : 0;
        break;
      case 'weekly':
        const weeksElapsed = Math.ceil(elapsedDays / 7);
        expectedCompletions = Math.min(weeksElapsed, Math.ceil(totalDays / 7));
        completionRate = expectedCompletions > 0 ? (completions.length / expectedCompletions) * 100 : 0;
        break;
      case 'monthly':
        const monthsElapsed = Math.ceil(elapsedDays / 30);
        expectedCompletions = Math.min(monthsElapsed, Math.ceil(totalDays / 30));
        completionRate = expectedCompletions > 0 ? (completions.length / expectedCompletions) * 100 : 0;
        break;
      default:
        // Yearly, quarterly - simple completion check
        completionRate = completions.length > 0 ? 100 : 0;
    }
  }

  // Streak számítása (consecutive days)
  let streak = 0;
  const sortedCompletions = completions.sort((a, b) => 
    new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime()
  );

  let currentDate = new Date();
  for (const completion of sortedCompletions) {
    const completionDate = new Date(completion.completion_date);
    const daysDiff = Math.ceil((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= streak + 1) {
      streak++;
      currentDate = completionDate;
    } else {
      break;
    }
  }

  const isOnTrack = completionRate >= 80; // 80% felett tekintjük jó ütemnek

  return {
    goal: goal as Goal,
    completions,
    completionRate: Math.min(100, completionRate),
    streak,
    daysRemaining,
    isOnTrack
  };
}

/**
 * Felhasználó cél statisztikák
 */
export async function getGoalStats(): Promise<GoalStats> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Alapstatisztikák
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.user.id);

  if (goalsError) throw goalsError;

  const totalGoals = goals.length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;

  // Mai teljesítések
  const todayCompletions = await getTodayCompletions();

  // Heti completion rate
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  
  const { data: weeklyCompletions, error: weeklyError } = await supabase
    .from('goal_completions')
    .select('*')
    .eq('user_id', user.user.id)
    .gte('completion_date', weekStart.toISOString().split('T')[0]);

  if (weeklyError) throw weeklyError;

  const weeklyGoalsCount = goals.filter(g => g.type === 'daily').length * 7;
  const weeklyCompletionRate = weeklyGoalsCount > 0 ? (weeklyCompletions.length / weeklyGoalsCount) * 100 : 0;

  // Leghosszabb streak számítása (egyszerűsített)
  let longestStreak = 0;
  for (const goal of goals.filter(g => g.type === 'daily')) {
    const progress = await getGoalProgress(goal.id);
    longestStreak = Math.max(longestStreak, progress.streak);
  }

  return {
    totalGoals,
    activeGoals,
    completedGoals,
    todayCompletions: todayCompletions.length,
    weeklyCompletionRate: Math.min(100, weeklyCompletionRate),
    longestStreak
  };
}

/**
 * Cél sablon alapján cél létrehozása
 */
export async function createGoalFromTemplate(template: GoalTemplate): Promise<Goal> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + template.duration_days);

  console.log('📋 Creating goal from template:', template.title);
  console.log('📅 Date range:', {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    duration_days: template.duration_days
  });

  return createGoal({
    title: template.title,
    description: template.description,
    category: template.category,
    type: template.type,
    target_value: template.target_value,
    target_unit: template.target_unit,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  });
}
