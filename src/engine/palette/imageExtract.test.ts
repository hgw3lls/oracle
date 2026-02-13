import { describe, expect, it } from 'vitest';
import { extractDominantPalette } from './imageExtract';

function makeImageData(): ImageData {
  const data = new Uint8ClampedArray([
    255, 0, 0, 255,
    255, 0, 0, 255,
    0, 255, 0, 255,
    0, 255, 0, 255,
  ]);
  return { data, width: 2, height: 2, colorSpace: 'srgb' } as ImageData;
}

describe('extractDominantPalette', () => {
  it('returns k colors and normalized weights', () => {
    const palette = extractDominantPalette(makeImageData(), 2, 'kmeans');
    expect(palette).toHaveLength(2);
    const sum = palette.reduce((s, p) => s + p.weight, 0);
    expect(sum).toBeGreaterThan(0.99);
    expect(sum).toBeLessThan(1.01);
  });
});
