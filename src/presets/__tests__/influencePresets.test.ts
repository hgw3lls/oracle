import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../../schema/hypnagnosisSchemaV2';
import {
  INFLUENCE_PRESETS,
  INFLUENCE_PRESET_MAP,
  applyInfluencePreset,
  randomizeInfluenceWithinBounds,
  PRINT_PURITY,
  isInfluenceWeightInBounds,
} from '../influencePresets';

describe('influencePresets', () => {
  it('keeps preset weights in bounds', () => {
    INFLUENCE_PRESETS.forEach((preset) => {
      Object.values(preset.influenceWeights).forEach((value) => expect(isInfluenceWeightInBounds(value)).toBe(true));
    });
  });

  it('exports stable map', () => {
    expect(INFLUENCE_PRESET_MAP.BRUS_LOMBARDI.name).toBe('BRUS_LOMBARDI');
    expect(INFLUENCE_PRESET_MAP.PRINT_PURITY.name).toBe('PRINT_PURITY');
  });

  it('merges non-destructively', () => {
    const base = { ...defaultSchemaV2, subject: 'Keep me' };
    const merged = applyInfluencePreset(base, PRINT_PURITY);
    expect(merged.subject).toBe('Keep me');
    expect(merged['INFLUENCE-ENGINE']['INFLUENCE-WEIGHTS']['print-material-field']).toBeGreaterThan(0);
  });

  it('randomizes with bounds [0..100]', () => {
    const randomized = randomizeInfluenceWithinBounds(defaultSchemaV2, () => 1);
    Object.values(randomized['INFLUENCE-ENGINE']['INFLUENCE-WEIGHTS']).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });
});
