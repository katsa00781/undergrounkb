import { describe, expect, it } from 'vitest';
import { entrySourceLabel, isSyncedEntry } from '../foodLogSource';
import { makeFoodLogEntry } from './fixtures';

describe('isSyncedEntry', () => {
  it('a healthkit forrású sort szinkronizáltnak tekinti', () => {
    expect(isSyncedEntry(makeFoodLogEntry({ source: 'healthkit', grams: null }))).toBe(true);
  });

  it('a kézi sort nem tekinti szinkronizáltnak', () => {
    expect(isSyncedEntry(makeFoodLogEntry())).toBe(false);
  });
});

describe('entrySourceLabel', () => {
  it('a com.yazio bundle id-ra „Yazio” címkét ad', () => {
    expect(entrySourceLabel(makeFoodLogEntry({ source: 'healthkit', source_app: 'com.yazio.ios.YAZIO' }))).toBe(
      'Yazio',
    );
  });

  it('más vagy hiányzó forrásappra „Health” címkét ad', () => {
    expect(entrySourceLabel(makeFoodLogEntry({ source: 'healthkit', source_app: 'com.other.app' }))).toBe('Health');
    expect(entrySourceLabel(makeFoodLogEntry({ source: 'healthkit', source_app: null }))).toBe('Health');
  });
});
