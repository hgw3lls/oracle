import type { SchemaV2 } from '@/core/schema/schemaV2';

const KEY = 'hypnagnosis-oracle-v3';

// Bump this whenever the storage wrapper shape changes.
export const STORAGE_VERSION = 2;

export type StoredStateV1 = {
  storageVersion: number;
  savedAt: string;
  schema: SchemaV2;
};

export function saveState(schema: SchemaV2) {
  const payload: StoredStateV1 = {
    storageVersion: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    schema,
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadState(): unknown {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearState() {
  localStorage.removeItem(KEY);
}

export function getStorageKey() {
  return KEY;
}
