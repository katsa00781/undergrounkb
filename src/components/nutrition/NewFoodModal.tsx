import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImageUp, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { QuantityInput, type Quantity } from './QuantityInput';
import { analyzeLabelPhoto, createUserFood, type Food } from '../../lib/foods';
import { addFoodEntry } from '../../lib/foodLog';
import { scaleFood } from '../../lib/nutritionTargets';
import type { RecipeItemInput } from '../../lib/recipes';

type NewFoodModalProps = { onClose: () => void } & (
  | { mode: 'log'; date: string; mealIndex: number; onLogged: () => void }
  | { mode: 'pick'; onPick: (item: RecipeItemInput) => void }
);

type FormFields = {
  name: string;
  brand: string;
  kcal_100: string;
  protein_100: string;
  carbs_100: string;
  fat_100: string;
  fiber_100: string;
  sugar_100: string;
  salt_100: string;
  serving_g: string;
  serving_label: string;
};

const EMPTY_FIELDS: FormFields = {
  name: '',
  brand: '',
  kcal_100: '',
  protein_100: '',
  carbs_100: '',
  fat_100: '',
  fiber_100: '',
  sugar_100: '',
  salt_100: '',
  serving_g: '',
  serving_label: '',
};

function parseNum(value: string): number {
  const n = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function parseOptionalNum(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readFileAsBase64(file: File): Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/png' }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      const mediaType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve({ base64, mediaType });
    };
    reader.onerror = () => reject(new Error('Nem sikerült beolvasni a képet'));
    reader.readAsDataURL(file);
  });
}

/**
 * Új élelmiszer felvitele: kézi űrlap (100 g-ra vetített mezők) VAGY
 * tápértékcímke-kép feltöltése, ami a `food-label-vision` Edge Functionnel
 * előtölti az űrlapot – a felhasználó ellenőrzi/javítja, mielőtt menti.
 * Mentés után egy mennyiség-lépés következik, ami a naplóba vagy a recept
 * piszkozatába teszi az újonnan létrehozott ételt.
 */
