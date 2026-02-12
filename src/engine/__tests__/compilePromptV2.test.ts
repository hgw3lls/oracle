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
    keyframes: [],
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

  it('omits palette footer when MODULES.PALETTE is false', () => {
    const output = compilePromptV2({
      ...schema,
      MODULES: {
        ...schema.MODULES,
        PALETTE: false,
      },
    });

    expect(output.compiledPrompt).not.toContain('PALETTE FOOTER');
    expect(output.debugSections.find((section) => section.title === 'PALETTE FOOTER')).toBeUndefined();
  });

  it('omits influence behavior text when MODULES.INFLUENCE_ENGINE is false', () => {
    const output = compilePromptV2({
      ...schema,
      MODULES: {
        ...schema.MODULES,
        INFLUENCE_ENGINE: false,
      },
    });

    expect(output.compiledPrompt).not.toContain('Render intent:');
    expect(output.compiledPrompt).not.toContain('spray turbulence in peripheral textures');
    expect(output.debugSections.find((section) => section.title === 'INFLUENCE TRANSLATION')).toBeUndefined();
  });

  it('omits constraints footer when MODULES.CONSTRAINTS is false', () => {
    const output = compilePromptV2({
      ...schema,
      MODULES: {
        ...schema.MODULES,
        CONSTRAINTS: false,
      },
    });

    expect(output.compiledPrompt).not.toContain('CONSTRAINTS FOOTER');
    expect(output.compiledPrompt).not.toContain('REQUIRE: clear foreground subject; readable depth layers');
    expect(output.debugSections.find((section) => section.title === 'CONSTRAINTS FOOTER')).toBeUndefined();
  });

  it('reports included and skipped modules in debug sections', () => {
    const output = compilePromptV2({
      ...schema,
      MODULES: {
        ...schema.MODULES,
        INFLUENCE_ENGINE: false,
        CONSTRAINTS: false,
      },
    });

    const moduleSection = output.debugSections.find((section) => section.title === 'MODULES');
    expect(moduleSection).toBeTruthy();
    expect(moduleSection?.text).toContain('included=');
    expect(moduleSection?.text).toContain('skipped=');
    expect(moduleSection?.text).toContain('INFLUENCE_ENGINE');
    expect(moduleSection?.text).toContain('CONSTRAINTS');
  });
});
