import { describe, expect, it } from 'vitest';
import { buildImagePromptFrame, buildMasterPrompt, deriveSpec } from './promptBuilders';

describe('graphic notation prompt builders', () => {
  it('builds a structured image prompt frame with required sections', () => {
    const spec = deriveSpec({
      title: 'Test Score',
      ensemble: 'duo',
      visualIntent: 'dense map',
      durationSec: 90,
      density: 'high',
      palette: 'black + red',
      gestures: 'arc, pulse',
      constraints: 'avoid staff notation',
    });

    const out = buildImagePromptFrame(spec, []);
    expect(out).toContain('IMAGE GENERATION PROMPT FRAME');
    expect(out).toContain('[SUBJECT]');
    expect(out).toContain('[NEGATIVE PROMPT]');
    expect(out).toContain('avoid staff notation');
  });

  it('includes enabled module influence in master prompt', () => {
    const spec = deriveSpec({ title: 'Test Score' });
    const out = buildMasterPrompt(spec, [
      {
        id: 'm1',
        name: 'Humanizer',
        enabled: true,
        targets: ['humanizer'],
        strength: 77,
        tokens: ['ink bleed'],
        rules: ['keep tactile variance'],
      },
    ]);

    expect(out).toContain('MODULES');
    expect(out).toContain('Humanizer [strength 77]');
  });
});
