import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRecipes } from '../hooks/useRecipes';
import { recipeKind, type RecipeKind, type RecipeWithItems, macrosPerServing } from '../lib/recipes';
import RecipeEditorModal from '../components/nutrition/RecipeEditorModal';

export default function NutritionRecipes() {
  const { recipes, loading, reload } = useRecipes();
  const [tab, setTab] = useState<RecipeKind>('meal');
  const [editing, setEditing] = useState<RecipeWithItems | null | 'new'>(null);

  const list = useMemo(() => recipes.filter((r) => recipeKind(r.kind) === tab), [recipes, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Receptek és étkezések</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Saját összeállítások gyors naplózáshoz</p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="btn btn-primary inline-flex items-center gap-2">
          <Plus size={18} />
          <span>Új összeállítás</span>
        </button>
      </div>

      <div className="flex gap-2">
        <TabButton label="Étkezések" active={tab === 'meal'} onClick={() => setTab('meal')} />
        <TabButton label="Receptek" active={tab === 'recipe'} onClick={() => setTab('recipe')} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="card text-center">
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {tab === 'meal' ? 'Még nincs étkezés-sablonod' : 'Még nincs recepted'}
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {tab === 'meal'
              ? 'Állítsd össze a visszatérő étkezéseidet (pl. „Reggeli: 3 tojás + 60 g sonka”), és egy kattintással naplózhatod őket.'
              : 'A recept nagyobb adagban készült ételhez való: megadod a hozzávalókat és hogy hány adagot ad ki, mi kiszámoljuk egy adag makróit.'}
          </p>
          <button type="button" onClick={() => setEditing('new')} className="btn btn-primary mt-4">
            {tab === 'meal' ? 'Étkezés összeállítása' : 'Recept összeállítása'}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((recipe) => {
            const perServing = macrosPerServing(recipe);
            return (
              <button key={recipe.id} type="button" onClick={() => setEditing(recipe)} className="card text-left">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{recipe.name}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {recipe.items.length} hozzávaló · {recipeKind(recipe.kind) === 'recipe' ? `${recipe.servings} adag · ` : ''}
                  {Math.round(perServing.kcal)} kcal / adag
                </p>
                {recipe.notes ? <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{recipe.notes}</p> : null}
              </button>
            );
          })}
        </div>
      )}

      {editing != null ? (
        <RecipeEditorModal
          recipe={editing === 'new' ? null : editing}
          initialKind={tab}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-primary-600 text-white dark:text-gray-900' : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}
