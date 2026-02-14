import { defaultSchemaV2 } from './defaults';
import { isSchemaV2 } from './validate';
import type { SchemaV3 } from './schemaV2';

export function migrateToV3(input: unknown): SchemaV3 {
  if (isSchemaV2(input)) return input;

  const base = defaultSchemaV2();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Record<string, unknown>;

  // If this looks like a prior v2 schema, up-convert it by layering onto defaults.
  if (raw.version === 2 && typeof raw.MODULES === 'object') {
    const v2 = raw as unknown as Partial<SchemaV3>;
    return {
      ...base,
      ...v2,
      version: 3,
      // Ensure new block exists
      PROMPT_MANAGER: (v2 as any).PROMPT_MANAGER ?? base.PROMPT_MANAGER,
    };
  }

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

// Back-compat name (older parts of the app import migrateToV2)
export const migrateToV2 = migrateToV3;
