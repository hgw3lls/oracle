import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../../schema/hypnagnosisSchemaV2';
import { compileFrameSeries, compilePromptV2 } from '../compilePromptV2';

const schema = {
  ...defaultSchemaV2,
  subject: 'Ash-fall cathedrals',
  seed: 'deterministic-seed-001',
  constraints: {
    require: ['clear foreground subject', 'readable depth layers'],
    forbid: ['watermarks', 'text overlays'],
  },
  animation: {
    enabled: true,
    frames: 4,
    curve: 's-curve' as const,
    timeline: [
      { at: 0, overrides: { mutateStrength: 20, hallucination: 40 } },
      { at: 1, overrides: { mutateStrength: 80, hallucination: 90 } },
    ],
  },
};

describe('compilePromptV2', () => {
  it('is deterministic for fixed seed and identical schema', () => {
    const a = compilePromptV2(schema).compiledPrompt;
    const b = compilePromptV2(schema).compiledPrompt;
    expect(a).toBe(b);
  });

  it('injects constraints footer', () => {
    const output = compilePromptV2(schema).compiledPrompt;
    expect(output).toContain('CONSTRAINTS FOOTER');
    expect(output).toContain('REQUIRE: clear foreground subject; readable depth layers');
    expect(output).toContain('FORBID: watermarks; text overlays');
  });

  it('produces deterministic frame series from animation timeline', () => {
    const first = compileFrameSeries(schema);
    const second = compileFrameSeries(schema);

    expect(first).toEqual(second);
    expect(first).toHaveLength(4);
    expect(first[0].frameState.hallucination).toBeCloseTo(40, 6);
    expect(first[3].frameState.hallucination).toBeCloseTo(90, 6);
    expect(first[1].compiledPrompt).toContain('Render intent:');
  });
});
