import { describe, expect, it } from 'vitest';
import { compilePrompt } from '../compilePrompt';

const baseState = {
  mode: 'FULL' as const,
  subject: 'Ash-fall cathedrals',
  notes: 'test note',
  styleTokens: ['STYLE.HYPNAGOGIC', 'STYLE.OCCULT'],
  hallucination: 72,
  step: 0,
  steps: 6,
  batchId: 'run-001',
  seed: 'seed-123',
  hypnaMatrix: {
    temporal: 77,
    material: 58,
    space: 82,
    symbol: 68,
    agency: 41,
    saturation: 'dense',
    motion: 'kinetic',
  },
  stateMap: {
    'state-name': 'ANCHOR',
    flow: 'stable horizon',
  },
  autoGesture: {
    mode: 'kinetic',
    pressure: 41,
  },
  autoComp: {
    composition: 'ANCHOR',
    tension: 'dense',
  },
  autoEvolve: {
    enabled: true,
    steps: 6,
    curve: 's-curve',
  },
  arcaneLayer: {
    enabled: true,
    'arcane-mode': 'occult',
  },
  sleepState: {
    enabled: false,
  },
  vibeRefs: {
    description: 'ritual architecture',
  },
  humanizer: {
    'level(0-100)': 60,
    qualities: 'Wobble lines',
  },
};

describe('compilePrompt', () => {
  it('produces stable canonical formatting', () => {
    const output = compilePrompt(baseState);

    const expected = [
      '===============================',
      'HYPNAGNOSIS SYSTEM — WEB EDITION',
      '===============================',
      'INPUT',
      'mode: FULL',
      'subject: Ash-fall cathedrals',
      'hallucination(0-100): 72',
      'state-index: 1/6',
      'batch-id: run-001',
      'seed: seed-123',
      'STYLE',
      'style-tokens: STYLE.HYPNAGOGIC, STYLE.OCCULT',
      'expanded-style: porous perception, threshold drift, waking/dream seam, sensory instability; sigil-grammar, ritual diagram logic, correspondence pressure, symbolic recursion',
      'notes: test note',
      'HYPNA-MATRIX',
      'temporal: 77',
      'material: 58',
      'space: 82',
      'symbol: 68',
      'agency: 41',
      'saturation: dense',
      'motion: kinetic',
      'STATE-MAP',
      'state-name: ANCHOR',
      'flow: stable horizon',
      'AUTO-GESTURE',
      'mode: kinetic',
      'pressure: 41',
      'AUTO-COMP',
      'composition: ANCHOR',
      'tension: dense',
      'AUTO-EVOLVE',
      'enabled: true',
      'steps: 6',
      'curve: s-curve',
      'ARCANE-LAYER',
      'enabled: true',
      'arcane-mode: occult',
      'SLEEP-STATE',
      'enabled: false',
      'VIBE-REFS',
      'description: ritual architecture',
      'HUMANIZER',
      'level(0-100): 60',
      'qualities: Wobble lines',
      'IMAGE-GENERATION',
      'primary-prompt: Ash-fall cathedrals. porous perception, threshold drift, waking/dream seam, sensory instability; sigil-grammar, ritual diagram logic, correspondence pressure, symbolic recursion. high detail, dreamlike surrealism, wide cinematic framing, gentle motion, textured surfaces. Additional direction: test note. Image generation prompt; prioritize coherent composition, legible focal hierarchy, and physically plausible lighting.',
      'negative-prompt: blurry, low-resolution, jpeg artifacts, watermark, text overlay, logo, deformed anatomy, broken perspective, duplicated limbs, extra fingers, flat lighting, muddy colors, overexposed highlights, crushed shadows, unintentional collage seams, incoherent geometry, noisy background clutter',
      'render-priority: composition > subject readability > style fidelity > micro-texture',
    ].join('\n');

    expect(output.replace(/\n\n/g, '\n')).toBe(expected);
  });

  it('omits optional empty sections', () => {
    const output = compilePrompt({
      mode: 'FULL',
      subject: 'x',
      styleTokens: [],
      hypnaMatrix: {},
      stateMap: {},
      autoGesture: {},
      autoComp: {},
      autoEvolve: {},
      arcaneLayer: {},
      sleepState: {},
      vibeRefs: {},
      humanizer: {},
      printLayer: {},
    });

    expect(output).toContain('INPUT\nmode: FULL\nsubject: x');
    expect(output).not.toContain('HYPNA-MATRIX');
    expect(output).not.toContain('AUTO-GESTURE');
    expect(output).not.toContain('PRINT-LAYER');
    expect(output).toContain('IMAGE-GENERATION');
  });

  it('supports mode-specific section emission', () => {
    const styleOnly = compilePrompt({
      ...baseState,
      mode: 'STYLE',
      autoGesture: { mode: 'kinetic' },
      autoComp: { composition: 'ANCHOR' },
    });

    expect(styleOnly).toContain('STYLE');
    expect(styleOnly).toContain('IMAGE-GENERATION');
    expect(styleOnly).not.toContain('AUTO-GESTURE');
    expect(styleOnly).not.toContain('AUTO-COMP');

    const gestureOnly = compilePrompt({
      ...baseState,
      mode: 'GESTURE',
      printLayer: { 'print-mode': 'riso' },
    });

    expect(gestureOnly).toContain('AUTO-GESTURE');
    expect(gestureOnly).toContain('STATE-MAP');
    expect(gestureOnly).not.toContain('PRINT-LAYER');

    const printOnly = compilePrompt({
      ...baseState,
      mode: 'PRINT',
      printLayer: {
        'print-mode': 'riso',
        registration: 'progressive',
      },
    });

    expect(printOnly).toContain('PRINT-LAYER');
    expect(printOnly).toContain('IMAGE-GENERATION');
    expect(printOnly).not.toContain('AUTO-GESTURE');
  });
});
