import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../hypnagnosisSchemaV2';
import { migrateToV2 } from '../migrateToV2';

describe('migrateToV2', () => {
  it('fills defaults for missing blocks', () => {
    const out = migrateToV2({ subject: 'Legacy subject' });
    expect(out.schemaVersion).toBe(2);
    expect(out.INPUT.subject).toBe('Legacy subject');
    expect(out['HYPNA-MATRIX'].temporal).toBe(defaultSchemaV2['HYPNA-MATRIX'].temporal);
    expect(out.PALETTE.mode).toBe(defaultSchemaV2.PALETTE.mode);
  });

  it('keeps module toggles default behavior', () => {
    const out = migrateToV2({});
    expect(out.MODULES).toEqual(defaultSchemaV2.MODULES);
    expect(out.IGNORE_RULES.hard_disable).toBe(true);
    expect(out.IGNORE_RULES.preserve_state).toBe(true);
  });
});
