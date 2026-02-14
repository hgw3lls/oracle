export const pathGet = (obj: Record<string, unknown>, key: string, fallback = ''): unknown => {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc == null) return fallback;
    if (Array.isArray(acc)) {
      const idx = Number(part);
      return Number.isInteger(idx) ? acc[idx] : fallback;
    }
    if (typeof acc !== 'object') return fallback;
    return (acc as Record<string, unknown>)[part];
  }, obj);
};

export function pathSet<T extends Record<string, any>>(obj: T, key: string, value: unknown): T {
  const parts = key.split('.');
  const cloneNode = (n: any) => (Array.isArray(n) ? [...n] : { ...n });
  const root: any = cloneNode(obj);
  let cursor: any = root;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i];
    const nextKey = parts[i + 1];
    const idx = Number(p);
    const useIndex = Number.isInteger(idx) && String(idx) === p;

    if (useIndex) {
      if (!Array.isArray(cursor)) throw new Error(`Invalid path segment ${p} for non-array`);
      const existing = cursor[idx];
      cursor[idx] = existing != null ? cloneNode(existing) : (Number.isInteger(Number(nextKey)) ? [] : {});
      cursor = cursor[idx];
    } else {
      const existing = cursor[p];
      cursor[p] = existing != null ? cloneNode(existing) : (Number.isInteger(Number(nextKey)) ? [] : {});
      cursor = cursor[p];
    }
  }

  const last = parts[parts.length - 1];
  const lastIdx = Number(last);
  const useLastIndex = Number.isInteger(lastIdx) && String(lastIdx) === last;
  if (useLastIndex) cursor[lastIdx] = value;
  else cursor[last] = value;

  return root as T;
}
