import { describe, expect, it } from 'vitest';
import { generateHarmonyPalette, hexToHsl, hslToHex } from '../colorWheel';

describe('colorWheel', () => {
  it('roundtrips hex/hsl', () => {
    const hsl = hexToHsl('#336699');
    const hex = hslToHex(hsl.h, hsl.s, hsl.l);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('generates requested palette length', () => {
    const palette = generateHarmonyPalette('#ff0000', 'triadic', 4, 0);
    expect(palette).toHaveLength(4);
  });
});
