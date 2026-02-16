import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '@/core/schema/defaults';
import { compileManagedPrompt } from './compileManagedPrompt';

describe('compileManagedPrompt', () => {
  it('formats managed prompt into ordered directive sections', () => {
    const schema = defaultSchemaV2();
    schema.PROMPT_MANAGER.compile_mode = 'MINIMAL';

    const out = compileManagedPrompt(schema).compiled;
    expect(out).toContain('Prompt directives:');
    expect(out).toContain('- Subject:');
    expect(out).toContain('- Style:');
    expect(out).toContain('- Render constraints:');
    expect(out).toContain('Negative prompt:');
  });

  it('adds extracted palette in balanced mode', () => {
    const schema = defaultSchemaV2();
    schema.PROMPT_MANAGER.compile_mode = 'BALANCED';
    schema.PALETTE.mode = 'IMAGE_EXTRACT';
    schema.PALETTE.image_extract.extracted = [
      { name: 'k', hex: '#111111', pct: 50 },
      { name: 'p', hex: '#eeeeee', pct: 50 },
    ];

    const out = compileManagedPrompt(schema).compiled;
    expect(out).toContain('Palette (extracted): #111111, #eeeeee.');
  });
});
