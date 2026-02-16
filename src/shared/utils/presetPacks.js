const STORAGE_VERSION = 1;

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizePack = (pack) => {
  if (!pack || typeof pack !== 'object') return null;
  const name = typeof pack.name === 'string' ? pack.name.trim() : '';
  if (!name) return null;
  const params = pack.params && typeof pack.params === 'object' ? pack.params : {};
  const updatedAt = typeof pack.updatedAt === 'number' ? pack.updatedAt : Date.now();
  const id = typeof pack.id === 'string' && pack.id ? pack.id : `${name.toLowerCase().replace(/\s+/g, '-')}-${updatedAt}`;
  return { id, name, params, updatedAt };
};

const normalizePacks = (packs) =>
  Array.isArray(packs)
    ? packs.map(normalizePack).filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt)
    : [];

export function loadPresetPacks(storageKey) {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];

  const parsed = safeParse(raw);
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    const migrated = normalizePacks(parsed);
    window.localStorage.setItem(storageKey, JSON.stringify({ version: STORAGE_VERSION, packs: migrated }));
    return migrated;
  }

  if (typeof parsed === 'object' && parsed) {
    const version = typeof parsed.version === 'number' ? parsed.version : 0;
    const packs = normalizePacks(parsed.packs);

    if (version !== STORAGE_VERSION) {
      window.localStorage.setItem(storageKey, JSON.stringify({ version: STORAGE_VERSION, packs }));
    }

    return packs;
  }

  return [];
}

const writePresetPacks = (storageKey, packs) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(storageKey, JSON.stringify({ version: STORAGE_VERSION, packs: normalizePacks(packs) }));
};

export function savePresetPack(storageKey, presetName, params) {
  const name = typeof presetName === 'string' ? presetName.trim() : '';
  if (!name) return loadPresetPacks(storageKey);

  const existing = loadPresetPacks(storageKey);
  const now = Date.now();

  const next = [
    {
      id: `${name.toLowerCase().replace(/\s+/g, '-')}-${now}`,
      name,
      params: params && typeof params === 'object' ? params : {},
      updatedAt: now,
    },
    ...existing.filter((pack) => pack.name.toLowerCase() !== name.toLowerCase()),
  ];

  writePresetPacks(storageKey, next);
  return normalizePacks(next);
}

export function deletePresetPack(storageKey, presetId) {
  const existing = loadPresetPacks(storageKey);
  const next = existing.filter((pack) => pack.id !== presetId);
  writePresetPacks(storageKey, next);
  return next;
}
