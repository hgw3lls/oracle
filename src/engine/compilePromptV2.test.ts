import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../schema/defaults';
import { compilePromptV2 } from './compilePromptV2';

describe('compilePromptV2', () => {
  it('toggling PALETTE off removes palette footer', () => {
    const schema = defaultSchemaV2();
    schema.MODULES.PALETTE = false;
    const out = compilePromptV2(schema).compiledPrompt;
    expect(out).not.toContain('Palette:');
  });

  it('toggling INFLUENCE_ENGINE off removes behavior actions', () => {
    const schema = defaultSchemaV2();
    schema.MODULES.INFLUENCE_ENGINE = false;
    const out = compilePromptV2(schema).compiledPrompt;
    expect(out).not.toContain('Actions:');
  });

  it('is stable for same schema and seed', () => {
    const schema = defaultSchemaV2();
    schema.PROMPT_GENOME.seed = 777;
    const first = compilePromptV2(schema).compiledPrompt;
    const second = compilePromptV2(schema).compiledPrompt;
    expect(first).toBe(second);
  });
});
