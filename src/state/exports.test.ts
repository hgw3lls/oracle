import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../schema/defaults';
import { buildEnabledOnlySchema } from './exports';

describe('state/exports', () => {
  it('exports only enabled module blocks (and filters MODULES)', () => {
    const schema = defaultSchemaV2();
    schema.MODULES.PALETTE = false;
    schema.MODULES.CONSTRAINTS = false;

    const enabledOnly = buildEnabledOnlySchema(schema) as any;

    expect(enabledOnly.version).toBe(2);
    expect(enabledOnly.MODULES.PALETTE).toBeUndefined();
    expect(enabledOnly.MODULES.CONSTRAINTS).toBeUndefined();

    expect(enabledOnly.PALETTE).toBeUndefined();
    expect(enabledOnly.CONSTRAINTS).toBeUndefined();

    expect(enabledOnly.INPUT).toBeDefined();
    expect(enabledOnly.PROMPT_GENOME).toBeDefined();
  });
});
