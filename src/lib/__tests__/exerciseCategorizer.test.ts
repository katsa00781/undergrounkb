import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  categorizeExercises,
  getRandomExercise,
  getFirstAvailableExercise,
} from '../workoutGenerator/exerciseCategorizer';
import { makeExercise } from './fixtures';

describe('categorizeExercises', () => {
  it('a térddomináns bilaterális mintát a megfelelő kategóriába sorolja', () => {
    const squat = makeExercise({ id: 'squat', movement_pattern: 'knee_dominant_bilateral', name: 'Goblet guggolás' });
    const result = categorizeExercises([squat]);

    expect(result['térddomináns_bi'].map(e => e.id)).toContain('squat');
    expect(result['térddomináns_uni']).toHaveLength(0);
  });

  it('FMS-kategóriás gyakorlatot a bemelegítés, core és fms_korrekció kosarakba is beteszi', () => {
    const fms = makeExercise({ id: 'fms1', category: 'fms', movement_pattern: 'stability_correction' });
    const result = categorizeExercises([fms]);

    expect(result['bemelegítés'].map(e => e.id)).toContain('fms1');
    expect(result['core'].map(e => e.id)).toContain('fms1');
    expect(result['fms_korrekció'].map(e => e.id)).toContain('fms1');
  });

  it('csípődomináns gyakorlatot a szöveg alapján hajlított vagy nyújtott alkategóriába tesz', () => {
    const bridge = makeExercise({ id: 'bridge', movement_pattern: 'hip_dominant_bilateral', name: 'Csípő híd' });
    const swing = makeExercise({ id: 'swing', movement_pattern: 'hip_dominant_bilateral', name: 'Kettlebell lengetés' });
    const result = categorizeExercises([bridge, swing]);

    expect(result['csípődomináns_hajlított'].map(e => e.id)).toContain('bridge');
    expect(result['csípődomináns_nyújtott'].map(e => e.id)).toContain('swing');
    expect(result['csípődomináns_hajlított'].map(e => e.id)).not.toContain('swing');
  });

  it('a cipelés kategóriát kulcsszó alapján ismeri fel (carry/farmer/cipel)', () => {
    const carry = makeExercise({ id: 'carry', name: 'Farmer carry', movement_pattern: 'core_other' });
    const result = categorizeExercises([carry]);

    expect(result['cipelés'].map(e => e.id)).toContain('carry');
  });

  it('ugyanazt a gyakorlatot nem duplikálja egy kategórián belül', () => {
    const dup = makeExercise({ id: 'dup', category: 'fms', movement_pattern: 'stability_correction', name: 'stabil core plank' });
    const result = categorizeExercises([dup, dup]);

    const coreIds = result['core'].map(e => e.id).filter(id => id === 'dup');
    expect(coreIds).toHaveLength(1);
  });

  it('üres bemenetre minden kategória üres tömb', () => {
    const result = categorizeExercises([]);
    expect(Object.values(result).every(arr => Array.isArray(arr) && arr.length === 0)).toBe(true);
  });
});

describe('getRandomExercise', () => {
  afterEach(() => vi.restoreAllMocks());

  it('null-t ad vissza, ha a kategória üres vagy hiányzik', () => {
    expect(getRandomExercise({ foo: [] }, 'foo')).toBeNull();
    expect(getRandomExercise({}, 'nincs')).toBeNull();
  });

  it('a Math.random alapján determinisztikusan választ', () => {
    const a = makeExercise({ id: 'a' });
    const b = makeExercise({ id: 'b' });
    vi.spyOn(Math, 'random').mockReturnValue(0); // első elem
    expect(getRandomExercise({ k: [a, b] }, 'k')?.id).toBe('a');
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // utolsó elem
    expect(getRandomExercise({ k: [a, b] }, 'k')?.id).toBe('b');
  });
});

describe('getFirstAvailableExercise', () => {
  it('az első nem üres kategóriából ad vissza gyakorlatot', () => {
    const x = makeExercise({ id: 'x' });
    const result = getFirstAvailableExercise({ a: [], b: [x], c: [] }, ['a', 'b', 'c']);
    expect(result?.id).toBe('x');
  });

  it('null-t ad vissza, ha minden megadott kategória üres', () => {
    expect(getFirstAvailableExercise({ a: [], b: [] }, ['a', 'b'])).toBeNull();
  });
});
