import { describe, expect, it } from 'vitest';
import {
  ageFromBirthdate,
  applyGoal,
  entryTotals,
  macroTargets,
  mifflinStJeor,
  missingBmrInputs,
  parseGender,
  scaleFood,
  scaleMacros,
  sumMacros,
  tdeeFromActiveEnergy,
  tdeeFromActivity,
} from '../nutritionTargets';
import { macrosPerServing, gramsPerServing, recipeKind, recipeKindLabel } from '../recipes';
import { makeFood, makeFoodLogEntry } from './fixtures';

describe('parseGender', () => {
  it('felismeri a magyar és angol nem-jelöléseket', () => {
    expect(parseGender('férfi')).toBe('male');
    expect(parseGender('Female')).toBe('female');
    expect(parseGender('nő')).toBe('female');
    expect(parseGender(null)).toBeNull();
    expect(parseGender('other')).toBeNull();
  });
});

describe('ageFromBirthdate', () => {
  it('kiszámolja a betöltött életkort', () => {
    const now = new Date('2026-06-15');
    expect(ageFromBirthdate('2000-06-14', now)).toBe(26);
    expect(ageFromBirthdate('2000-06-16', now)).toBe(25);
  });

  it('null-t ad hiányzó vagy érvénytelen dátumra', () => {
    expect(ageFromBirthdate(null)).toBeNull();
    expect(ageFromBirthdate('not-a-date')).toBeNull();
  });
});

describe('mifflinStJeor', () => {
  it('kiszámolja a BMR-t férfira és nőre', () => {
    const male = mifflinStJeor({ weightKg: 80, heightCm: 180, age: 30, gender: 'male' });
    const female = mifflinStJeor({ weightKg: 60, heightCm: 165, age: 30, gender: 'female' });
    expect(male).toBe(10 * 80 + 6.25 * 180 - 5 * 30 + 5);
    expect(female).toBe(Math.round(10 * 60 + 6.25 * 165 - 5 * 30 - 161));
  });

  it('null-t ad, ha bármelyik bemenet hiányzik – nem tippel', () => {
    expect(mifflinStJeor({ weightKg: null, heightCm: 180, age: 30, gender: 'male' })).toBeNull();
    expect(mifflinStJeor({ weightKg: 80, heightCm: null, age: 30, gender: 'male' })).toBeNull();
    expect(mifflinStJeor({ weightKg: 80, heightCm: 180, age: null, gender: 'male' })).toBeNull();
    expect(mifflinStJeor({ weightKg: 80, heightCm: 180, age: 30, gender: null })).toBeNull();
  });
});

describe('missingBmrInputs', () => {
  it('felsorolja a konkrétan hiányzó mezőket', () => {
    expect(missingBmrInputs({ weightKg: null, heightCm: null, age: null, gender: null })).toEqual([
      'testsúly',
      'magasság',
      'születési dátum',
      'nem',
    ]);
    expect(missingBmrInputs({ weightKg: 80, heightCm: 180, age: 30, gender: 'male' })).toEqual([]);
  });
});

describe('tdeeFromActivity / tdeeFromActiveEnergy', () => {
  it('szorzóval és mért aktív energiával is számol', () => {
    expect(tdeeFromActivity(1700, 1.4)).toBe(Math.round(1700 * 1.4));
    expect(tdeeFromActiveEnergy(1700, 350)).toBe(2050);
  });
});

describe('applyGoal', () => {
  it('alkalmazza a cut/maintain/bulk szorzót', () => {
    expect(applyGoal(2000, 'cut')).toBe(1700);
    expect(applyGoal(2000, 'maintain')).toBe(2000);
    expect(applyGoal(2000, 'bulk')).toBe(2200);
  });
});

