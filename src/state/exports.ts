import type { ModuleKey, SchemaV2 } from '../schema/schemaV2';
import { MODULE_KEYS } from '../schema/schemaV2';

/**
 * Returns an export-safe JSON object that includes only enabled modules.
 * Disabled module blocks are removed entirely.
 */
export function buildEnabledOnlySchema(schema: SchemaV2): Record<string, unknown> {
  const out: Record<string, unknown> = {
    version: schema.version,
    IGNORE_RULES: schema.IGNORE_RULES,
    MODULES: {},
  };

  const modules: Record<string, boolean> = {};
  for (const key of MODULE_KEYS) {
    if (schema.MODULES[key]) {
      modules[key] = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out as any)[key] = (schema as any)[key];
    }
  }
  out.MODULES = modules;
  return out;
}

export function isModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(value);
}
