import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../../schema/hypnagnosisSchemaV2';
import { compilePromptV2 } from '../compilePromptV2';

const schema = {
  ...defaultSchemaV2,
  INPUT: { ...defaultSchemaV2.INPUT, subject: 'Ash-fall cathedrals', seed: 'fixed-seed' },
  CONSTRAINTS: { require: ['foreground figure'], forbid: ['gradients'] },
};

describe('compilePromptV2', () => {
  it('is deterministic', () => {
    expect(compilePromptV2(schema).compiledPrompt).toBe(compilePromptV2(schema).compiledPrompt);
  });

  it('respects disabled modules', () => {
    const off = compilePromptV2({ ...schema, MODULES: { ...schema.MODULES, PALETTE: false, CONSTRAINTS: false } });
    expect(off.compiledPrompt).not.toContain('PALETTE ::');
    expect(off.compiledPrompt).not.toContain('CONSTRAINTS ::');
  });
});
