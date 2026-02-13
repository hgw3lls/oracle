import type { SchemaV2 } from '../schema/schemaV2';

const KEY = 'hypnagnosis-oracle-v2';

export function saveState(schema: SchemaV2) {
  localStorage.setItem(KEY, JSON.stringify(schema));
}

export function loadState(): unknown {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}
