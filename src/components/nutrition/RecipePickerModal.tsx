import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { QuantityInput, type Quantity } from './QuantityInput';
import { useRecipes } from '../../hooks/useRecipes';
import { gramsPerServing, macrosPerServing, recipeKind, type RecipeKind, type RecipeWithItems } from '../../lib/recipes';
import { addRecipeEntry, mealLabel } from '../../lib/foodLog';

interface RecipePickerModalProps {
  date: string;
  mealIndex: number;
  onClose: () => void;
  onLogged: () => void;
}

/** Recept vagy étkezés-sablon naplózása a napi naplóból – egy összevont sorként. */
export default function RecipePickerModal({ date, mealIndex, onClose, onLogged }: RecipePickerModalProps) {
  const { recipes, loading } = useRecipes();
  const [tab, setTab] = useState<RecipeKind>('meal');
  const [selected, setSelected] = useState<RecipeWithItems | null>(null);
  const [quantity, setQuantity] = useState<Quantity>({ grams: 0, servings: 1 });
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => recipes.filter((r) => recipeKind(r.kind) === tab), [recipes, tab]);

  function pick(recipe: RecipeWithItems) {
    setSelected(recipe);
    setQuantity({ grams: gramsPerServing(recipe), servings: 1 });
  }

  async function handleAdd() {
    if (!selected) return;
    const perServing = gramsPerServing(selected);
    const servings = quantity.servings ?? (perServing > 0 ? quantity.grams / perServing : 0);
    if (servings <= 0) {
      toast.error('Adj meg egy érvényes mennyiséget');
      return;
    }
    try {
      setSaving(true);
      await addRecipeEntry({ date, mealIndex, recipe: selected, servings });
      toast.success(`${selected.name} hozzáadva`);
      onLogged();
      onClose();
    } catch (error) {
      console.error('Failed to add recipe entry:', error);
      toast.error('Nem sikerült hozzáadni a bejegyzést');
    } finally {
      setSaving(false);
    }
  }

  const preview = selected
    ? (() => {
        const perServing = gramsPerServing(selected);
        const servings = quantity.servings ?? (perServing > 0 ? quantity.grams / perServing : 0);
        const m = macrosPerServing(selected);
        return { kcal: m.kcal * servings, protein: m.protein * servings, carbs: m.carbs * servings, fat: m.fat * servings };
      })()
    : null;

  return (
    <Modal open onClose={onClose} title="Receptek és étkezések" description={mealLabel(mealIndex)} maxWidth="lg" closeDisabled={saving}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <TabButton label="Étkezések" active={tab === 'meal'} onClick={() => setTab('meal')} />
          <TabButton label="Receptek" active={tab === 'recipe'} onClick={() => setTab('recipe')} />
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-2 text-sm text-gray-400">Betöltés...</p>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tab === 'meal' ? 'Még nincs étkezés-sablonod.' : 'Még nincs recepted.'}
              </p>
              <Link to="/nutrition/recipes" className="mt-2 inline-block text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">
                Összeállítás létrehozása
              </Link>
            </div>
          ) : (
            list.map((recipe) => {
              const perServing = macrosPerServing(recipe);
              const active = selected?.id === recipe.id;
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => pick(recipe)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left ${
                    active ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 hover:border-primary-400 dark:border-gray-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{recipe.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {recipe.items.length} hozzávaló · {recipeKind(recipe.kind) === 'recipe' ? `${recipe.servings} adag · ` : ''}
                      {Math.round(perServing.kcal)} kcal / adag
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selected ? (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{selected.name}</p>
            <QuantityInput key={selected.id} servingG={gramsPerServing(selected) || null} initial={quantity} onChange={setQuantity} />
            {preview ? (
              <p className="mt-3 mb-3 text-sm text-gray-500 dark:text-gray-400">
                {Math.round(preview.kcal)} kcal · F {Math.round(preview.protein)} g · Sz {Math.round(preview.carbs)} g · Zs {Math.round(preview.fat)} g
              </p>
            ) : null}
            <button type="button" onClick={handleAdd} disabled={saving} className="btn btn-primary w-full">
              {saving ? 'Mentés...' : 'Hozzáadás a naplóhoz'}
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-primary-600 text-white dark:text-gray-900' : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}
