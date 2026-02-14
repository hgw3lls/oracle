import { beforeEach, describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '@/core/schema/defaults';
import { getStorageKey, loadState, saveState, STORAGE_VERSION } from './persistence';

describe('state/persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('serializes SchemaV2 to localStorage with wrapper + version stamp', () => {
    const schema = defaultSchemaV2();
    saveState(schema);

    const raw = localStorage.getItem(getStorageKey());
    expect(raw).toBeTypeOf('string');

    const parsed = JSON.parse(raw as string);
    expect(parsed.storageVersion).toBe(STORAGE_VERSION);
    expect(parsed.schema.version).toBe(2);
  });

  it('loads legacy raw-schema payloads (back-compat)', () => {
    const schema = defaultSchemaV2();
    localStorage.setItem(getStorageKey(), JSON.stringify(schema));

    const loaded = loadState() as any;
    expect(loaded.version).toBe(2);
    expect(loaded.MODULES).toBeDefined();
  });
});
