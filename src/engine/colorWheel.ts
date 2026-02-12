import type { WheelHarmony } from '../schema/hypnagnosisSchemaV2';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const hexToHsl = (hex: string) => {
  const safe = hex.replace('#', '');
  const n = parseInt(safe.length === 3 ? safe.split('').map((c) => c + c).join('') : safe, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = 60 * (((g - b) / d) % 6); break;
      case g: h = 60 * ((b - r) / d + 2); break;
      default: h = 60 * ((r - g) / d + 4); break;
    }
  }
  return { h: (h + 360) % 360, s, l };
};

export const hslToHex = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0; let g = 0; let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const generateHarmonyPalette = (baseHex: string, harmony: WheelHarmony, count: number, rotateDeg: number) => {
  const { h, s, l } = hexToHsl(baseHex);
  const base = (h + rotateDeg + 360) % 360;
  const steps: Record<WheelHarmony, number[]> = {
    complementary: [0, 180],
    analogous: [0, 30, -30, 60, -60],
    triadic: [0, 120, 240],
    split_complementary: [0, 150, 210],
    tetradic: [0, 90, 180, 270],
    monochrome: [0, 0, 0, 0, 0],
  };
  const offsets = steps[harmony];
  return Array.from({ length: Math.max(1, count) }, (_, idx) => {
    const hh = (base + offsets[idx % offsets.length] + 360) % 360;
    const sat = harmony === 'monochrome' ? clamp(s + ((idx - count / 2) * 0.08), 0.2, 0.95) : s;
    const lig = harmony === 'monochrome' ? clamp(l + ((idx - count / 2) * 0.06), 0.15, 0.9) : l;
    return hslToHex(hh, sat, lig);
  });
};
