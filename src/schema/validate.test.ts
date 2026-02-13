import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from './defaults';
import { validateSchemaV2 } from './validate';

describe('validateSchemaV2', () => {
  it('catches out-of-range influence weights', () => {
    const schema = defaultSchemaV2();
    schema.INFLUENCE_ENGINE.weights.inkSpray = 101;
    const result = validateSchemaV2(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' | ')).toContain('INFLUENCE_ENGINE.weights.inkSpray out of range');
  });
});
