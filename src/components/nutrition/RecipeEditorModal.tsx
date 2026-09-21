import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X } from 'lucide-react';
import Modal from '../ui/Modal';
import FoodSearchModal from './FoodSearchModal';
import NewFoodModal from './NewFoodModal';
import { RECIPE_KINDS, deleteRecipe, saveRecipe, type RecipeItemInput, type RecipeKind, type RecipeWithItems } from '../../lib/recipes';
import { EMPTY_MACROS, sumMacros } from '../../lib/nutritionTargets';

interface RecipeEditorModalProps {
  /** Megadva = szerkesztés, `null` = új összeállítás. */
  recipe: RecipeWithItems | null;
  /** Új összeállításnál a kezdő típus (melyik fülön nyomtak „+"-t). */
  initialKind: RecipeKind;
  onClose: () => void;
  onSaved: () => void;
}

export default function RecipeEditorModal({ recipe, initialKind, onClose, onSaved }: RecipeEditorModalProps) {
  const [kind, setKind] = useState<RecipeKind>(recipe ? (recipe.kind === 'recipe' ? 'recipe' : 'meal') : initialKind);
  const [name, setName] = useState(recipe?.name ?? '');
  const [servingsText, setServingsText] = useState(String(recipe?.servings ?? 1));
  const [notes, setNotes] = useState(recipe?.notes ?? '');
  const [items, setItems] = useState<RecipeItemInput[]>(
    recipe?.items.map((i) => ({ foodId: i.food_id, name: i.name, grams: i.grams, kcal: i.kcal, protein: i.protein, carbs: i.carbs, fat: i.fat })) ?? [],
  );
  const [addingItem, setAddingItem] = useState<'search' | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const busy = saving || deleting;
  const servings = kind === 'meal' ? 1 : Math.max(parseFloat(servingsText.replace(',', '.')) || 1, 0.1);
  const totals = items.length > 0 ? sumMacros(items) : { ...EMPTY_MACROS };
  const totalGrams = items.reduce((sum, i) => sum + i.grams, 0);

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Adj nevet az összeállításnak');
      return;
    }
    if (items.length === 0) {
      toast.error('Adj hozzá legalább egy hozzávalót');
      return;
    }

    try {
      setSaving(true);
      await saveRecipe({ id: recipe?.id, kind, name: trimmedName, servings, notes: notes.trim() || null, items });
      toast.success(`${trimmedName} elmentve`);
      onSaved();
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast.error('Nem sikerült menteni');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!recipe) return;
    if (!window.confirm(`Biztosan törlöd: ${recipe.name}?`)) return;
    try {
      setDeleting(true);
      await deleteRecipe(recipe.id);
      toast.success('Törölve');
      onSaved();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      toast.error('Nem sikerült törölni');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={recipe ? 'Szerkesztés' : 'Új összeállítás'}
        description={kind === 'recipe' ? 'Recept' : 'Étkezés'}
        maxWidth="lg"
        closeDisabled={busy}
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {RECIPE_KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  kind === k.key ? 'bg-primary-600 text-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <p className="text-sm font-semibold">{k.label}</p>
                <p className={`text-xs ${kind === k.key ? 'opacity-80' : 'text-gray-400'}`}>{k.hint}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Név</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === 'recipe' ? 'pl. Bolognai' : 'pl. Reggeli'}
                className="input"
              />
            </div>
            {kind === 'recipe' ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Hány adagot ad ki?</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={servingsText}
                  onChange={(e) => setServingsText(e.target.value)}
                  placeholder="4"
                  className="input"
                />
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Hozzávalók</label>
            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              {items.length === 0 ? (
                <p className="text-sm text-gray-400">Még nincs hozzávaló. Keresd ki őket a katalógusból.</p>
              ) : (
                items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center gap-2 border-b border-gray-100 py-2 last:border-b-0 dark:border-gray-700">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        {Math.round(item.grams)} g · F {item.protein} · Sz {item.carbs} · Zs {item.fat}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{Math.round(item.kcal)}</span>
                    <button type="button" onClick={() => removeItem(index)} className="p-1 text-gray-300 hover:text-error-500" aria-label="Hozzávaló törlése">
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() => setAddingItem('search')}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
              >
                <Plus size={16} />
                Hozzávaló hozzáadása
              </button>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Egy adag</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{Math.round(totals.kcal / servings)} kcal</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {Math.round(totalGrams / servings)} g · F {round1(totals.protein / servings)} g · Sz {round1(totals.carbs / servings)} g · Zs{' '}
                {round1(totals.fat / servings)} g
              </p>
              {servings > 1 ? (
                <p className="mt-1 text-xs text-gray-400">
                  Teljes mennyiség: {Math.round(totals.kcal)} kcal · {Math.round(totalGrams)} g
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">Megjegyzés (opcionális)</label>
            <textarea value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} rows={3} className="input" placeholder="pl. elkészítés, hőfok, tipp" />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {recipe ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="btn btn-outline inline-flex items-center gap-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
              >
                <Trash2 size={16} />
                {deleting ? 'Törlés...' : 'Törlés'}
              </button>
            ) : (
              <span />
            )}
            <button type="button" onClick={handleSave} disabled={busy} className="btn btn-primary">
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
        </div>
      </Modal>

      {addingItem === 'search' ? (
        <FoodSearchModal
          open
          mode="pick"
          onClose={() => setAddingItem(null)}
          onNewFood={() => setAddingItem('new')}
          onPick={(item) => {
            setItems((prev) => [...prev, item]);
            setAddingItem(null);
          }}
        />
      ) : null}

      {addingItem === 'new' ? (
        <NewFoodModal
          mode="pick"
          onClose={() => setAddingItem(null)}
          onPick={(item) => {
            setItems((prev) => [...prev, item]);
            setAddingItem(null);
          }}
        />
      ) : null}
    </>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
