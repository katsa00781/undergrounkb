import { describe, expect, it } from 'vitest';
import {
  buildNutritionGoalsPayload,
  DEFAULT_CHECKLIST_ITEMS,
  NUTRITION_GOAL_FIELDS,
  resolveChecklistItems,
  type NutritionGoalsPatch,
} from '../lifestyleSettings';

const NOW = new Date('2026-11-12T08:00:00.000Z');

describe('buildNutritionGoalsPayload', () => {
  it('csak a kalória-mezőket, a user_id-t és az updated_at-et küldi', () => {
    const payload = buildNutritionGoalsPayload(
      'u1',
      { kcal_goal: 2200, carbs_goal_g: 220, fat_goal_g: 70, activity_factor: 1.55, goal_type: 'maintain' },
      NOW,
    );
    expect(payload).toEqual({
      user_id: 'u1',
      updated_at: NOW.toISOString(),
      kcal_goal: 2200,
      carbs_goal_g: 220,
      fat_goal_g: 70,
      activity_factor: 1.55,
      goal_type: 'maintain',
    });
  });

  it('a mobil mezőit akkor sem viszi át, ha a patch-be belekerülnek', () => {
    const polluted = {
      kcal_goal: 2000,
      checklist_items: null,
      schedule_entries: {},
      custom_schedules: {},
      shift_order: [],
      eating_windows: {},
    } as unknown as NutritionGoalsPatch;
    const payload = buildNutritionGoalsPayload('u1', polluted, NOW);
    expect(Object.keys(payload).sort()).toEqual(['kcal_goal', 'updated_at', 'user_id']);
    expect(payload).not.toHaveProperty('checklist_items');
    expect(payload).not.toHaveProperty('schedule_entries');
    expect(payload).not.toHaveProperty('custom_schedules');
  });

  it('a nem megadott (undefined) mezőt kihagyja, a null-t megtartja', () => {
    const payload = buildNutritionGoalsPayload('u1', { kcal_goal: null, fat_goal_g: undefined }, NOW);
    expect(payload).toHaveProperty('kcal_goal', null);
    expect(payload).not.toHaveProperty('fat_goal_g');
  });

  it('a whitelist pontosan az öt kalória-mező', () => {
    expect([...NUTRITION_GOAL_FIELDS]).toEqual(['kcal_goal', 'carbs_goal_g', 'fat_goal_g', 'activity_factor', 'goal_type']);
  });
});

describe('resolveChecklistItems', () => {
  it('NULL → az alapértelmezett 5 feladat, a mobil kulcsaival', () => {
    expect(resolveChecklistItems(null).map((i) => i.key)).toEqual([
      'ate_in_window',
      'protein_hit',
      'trained',
      'walked',
      'slept_well',
    ]);
    expect(resolveChecklistItems(undefined)).toHaveLength(DEFAULT_CHECKLIST_ITEMS.length);
  });

  it('az üres tömb szándékosan üres lista, nem alap lista', () => {
    expect(resolveChecklistItems([])).toEqual([]);
  });

  it('a megadott sorrendet tartja, az érvénytelen elemeket kihagyja', () => {
    const raw = [
      { key: 'custom_1731400000000', label: 'Nyújtás', icon: 'body-outline' },
      { key: 'walked', label: 'Séta', icon: 'walk-outline' },
      { key: 'broken' },
      'szöveg',
    ];
    expect(resolveChecklistItems(raw)).toEqual([
      { key: 'custom_1731400000000', label: 'Nyújtás', icon: 'body-outline' },
      { key: 'walked', label: 'Séta', icon: 'walk-outline' },
    ]);
  });

  it('nem tömb (sérült) értékre az alap listára esik vissza, és nem a konstanst adja ki', () => {
    const items = resolveChecklistItems({ foo: 1 });
    expect(items).toHaveLength(5);
    items[0].label = 'átírva';
    expect(DEFAULT_CHECKLIST_ITEMS[0].label).toBe('Az ablakban ettem');
  });
});
