import type { SchemaV3, PromptBlock, PromptBlockKind } from '@/core/schema/schemaV2';
import { compilePromptV2 } from './compilePromptV2';

function joinClean(parts: string[]) {
  return parts
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

const BLOCK_LABELS: Record<PromptBlockKind, string> = {
  CORE: 'Subject',
  STYLE_PACKS: 'Style',
  PALETTE_PACK: 'Palette guidance',
  CONSTRAINTS: 'Render constraints',
  PROCESS: 'Process',
  OUTPUT_SPEC: 'Output spec',
  NEGATIVES: 'Negative prompt',
};

const BLOCK_ORDER: PromptBlockKind[] = ['CORE', 'STYLE_PACKS', 'PALETTE_PACK', 'PROCESS', 'OUTPUT_SPEC', 'CONSTRAINTS', 'NEGATIVES'];

function orderedBlocks(blocks: PromptBlock[]): PromptBlock[] {
  const rank = new Map(BLOCK_ORDER.map((kind, index) => [kind, index]));
  return [...blocks].sort((a, b) => {
    const ar = rank.get(a.kind) ?? 999;
    const br = rank.get(b.kind) ?? 999;
    if (ar !== br) return ar - br;
    return a.id.localeCompare(b.id);
  });
}

function formatPositiveBlocks(blocks: PromptBlock[]): string {
  const lines = orderedBlocks(blocks)
    .filter((b) => b.kind !== 'NEGATIVES')
    .map((b) => `- ${BLOCK_LABELS[b.kind]}: ${b.content.trim()}`);
  return lines.length ? ['Prompt directives:', ...lines].join('\n') : '';
}

function formatNegativeBlocks(blocks: PromptBlock[]): string {
  const negatives = orderedBlocks(blocks)
    .filter((b) => b.kind === 'NEGATIVES')
    .map((b) => b.content.trim())
    .filter(Boolean);

  if (!negatives.length) return '';
  return `Negative prompt: ${negatives.join('; ')}.`;
}

export function lintManagedPrompt(schema: SchemaV3, blocks: PromptBlock[]): string[] {
  const warnings: string[] = [];
  const text = blocks
    .filter((b) => b.enabled)
    .map((b) => b.content)
    .join('\n')
    .toLowerCase();

  const hasLimited = text.includes('limited palette');
  const hasNoGrad = text.includes('no gradients') || text.includes('no gradient');
  const has3D = text.includes('3d render') || text.includes('octane') || text.includes('unreal engine');
  const hasGradWords = text.includes('smooth gradient') || text.includes('soft gradient') || text.includes('gradient');

  if (hasLimited && schema.PALETTE?.mode === 'IMAGE_EXTRACT' && schema.PALETTE?.image_extract?.max_colors > 6) {
    warnings.push('Limited palette + image extract max_colors > 6. Consider reducing to 4–6 for consistency.');
  }
  if (hasNoGrad && hasGradWords) warnings.push('You asked for no gradients but the prompt mentions gradients.');
  if (hasLimited && has3D) warnings.push('Limited palette + 3D render language can fight each other. Consider removing 3D terms.');
  if (schema.VISUAL_GRAMMAR?.framing === 'portrait' && text.includes('landscape')) warnings.push('Portrait framing set but prompt mentions landscape.');

  return warnings;
}

export function compileManagedPrompt(schema: SchemaV3): { compiled: string; warnings: string[] } {
  const pm = schema.PROMPT_MANAGER;
  const active = pm.prompts.find((p) => p.id === pm.active_prompt_id) ?? pm.prompts[0];
  const blocks = active?.blocks ?? [];
  const enabled = blocks.filter((b) => b.enabled);

  // Inject palette/constraints depending on compile mode
  const paletteLine = (() => {
    if (schema.PALETTE.mode === 'RISO_PLATES') {
      const plates = schema.PALETTE.riso_plates
        .map((p) => `${p.role}:${p.hex}@${p.opacity}% (misreg ${p.misregistration})`)
        .join(', ');
      return `Palette (RISO plates): ${plates}.`;
    }
    if (schema.PALETTE.mode === 'IMAGE_EXTRACT' && schema.PALETTE.image_extract.extracted.length) {
      const cols = schema.PALETTE.image_extract.extracted.map((s) => s.hex).join(', ');
      return `Palette (extracted): ${cols}.`;
    }
    return schema.PALETTE.descriptive ? `Palette: ${schema.PALETTE.descriptive}.` : '';
  })();

  const constraintsLine = `Hard constraints: max_tokens=${schema.CONSTRAINTS.max_tokens}; avoid=${schema.CONSTRAINTS.avoid}.`;

  const body = formatPositiveBlocks(enabled);
  const negativesLine = formatNegativeBlocks(enabled);
  const warnings = lintManagedPrompt(schema, blocks);

  if (pm.compile_mode === 'MINIMAL') {
    return { compiled: joinClean([body, negativesLine]), warnings };
  }

  if (pm.compile_mode === 'BALANCED') {
    return { compiled: joinClean([body, negativesLine, paletteLine, schema.PROMPT_GENOME.suffix]), warnings };
  }

  // MAX_CONTROL: stitch in the full wizard prompt as an appendix for “power users”
  const wizard = compilePromptV2(schema).compiledPrompt;
  return { compiled: joinClean([body, negativesLine, paletteLine, constraintsLine, '\n---\n', wizard]), warnings };
}