export default function NewFoodModal(props: NewFoodModalProps) {
  const { onClose } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<'user' | 'vision'>('user');
  const [savedFood, setSavedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState<Quantity>({ grams: 100, servings: null });

  function setField<K extends keyof FormFields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFile(file: File) {
    setAnalyzing(true);
    try {
      const { base64, mediaType } = await readFileAsBase64(file);
      const result = await analyzeLabelPhoto(base64, mediaType);
      if (result.status === 'unreadable') {
        toast.error(`Nem olvasható a címke: ${result.reason}`);
        return;
      }
      setFields({
        name: result.name ?? '',
        brand: result.brand ?? '',
        kcal_100: String(result.kcal_100),
        protein_100: String(result.protein_100),
        carbs_100: String(result.carbs_100),
        fat_100: String(result.fat_100),
        fiber_100: result.fiber_100 != null ? String(result.fiber_100) : '',
        sugar_100: result.sugar_100 != null ? String(result.sugar_100) : '',
        salt_100: result.salt_100 != null ? String(result.salt_100) : '',
        serving_g: result.serving_g != null ? String(result.serving_g) : '',
        serving_label: result.serving_label ?? '',
      });
      setSource('vision');
      toast.success('Címke beolvasva – ellenőrizd az értékeket');
    } catch (error) {
      console.error('Label vision failed:', error);
      toast.error('Sikertelen elemzés');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    const name = fields.name.trim();
    if (!name) {
      toast.error('Adj meg egy nevet');
      return;
    }
    const kcal = parseNum(fields.kcal_100);
    if (kcal <= 0) {
      toast.error('Adj meg egy érvényes kalóriaértéket');
      return;
    }

    try {
      setSaving(true);
      const food = await createUserFood({
        name,
        brand: fields.brand.trim() || null,
        kcal_100: kcal,
        protein_100: parseNum(fields.protein_100),
        carbs_100: parseNum(fields.carbs_100),
        fat_100: parseNum(fields.fat_100),
        fiber_100: parseOptionalNum(fields.fiber_100),
        sugar_100: parseOptionalNum(fields.sugar_100),
        salt_100: parseOptionalNum(fields.salt_100),
        serving_g: parseOptionalNum(fields.serving_g),
        serving_label: fields.serving_label.trim() || null,
        source,
      });
      setSavedFood(food);
      setQuantity(food.serving_g ? { grams: food.serving_g, servings: 1 } : { grams: 100, servings: null });
    } catch (error) {
      console.error('Failed to create food:', error);
      toast.error('Nem sikerült elmenteni az ételt');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmQuantity() {
    if (!savedFood) return;
    if (quantity.grams <= 0) {
      toast.error('Adj meg egy érvényes mennyiséget');
      return;
    }

    if (props.mode === 'pick') {
      const macros = scaleFood(savedFood, quantity.grams);
      props.onPick({
        foodId: savedFood.id,
        name: savedFood.brand ? `${savedFood.name} (${savedFood.brand})` : savedFood.name,
        grams: quantity.grams,
        ...macros,
      });
      onClose();
      return;
    }

    try {
      setSaving(true);
      await addFoodEntry({ date: props.date, mealIndex: props.mealIndex, food: savedFood, grams: quantity.grams, servings: quantity.servings });
      toast.success(`${savedFood.name} hozzáadva`);
      props.onLogged();
      onClose();
    } catch (error) {
      console.error('Failed to add food entry:', error);
      toast.error('Nem sikerült hozzáadni a bejegyzést');
    } finally {
      setSaving(false);
    }
  }

  const busy = analyzing || saving;

  if (savedFood) {
    const preview = scaleFood(savedFood, quantity.grams);
    return (
      <Modal open onClose={onClose} title={savedFood.name} description="Mennyiség" maxWidth="md" closeDisabled={busy}>
        <div className="space-y-4">
          <QuantityInput servingG={savedFood.serving_g} servingLabel={savedFood.serving_label} initial={quantity} onChange={setQuantity} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(preview.kcal)} kcal · F {preview.protein} g · Sz {preview.carbs} g · Zs {preview.fat} g
          </p>
          <button type="button" onClick={handleConfirmQuantity} disabled={busy} className="btn btn-primary w-full">
            {saving ? 'Mentés...' : props.mode === 'pick' ? 'Hozzáadás a recepthez' : 'Hozzáadás a naplóhoz'}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Új élelmiszer" description="100 g-ra vetített tápértékek" maxWidth="lg" closeDisabled={busy}>
      <div className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="btn btn-outline flex w-full items-center justify-center gap-2"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <ImageUp size={16} />}
            {analyzing ? 'Címke elemzése...' : 'Tápértékcímke fotó feltöltése'}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Név" value={fields.name} onChange={(v) => setField('name', v)} placeholder="pl. Zabpehely" />
          <TextField label="Márka (opcionális)" value={fields.brand} onChange={(v) => setField('brand', v)} placeholder="pl. Auchan" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumField label="Energia (kcal)" value={fields.kcal_100} onChange={(v) => setField('kcal_100', v)} />
          <NumField label="Fehérje (g)" value={fields.protein_100} onChange={(v) => setField('protein_100', v)} />
          <NumField label="Szénhidrát (g)" value={fields.carbs_100} onChange={(v) => setField('carbs_100', v)} />
          <NumField label="Zsír (g)" value={fields.fat_100} onChange={(v) => setField('fat_100', v)} />
          <NumField label="Rost (g)" value={fields.fiber_100} onChange={(v) => setField('fiber_100', v)} />
          <NumField label="Cukor (g)" value={fields.sugar_100} onChange={(v) => setField('sugar_100', v)} />
        </div>
        <NumField label="Só (g)" value={fields.salt_100} onChange={(v) => setField('salt_100', v)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <NumField label="Adag mérete (g, opcionális)" value={fields.serving_g} onChange={(v) => setField('serving_g', v)} />
          <TextField label="Adag címke (opcionális)" value={fields.serving_label} onChange={(v) => setField('serving_label', v)} placeholder="pl. 1 szelet" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-outline">
            Mégse
          </button>
          <button type="button" onClick={handleSave} disabled={busy} className="btn btn-primary">
            {saving ? 'Mentés...' : 'Mentés a katalógusba'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{label}</label>
      <input type="text" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" className="input" />
    </div>
  );
}
