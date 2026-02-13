import { describe, expect, it } from 'vitest';
import { generateHarmonyPalette } from './colorWheel';

describe('generateHarmonyPalette', () => {
  it('returns requested color count', () => {
    const out = generateHarmonyPalette('#6633ff', 'tetradic', 5, 0);
    expect(out).toHaveLength(5);
  });
});
