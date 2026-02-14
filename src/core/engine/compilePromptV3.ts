import type { SchemaV3 } from '@/core/schema/schemaV2';
import { compilePromptV2 } from './compilePromptV2';
import { compileManagedPrompt } from './compileManagedPrompt';

export function compilePromptV3(schema: SchemaV3): { compiledPrompt: string; warnings: string[] } {
  // If prompt manager is enabled, it becomes the primary compiled prompt.
  if (schema.PROMPT_MANAGER?.enabled) {
    const res = compileManagedPrompt(schema);
    return { compiledPrompt: res.compiled, warnings: res.warnings };
  }

  // Fall back to legacy wizard compilation.
  const legacy = compilePromptV2(schema);
  return { compiledPrompt: legacy.compiledPrompt, warnings: [] };
}