describe('macroTargets', () => {
  it('a fehérje a sáv közepe, a zsír min. 0.8 g/ttkg, a szénhidrát a maradék', () => {
    const macros = macroTargets(2200, 80, 150, 170);
    expect(macros.protein).toBe(160);
    expect(macros.fat).toBe(64);
    const remaining = 2200 - 160 * 4 - 64 * 9;
    expect(macros.carbs).toBe(Math.round(remaining / 4));
  });

  it('a zsír legalább 40 g akkor is, ha a testsúly ezt nem indokolná', () => {
    const macros = macroTargets(1200, 40, 100, 120);
    expect(macros.fat).toBe(40);
  });

  it('a szénhidrát nem megy 0 alá extrém alacsony kcal-keretnél', () => {
    const macros = macroTargets(500, 100, 150, 170);
    expect(macros.carbs).toBe(0);
  });
});

describe('scaleFood / scaleMacros / sumMacros', () => {
  it('100 g-ra vetített értéket skáláz a megadott grammra', () => {
    const food = makeFood({ kcal_100: 389, protein_100: 16.9, carbs_100: 66.3, fat_100: 6.9 });
    const macros = scaleFood(food, 50);
    expect(macros.kcal).toBeCloseTo(194.5, 5);
    expect(macros.protein).toBeCloseTo(8.5, 5);
  });

  it('arányosan skáláz egy makró-objektumot', () => {
    const scaled = scaleMacros({ kcal: 400, protein: 20, carbs: 40, fat: 10 }, 0.5);
    expect(scaled).toEqual({ kcal: 200, protein: 10, carbs: 20, fat: 5 });
  });

  it('összeadja a makrókat', () => {
    const total = sumMacros([
      { kcal: 100, protein: 10, carbs: 10, fat: 5 },
      { kcal: 50, protein: 5, carbs: 5, fat: 2 },
    ]);
    expect(total).toEqual({ kcal: 150, protein: 15, carbs: 15, fat: 7 });
  });
});

describe('entryTotals', () => {
  it('összegzi a napló-bejegyzések makróit', () => {
    const entries = [
      makeFoodLogEntry({ kcal: 300, protein: 20, carbs: 30, fat: 10 }),
      makeFoodLogEntry({ kcal: 200, protein: 15, carbs: 20, fat: 5 }),
    ];
    expect(entryTotals(entries)).toEqual({ kcal: 500, protein: 35, carbs: 50, fat: 15 });
  });

  it('üres listára nulla összeget ad', () => {
    expect(entryTotals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('a gramm nélküli, Health-ből szinkronizált sorokat is beszámítja', () => {
    const entries = [
      makeFoodLogEntry({ kcal: 300, protein: 20, carbs: 30, fat: 10 }),
      makeFoodLogEntry({
        grams: null,
        source: 'healthkit',
        external_id: 'yazio-1',
        source_app: 'com.yazio.ios.YAZIO',
        kcal: 150,
        protein: 5,
        carbs: 20,
        fat: 4,
      }),
    ];
    expect(entryTotals(entries)).toEqual({ kcal: 450, protein: 25, carbs: 50, fat: 14 });
  });
});

describe('recipes helperek', () => {
  it('recipeKind / recipeKindLabel normalizál és címkéz', () => {
    expect(recipeKind('recipe')).toBe('recipe');
    expect(recipeKind('anything-else')).toBe('meal');
    expect(recipeKindLabel('recipe')).toBe('Recept');
    expect(recipeKindLabel('meal')).toBe('Étkezés');
  });

  it('macrosPerServing és gramsPerServing egy adagra osztja a teljes mennyiséget', () => {
    const recipe = {
      id: 'r1',
      user_id: 'u1',
      kind: 'recipe',
      name: 'Bolognai',
      servings: 4,
      notes: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      items: [],
      totals: { kcal: 2000, protein: 200, carbs: 160, fat: 80 },
      totalGrams: 1200,
    };
    expect(macrosPerServing(recipe)).toEqual({ kcal: 500, protein: 50, carbs: 40, fat: 20 });
    expect(gramsPerServing(recipe)).toBe(300);
  });
});
