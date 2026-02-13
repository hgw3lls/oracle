import type { Harmony } from '../../schema/schemaV2';

type Hsl = { h: number; s: number; l: number };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const wrapHue = (h: number) => ((h % 360) + 360) % 360;

export function hexToHsl(hex: string): Hsl {
  const clean = hex.replace('#', '');
  const int = Number.parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: wrapHue(h), s: s * 100, l: l * 100 };
}

export function hslToHex(hsl: Hsl): string {
  const h = wrapHue(hsl.h);
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateHarmonyPalette(
  baseHex: string,
  harmony: Harmony,
  count: number,
  rotateDeg: number,
): string[] {
  const base = hexToHsl(baseHex);
  const n = Math.max(1, count);
  const start = wrapHue(base.h + rotateDeg);

  const huePattern = (() => {
    switch (harmony) {
      case 'complementary': return [0, 180];
      case 'analogous': return [-30, 0, 30, 60, -60];
      case 'triadic': return [0, 120, 240];
      case 'split_complementary': return [0, 150, 210];
      case 'tetradic': return [0, 90, 180, 270];
      case 'monochrome': return [0];
      default: return [0];
    }
  })();

  return Array.from({ length: n }, (_, i) => {
    if (harmony === 'monochrome') {
      const lightShift = ((i / Math.max(1, n - 1)) - 0.5) * 30;
      return hslToHex({ h: start, s: base.s, l: clamp(base.l + lightShift, 8, 92) });
    }
    const h = wrapHue(start + huePattern[i % huePattern.length]);
    return hslToHex({ h, s: base.s, l: base.l });
  });
}
