import type { SchemaV2 } from '@/core/schema/schemaV2';

export function compileConstraints(schema: SchemaV2): string {
  return `CONSTRAINTS max_tokens=${schema.CONSTRAINTS.max_tokens}; safety=${schema.CONSTRAINTS.safety_level}; avoid=${schema.CONSTRAINTS.avoid}`;
}
