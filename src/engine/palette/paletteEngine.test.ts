import { describe, expect, it } from 'vitest';
import { toRisoPlates } from './paletteEngine';

describe('toRisoPlates', () => {
  it('assigns darkest swatch as keyline', () => {
    const plates = toRisoPlates([
      { hex: '#f0f0f0', weight: 0.5 },
      { hex: '#111111', weight: 0.3 },
      { hex: '#888888', weight: 0.2 },
    ]);

    const keyline = plates.find((p) => p.role === 'keyline');
    expect(keyline?.hex).toBe('#111111');
  });
});
