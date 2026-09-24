import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { addDays, format, isToday } from 'date-fns';
import { hu } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Target, BookOpen } from 'lucide-react';
import { useFoodLog } from '../hooks/useFoodLog';
import { useNutritionGoals } from '../hooks/useNutritionGoals';
import { MEAL_LABELS, deleteFoodEntry, mealLabel, type FoodLogEntry } from '../lib/foodLog';
import { entryTotals } from '../lib/nutritionTargets';
import DailyMacroCard from '../components/nutrition/DailyMacroCard';
import FoodEntryRow from '../components/nutrition/FoodEntryRow';
import FoodSearchModal from '../components/nutrition/FoodSearchModal';
import NewFoodModal from '../components/nutrition/NewFoodModal';
import EntryEditModal from '../components/nutrition/EntryEditModal';
import RecipePickerModal from '../components/nutrition/RecipePickerModal';

export default function NutritionLog() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const viewingToday = isToday(selectedDate);

  const { entries, loading, reload } = useFoodLog(dateStr);
  const { settings } = useNutritionGoals();

  const [addingMeal, setAddingMeal] = useState<number | null>(null);
  const [creatingFoodForMeal, setCreatingFoodForMeal] = useState<number | null>(null);
  const [pickingRecipeForMeal, setPickingRecipeForMeal] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);

  const totals = useMemo(() => entryTotals(entries), [entries]);

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteFoodEntry(id);
      toast.success('Törölve');
      reload();
    } catch (error) {
      console.error('Failed to delete food entry:', error);
      toast.error('Nem sikerült törölni a bejegyzést');
    }
  };

  const goals = useMemo(
    () => ({
      kcal: settings?.kcal_goal ?? null,
      protein: settings ? Math.round((settings.protein_goal_min + settings.protein_goal_max) / 2) : null,
      carbs: settings?.carbs_goal_g ?? null,
      fat: settings?.fat_goal_g ?? null,
    }),
    [settings],
  );

  const byMeal = useMemo(
    () =>
      MEAL_LABELS.map((_, i) => ({
        index: i + 1,
        entries: entries.filter((e) => e.meal_index === i + 1),
      })),
    [entries],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kalória-napló</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Étel-napló és napi makró-összesítő</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/nutrition/recipes" className="btn btn-outline inline-flex items-center gap-2">
            <BookOpen size={18} />
            <span>Receptek</span>
          </Link>
          <Link to="/nutrition/targets" className="btn btn-outline inline-flex items-center gap-2">
            <Target size={18} />
            <span>Célok</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedDate((d) => addDays(d, -1))}
          className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Előző nap"
        >
          <ChevronLeft size={18} />
        </button>

        <button type="button" onClick={() => setSelectedDate(new Date())} className="min-w-[220px] text-center">
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {viewingToday ? 'Ma' : format(selectedDate, 'MMMM d. (EEEE)', { locale: hu })}
          </p>
          {!viewingToday ? <p className="text-xs text-gray-400 dark:text-gray-500">Koppints a mai napért</p> : null}
        </button>

        <button
          type="button"
          onClick={() => setSelectedDate((d) => (isToday(d) ? d : addDays(d, 1)))}
          disabled={viewingToday}
          className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Következő nap"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <DailyMacroCard totals={totals} goals={goals} />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {byMeal.map((meal) => {
            const mealKcal = meal.entries.reduce((s, e) => s + e.kcal, 0);
            return (
              <div key={meal.index} className="card">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{mealLabel(meal.index)}</h3>
                  {mealKcal > 0 ? <span className="text-sm font-medium text-gray-400">{Math.round(mealKcal)} kcal</span> : null}
                </div>

                <div>
                  {meal.entries.map((entry) => (
                    <FoodEntryRow
                      key={entry.id}
                      entry={entry}
                      onEdit={() => setEditingEntry(entry)}
                      onDelete={() => handleDeleteEntry(entry.id)}
                    />
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-4 border-t border-gray-100 pt-2.5 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setAddingMeal(meal.index)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
                  >
                    <Plus size={16} />
                    Étel hozzáadása
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickingRecipeForMeal(meal.index)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:underline dark:text-gray-400"
                  >
                    <BookOpen size={14} />
                    Recept
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addingMeal != null ? (
        <FoodSearchModal
          open
          mode="log"
          date={dateStr}
          mealIndex={addingMeal}
          onClose={() => setAddingMeal(null)}
          onLogged={reload}
          onNewFood={() => {
            setCreatingFoodForMeal(addingMeal);
            setAddingMeal(null);
          }}
        />
      ) : null}

      {creatingFoodForMeal != null ? (
        <NewFoodModal
          mode="log"
          date={dateStr}
          mealIndex={creatingFoodForMeal}
          onClose={() => setCreatingFoodForMeal(null)}
          onLogged={reload}
        />
      ) : null}

      {pickingRecipeForMeal != null ? (
        <RecipePickerModal
          date={dateStr}
          mealIndex={pickingRecipeForMeal}
          onClose={() => setPickingRecipeForMeal(null)}
          onLogged={reload}
        />
      ) : null}

      {editingEntry ? (
        <EntryEditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}
