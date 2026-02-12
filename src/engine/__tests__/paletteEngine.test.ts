import { describe, expect, it } from 'vitest';
import { extractDominantPalette, toRisoPlates } from '../paletteEngine';

describe('paletteEngine', () => {
  it('extracts deterministic palette', () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      255, 0, 0, 255,
      0, 0, 255, 255,
      0, 0, 255, 255,
    ]);
    const imageData = { data, width: 2, height: 2 };
    const first = extractDominantPalette(imageData, 2, 'kmeans');
    const second = extractDominantPalette(imageData, 2, 'kmeans');
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
  });

  it('converts palette to riso plates with keyline first', () => {
    const plates = toRisoPlates([{ hex: '#111111', weight: 0.6 }, { hex: '#eeeeee', weight: 0.4 }]);
    expect(plates[0].role).toBe('keyline');
  });
});
