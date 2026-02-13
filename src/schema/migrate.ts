import { defaultSchemaV2 } from './defaults';
import { isSchemaV2 } from './validate';
import type { SchemaV2 } from './schemaV2';

export function migrateToV2(input: unknown): SchemaV2 {
  if (isSchemaV2(input)) return input;

  const base = defaultSchemaV2();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Record<string, unknown>;

  return {
    ...base,
    INPUT: {
      ...base.INPUT,
      subject: String(raw.subject ?? raw.intent ?? base.INPUT.subject),
      notes: String(raw.notes ?? raw.stateNotes ?? base.INPUT.notes),
    },
    HALLUCINATION: {
      ...base.HALLUCINATION,
      profile: String(raw.hh ?? raw.hallucinationProfile ?? base.HALLUCINATION.profile),
    },
    PALETTE: {
      ...base.PALETTE,
      descriptive: String(raw.palette ?? raw.paletteSeed ?? base.PALETTE.descriptive),
    },
  };
}
