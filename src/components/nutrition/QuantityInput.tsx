import { useState } from 'react';

export type Quantity = {
  /** A ténylegesen elfogyasztott mennyiség grammban – ebből számolunk makrót. */
  grams: number;
  /** Hány adag, ha adag módban vagyunk. `null` = a felhasználó grammban adta meg. */
  servings: number | null;
};

interface QuantityInputProps {
  /** Egy adag tömege grammban. `null` → nincs értelmezhető adag, csak gramm. */
  servingG: number | null;
  /** Az adag megnevezése a katalógusból, pl. „1 szelet". */
  servingLabel?: string | null;
  /** Kezdőérték – a komponens ezután saját state-ből dolgozik (`key`-jel resetelhető). */
  initial: Quantity;
  onChange: (next: Quantity) => void;
}

function parseNum(value: string): number {
  const n = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/**
 * Mennyiség megadása adagban VAGY grammban.
 *
 * Ha az ételnek van értelmezhető adagja (`serving_g`), alapból adagban kérdezünk –
 * „1 adag" többet mond, mint „60 g". A gramm fül bármikor elérhető, mert az adag
 * csak egy tipikus kiszerelés: lehet, hogy nem pont annyit ettünk.
 */
export function QuantityInput({ servingG, servingLabel, initial, onChange }: QuantityInputProps) {
  const hasServing = !!servingG && servingG > 0;
  const startInServings = hasServing && initial.servings != null;

  const [unit, setUnit] = useState<'serving' | 'g'>(startInServings ? 'serving' : 'g');
  const [text, setText] = useState(startInServings ? formatNum(initial.servings ?? 1) : formatNum(initial.grams));

  function emit(nextUnit: 'serving' | 'g', nextText: string) {
    const n = parseNum(nextText);
    if (nextUnit === 'serving' && hasServing) {
      onChange({ grams: Math.round(n * servingG! * 10) / 10, servings: n });
    } else {
      onChange({ grams: n, servings: null });
    }
  }

  function handleText(value: string) {
    setText(value);
    emit(unit, value);
  }

  /** Fülváltáskor a MENNYISÉG marad, csak a mértékegység vált. */
  function switchUnit(next: 'serving' | 'g') {
    if (next === unit || !hasServing) return;
    const n = parseNum(text);
    const nextText = next === 'serving' ? formatNum(n / servingG!) : formatNum(n * servingG!);
    setUnit(next);
    setText(nextText);
    emit(next, nextText);
  }

  const amount = parseNum(text);
  const grams = unit === 'serving' && hasServing ? amount * servingG! : amount;
  const servings = hasServing ? grams / servingG! : null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="input flex flex-1 items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={text}
            onChange={(e) => handleText(e.target.value)}
            placeholder={unit === 'serving' ? '1' : '100'}
            className="w-full border-none bg-transparent p-0 font-semibold text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
          />
          <span className="shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">
            {unit === 'serving' ? 'adag' : 'g'}
          </span>
        </div>

        {hasServing ? (
          <div className="flex shrink-0 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
            <UnitTab label="adag" active={unit === 'serving'} onClick={() => switchUnit('serving')} />
            <UnitTab label="g" active={unit === 'g'} onClick={() => switchUnit('g')} />
          </div>
        ) : null}
      </div>

      {hasServing ? (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {servingLabel ? `${servingLabel} · ` : ''}1 adag = {formatNum(servingG!)} g
          {unit === 'serving' ? ` · összesen ${formatNum(grams)} g` : ` · ez ${formatNum(servings ?? 0)} adag`}
        </p>
      ) : null}
    </div>
  );
}

function UnitTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'bg-primary-600 text-white dark:text-gray-900'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
