import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { QuantityInput, type Quantity } from './QuantityInput';
import { MEAL_LABELS, deleteFoodEntry, updateFoodEntry, type FoodLogEntry } from '../../lib/foodLog';
import { getFoodById, type Food } from '../../lib/foods';
import { scaleFood } from '../../lib/nutritionTargets';

interface EntryEditModalProps {
  entry: FoodLogEntry;
  onClose: () => void;
  onSaved: () => void;
}

export default function EntryEditModal({ entry, onClose, onSaved }: EntryEditModalProps) {
  const [food, setFood] = useState<Food | null>(null);
  const [mealIndex, setMealIndex] = useState(entry.meal_index);
  const [quantity, setQuantity] = useState<Quantity>({ grams: entry.grams, servings: entry.servings });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (entry.food_id) {
      getFoodById(entry.food_id)
        .then((f) => {
          if (!cancelled) setFood(f);
        })
        .catch((err) => console.error('Nem sikerült betölteni az ételt:', err));
    }
    return () => {
      cancelled = true;
    };
  }, [entry.food_id]);

  const busy = isSaving || isDeleting;

  const handleSave = async () => {
    if (quantity.grams <= 0) {
      toast.error('Adj meg egy érvényes mennyiséget');
      return;
    }
    try {
      setIsSaving(true);
      await updateFoodEntry({
        id: entry.id,
        mealIndex,
        grams: quantity.grams,
        servings: quantity.servings,
        food,
        previous: entry,
      });
      toast.success('Mentve');
      onSaved();
    } catch (error) {
      console.error('Failed to update food entry:', error);
      toast.error('Nem sikerült menteni a módosítást');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteFoodEntry(entry.id);
      toast.success('Törölve');
      onSaved();
    } catch (error) {
      console.error('Failed to delete food entry:', error);
      toast.error('Nem sikerült törölni a bejegyzést');
    } finally {
      setIsDeleting(false);
    }
  };

  const preview = food ? scaleFood(food, quantity.grams) : null;

  return (
    <Modal open onClose={onClose} title={entry.name} maxWidth="md" closeDisabled={busy}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Étkezés</label>
          <select
            className="input"
            value={mealIndex}
            onChange={(e) => setMealIndex(Number(e.target.value))}
            disabled={busy}
          >
            {MEAL_LABELS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Mennyiség</label>
          <QuantityInput
            servingG={food?.serving_g ?? null}
            servingLabel={food?.serving_label}
            initial={quantity}
            onChange={setQuantity}
          />
        </div>

        {preview ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(preview.kcal)} kcal · F {preview.protein} g · Sz {preview.carbs} g · Zs {preview.fat} g
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="btn btn-outline inline-flex items-center gap-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
          >
            <Trash2 size={16} />
            {isDeleting ? 'Törlés...' : 'Törlés'}
          </button>
          <button type="button" onClick={handleSave} disabled={busy} className="btn btn-primary">
            {isSaving ? 'Mentés...' : 'Mentés'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
