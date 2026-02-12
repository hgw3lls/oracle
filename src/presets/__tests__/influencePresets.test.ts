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
  it('keeps all preset influence weights within [0, 100]', () => {
    INFLUENCE_PRESETS.forEach((preset) => {
      Object.values(preset.influenceWeights).forEach((value) => {
        expect(isInfluenceWeightInBounds(value)).toBe(true);
      });
    });
  });

  it('exports presets by stable named map', () => {
    expect(INFLUENCE_PRESET_MAP.BRUS_LOMBARDI.name).toBe('BRUS_LOMBARDI');
    expect(INFLUENCE_PRESET_MAP.BACON_COLLAPSE.name).toBe('BACON_COLLAPSE');
    expect(INFLUENCE_PRESET_MAP.BASQUIAT_OCCULT.name).toBe('BASQUIAT_OCCULT');
    expect(INFLUENCE_PRESET_MAP.PRINT_PURITY.name).toBe('PRINT_PURITY');
  });

  it('merges preset into current schema non-destructively', () => {
    const base = {
      ...defaultSchemaV2,
      subject: 'Custom Subject',
      notes: 'Keep this note',
      styleTokens: ['STYLE.HYPNAGOGIC'],
      seed: 'custom-seed',
      batchPrefix: 'custom',
    };

    const merged = applyInfluencePreset(base, PRINT_PURITY);

    expect(merged.subject).toBe('Custom Subject');
    expect(merged.notes).toBe('Keep this note');
    expect(merged.seed).toBe('custom-seed');
    expect(merged.batchPrefix).toBe('custom');
    expect(merged.animation).toEqual(base.animation);
    expect(merged.styleTokens).toContain('STYLE.HYPNAGOGIC');
    expect(merged.styleTokens).toContain('STYLE.PRINT');
    expect(merged.hallucination).toBeGreaterThanOrEqual(0);
    expect(merged.hallucination).toBeLessThanOrEqual(100);
  });

  it('randomizes influence fields within +/-10 and global [0,100] bounds', () => {
    const base = {
      ...defaultSchemaV2,
      hallucination: 50,
      mutateStrength: 50,
      humanizerLevel: 50,
      humanizerMin: 40,
      humanizerMax: 60,
    };

    const rng = () => 1; // +10 perturbation path
    const randomized = randomizeInfluenceWithinBounds(base, rng);

    expect(randomized.hallucination).toBe(60);
    expect(randomized.mutateStrength).toBe(60);
    expect(randomized.humanizerLevel).toBe(60);
    expect(randomized.humanizerMin).toBe(50);
    expect(randomized.humanizerMax).toBe(70);

    expect(randomized.hallucination).toBeGreaterThanOrEqual(0);
    expect(randomized.hallucination).toBeLessThanOrEqual(100);
    expect(randomized.humanizerMin).toBeGreaterThanOrEqual(0);
    expect(randomized.humanizerMax).toBeLessThanOrEqual(100);
    expect(randomized.humanizerMax).toBeGreaterThanOrEqual(randomized.humanizerMin);

    expect(Math.abs(randomized.hallucination - base.hallucination)).toBeLessThanOrEqual(10);
    expect(Math.abs(randomized.mutateStrength - base.mutateStrength)).toBeLessThanOrEqual(10);
    expect(Math.abs(randomized.humanizerLevel - base.humanizerLevel)).toBeLessThanOrEqual(10);

    const randomizedLow = randomizeInfluenceWithinBounds({ ...base, hallucination: 4 }, () => 0);
    expect(randomizedLow.hallucination).toBe(0);
  });
});
