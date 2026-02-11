export const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(n) || 0));

export const hashSeed = (seed) => {
  const txt = String(seed || 'oracle');
  let h = 1779033703 ^ txt.length;
  for (let i = 0; i < txt.length; i += 1) {
    h = Math.imul(h ^ txt.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
};

export const mulberry32 = (a) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const rngFromSeed = (seed) => mulberry32(hashSeed(seed)());

export const pick = (rng, options) => options[Math.floor(rng() * options.length)] || options[0];
