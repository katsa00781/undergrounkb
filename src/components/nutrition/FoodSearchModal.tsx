import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Barcode, Camera, DownloadCloud, Search } from 'lucide-react';
import Modal from '../ui/Modal';
import { QuantityInput, type Quantity } from './QuantityInput';
import {
  getRecentFoods,
  lookupBarcode,
  saveOffCandidate,
  searchFoods,
  searchFoodsRemote,
  type Food,
  type FoodSearchResult,
  type OffCandidate,
} from '../../lib/foods';
import { addFoodEntry, mealLabel } from '../../lib/foodLog';
import type { RecipeItemInput } from '../../lib/recipes';
import { scaleFood } from '../../lib/nutritionTargets';
import { useAuth } from '../../hooks/useAuth';

/** Ennyi helyi találat alatt kérünk Open Food Facts kiegészítést is. */
const LOCAL_HIT_THRESHOLD = 5;

type FoodSearchModalProps = { open: boolean; onClose: () => void; onNewFood: () => void } & (
  | { mode: 'log'; date: string; mealIndex: number; onLogged: () => void }
  | { mode: 'pick'; onPick: (item: RecipeItemInput) => void }
);

export default function FoodSearchModal(props: FoodSearchModalProps) {
  const { open, onClose } = props;
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<Food[]>([]);
  const [recent, setRecent] = useState<Food[]>([]);
  const [offResult, setOffResult] = useState<FoodSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [offSearching, setOffSearching] = useState(false);
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState<Quantity>({ grams: 100, servings: null });
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [barcodeBusy, setBarcodeBusy] = useState(false);

  // Reset állapot minden megnyitáskor
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setLocalResults([]);
    setOffResult(null);
    setSelected(null);
    setBarcode('');
  }, [open]);

  useEffect(() => {
    if (!open || !user?.id) return;
    getRecentFoods(user.id).then(setRecent).catch((err) => console.error('Nem sikerült betölteni a legutóbbi ételeket:', err));
  }, [open, user?.id]);

  const trimmed = query.trim();
  const isSearchTerm = trimmed.length >= 2;

  useEffect(() => {
    if (!isSearchTerm) {
      setLocalResults([]);
      setOffResult(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const local = await searchFoods(trimmed);
        if (cancelled) return;
        setLocalResults(local);

        if (local.length < LOCAL_HIT_THRESHOLD) {
          setOffSearching(true);
          try {
            const remote = await searchFoodsRemote(trimmed);
            if (!cancelled) setOffResult(remote);
          } finally {
            if (!cancelled) setOffSearching(false);
          }
        } else {
          setOffResult(null);
        }
      } catch (error) {
        console.error('Étel keresés sikertelen:', error);
        toast.error('Nem sikerült keresni a katalógusban');
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmed, isSearchTerm]);

  const list = isSearchTerm ? localResults : recent;
  const offCandidates = offResult?.off ?? [];

  function pick(food: Food) {
    setSelected(food);
    setQuantity(food.serving_g ? { grams: food.serving_g, servings: 1 } : { grams: 100, servings: null });
  }

  async function pickOff(candidate: OffCandidate) {
    try {
      const food = await saveOffCandidate(candidate.code);
      pick(food);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nem sikerült elmenteni a terméket');
    }
  }

  async function handleBarcodeSearch() {
    const code = barcode.trim();
    if (!code) return;
    try {
      setBarcodeBusy(true);
      const result = await lookupBarcode(code);
      if (result.status === 'found') {
        pick(result.food);
      } else if (result.status === 'not_found') {
        toast.error('Nincs találat erre a vonalkódra');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Vonalkód keresés sikertelen:', error);
      toast.error('Nem sikerült feloldani a vonalkódot');
    } finally {
      setBarcodeBusy(false);
    }
  }

  async function handleConfirm() {
    if (!selected) return;
    if (quantity.grams <= 0) {
      toast.error('Adj meg egy érvényes mennyiséget');
      return;
    }

    if (props.mode === 'pick') {
      const macros = scaleFood(selected, quantity.grams);
      props.onPick({
        foodId: selected.id,
        name: selected.brand ? `${selected.name} (${selected.brand})` : selected.name,
        grams: quantity.grams,
        ...macros,
      });
      onClose();
      return;
    }

    try {
      setSaving(true);
      await addFoodEntry({
        date: props.date,
        mealIndex: props.mealIndex,
        food: selected,
        grams: quantity.grams,
        servings: quantity.servings,
      });
      toast.success(`${selected.name} hozzáadva`);
      props.onLogged();
      onClose();
    } catch (error) {
      console.error('Failed to add food entry:', error);
      toast.error('Nem sikerült hozzáadni a bejegyzést');
    } finally {
      setSaving(false);
    }
  }

  const preview = useMemo(() => (selected ? scaleFood(selected, quantity.grams) : null), [selected, quantity]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Étel keresése"
      description={props.mode === 'log' ? mealLabel(props.mealIndex) : 'Hozzávaló a recepthez'}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="input flex flex-1 items-center gap-2">
            <Search size={16} className="shrink-0 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="pl. csirkemell, túró, zabpehely"
              className="w-full border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="button"
            onClick={props.onNewFood}
            className="btn btn-outline shrink-0 !px-3"
            title="Új étel felvitele (kézi vagy címkekép)"
          >
            <Camera size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="input flex flex-1 items-center gap-2">
            <Barcode size={16} className="shrink-0 text-gray-400" />
            <input
              type="text"
              inputMode="numeric"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Vonalkód (opcionális)"
              className="w-full border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <button type="button" onClick={handleBarcodeSearch} disabled={barcodeBusy || !barcode.trim()} className="btn btn-outline shrink-0">
            {barcodeBusy ? 'Keresés...' : 'Keresés'}
          </button>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {!isSearchTerm && list.length > 0 ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Legutóbb naplózott</p>
          ) : null}

          {searching ? <p className="py-2 text-sm text-gray-400">Keresés...</p> : null}

          {list.map((food) => (
            <FoodRow key={food.id} food={food} active={selected?.id === food.id} onClick={() => pick(food)} />
          ))}

          {isSearchTerm && !searching && localResults.length < LOCAL_HIT_THRESHOLD ? (
            <div className="pt-2">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Bolti termékek (Open Food Facts)
                </p>
                {offSearching ? <span className="text-xs text-gray-400">keresés...</span> : null}
              </div>

              {offResult?.offError ? (
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Az Open Food Facts most nem elérhető ({offResult.offError}).</p>
              ) : null}

              {offCandidates.map((candidate) => (
                <button
                  key={candidate.code}
                  type="button"
                  onClick={() => pickOff(candidate)}
                  className="mb-2 flex w-full items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-left hover:border-primary-400 dark:border-gray-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{candidate.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {candidate.brand ? `${candidate.brand} · ` : ''}
                      {Math.round(candidate.kcal_100)} kcal / 100 g
                    </p>
                  </div>
                  <DownloadCloud size={16} className="shrink-0 text-gray-300" />
                </button>
              ))}

              {!offSearching && offCandidates.length === 0 && !offResult?.offError ? (
                <p className="text-sm text-gray-400">
                  {list.length === 0 ? 'Nincs találat sehol.' : 'Az OFF-ban nincs további találat.'}
                </p>
              ) : null}
            </div>
          ) : null}

          {!isSearchTerm && list.length === 0 ? <p className="py-2 text-sm text-gray-400">Még nincs korábbi naplózásod.</p> : null}
        </div>

        {selected ? (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{selected.name}</p>
            <QuantityInput
              key={selected.id}
              servingG={selected.serving_g}
              servingLabel={selected.serving_label}
              initial={quantity}
              onChange={setQuantity}
            />
            {preview ? (
              <p className="mt-3 mb-3 text-sm text-gray-500 dark:text-gray-400">
                {Math.round(preview.kcal)} kcal · F {preview.protein} g · Sz {preview.carbs} g · Zs {preview.fat} g
              </p>
            ) : null}
            <button type="button" onClick={handleConfirm} disabled={saving} className="btn btn-primary w-full">
              {saving ? 'Mentés...' : props.mode === 'pick' ? 'Hozzáadás a recepthez' : 'Hozzáadás a naplóhoz'}
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function FoodRow({ food, active, onClick }: { food: Food; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left ${
        active ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 hover:border-primary-400 dark:border-gray-700'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{food.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {food.brand ? `${food.brand} · ` : ''}
          {Math.round(food.kcal_100)} kcal / 100 g · F {food.protein_100} g
        </p>
      </div>
    </button>
  );
}
