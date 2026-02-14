import type { SchemaV2 } from '@/core/schema/schemaV2';
import { deepMerge } from '@/shared/utils/deepMerge';
import { renderInfluenceBehaviors } from './influences';
import { renderPaletteFooter } from './palette/paletteEngine';

export type DebugSection = { title: string; text: string };

export function compilePromptV2(
  schema: SchemaV2,
  overrides?: Partial<SchemaV2>,
): { compiledPrompt: string; debugSections: DebugSection[] } {
  const merged = overrides
    ? (deepMerge(JSON.parse(JSON.stringify(schema)) as Record<string, unknown>, overrides as Record<string, unknown>) as SchemaV2)
    : schema;

  const lines: string[] = [];
  const debugSections: DebugSection[] = [];
  const on = merged.MODULES;

  const include = (module: keyof SchemaV2['MODULES']) => on[module];

  // 1) Intent/Subject
  if (include('INPUT') && include('PROMPT_GENOME')) {
    lines.push(`${merged.PROMPT_GENOME.prefix}`);
    lines.push(`Intent: ${merged.INPUT.subject} in ${merged.INPUT.medium}. Structure: ${merged.PROMPT_GENOME.structure}.`);
    debugSections.push({ title: '1) Intent/Subject', text: 'included (INPUT + PROMPT_GENOME)' });
  } else {
    debugSections.push({ title: '1) Intent/Subject', text: 'skipped (INPUT or PROMPT_GENOME disabled)' });
  }

  // 2) Hallucination + perception + hypna matrix
  if (include('HALLUCINATION') && include('PROMPT_GENOME') && include('HYPNA_MATRIX')) {
    lines.push(
      `Perception physics: ${merged.HALLUCINATION.profile}, drift=${Math.round(merged.HALLUCINATION.drift)}; ${merged.PROMPT_GENOME.perception}; matrix(${merged.HYPNA_MATRIX.axis_x}/${merged.HYPNA_MATRIX.axis_y}) depth=${Math.round(merged.HYPNA_MATRIX.depth)}.`,
    );
    debugSections.push({ title: '2) Hallucination physics + perception', text: 'included (HALLUCINATION + PROMPT_GENOME + HYPNA_MATRIX)' });
  } else {
    debugSections.push({ title: '2) Hallucination physics + perception', text: 'skipped (required module disabled)' });
  }

  // 3) Diagram/structure
  if (include('VISUAL_GRAMMAR')) {
    lines.push(`Diagram: ${merged.VISUAL_GRAMMAR.framing} frame, ${merged.VISUAL_GRAMMAR.lens} lens, detail=${Math.round(merged.VISUAL_GRAMMAR.detail)}.`);
    debugSections.push({ title: '3) Diagram/structure', text: 'included (VISUAL_GRAMMAR)' });
  } else {
    debugSections.push({ title: '3) Diagram/structure', text: 'skipped (VISUAL_GRAMMAR disabled)' });
  }

  // 4) Influence/material behaviors
  if (include('INFLUENCE_ENGINE')) {
    const behaviorLines = renderInfluenceBehaviors(merged.INFLUENCE_ENGINE.weights, { punctuation: 'period' }).slice(0, 3);
    if (behaviorLines.length > 0) {
      lines.push(`Actions: ${behaviorLines.join(' ')}`);
    }
    debugSections.push({ title: '4) Influence/material behaviors', text: 'included (INFLUENCE_ENGINE)' });
  } else {
    debugSections.push({ title: '4) Influence/material behaviors', text: 'skipped (INFLUENCE_ENGINE disabled)' });
  }

  // 5) Palette footer
  if (include('PALETTE')) {
    const plates = merged.PALETTE.riso_plates.slice(0, 4).map((p) => `${p.role}:${p.hex}`).join(', ');
    lines.push(`Palette: ${merged.PALETTE.mode}; plates=${plates || 'auto'}. ${renderPaletteFooter(merged.PALETTE)}`);
    debugSections.push({ title: '5) Palette footer', text: 'included (PALETTE)' });
  } else {
    debugSections.push({ title: '5) Palette footer', text: 'skipped (PALETTE disabled)' });
  }

  // 6) Constraints footer
  if (include('CONSTRAINTS')) {
    lines.push(`Constraints: require tactile ink overlap; forbid ${merged.CONSTRAINTS.avoid}; max_tokens=${merged.CONSTRAINTS.max_tokens}.`);
    debugSections.push({ title: '6) Constraints footer', text: 'included (CONSTRAINTS)' });
  } else {
    debugSections.push({ title: '6) Constraints footer', text: 'skipped (CONSTRAINTS disabled)' });
  }

  if (include('PROMPT_GENOME')) {
    lines.push(`Style tokens: ${merged.PROMPT_GENOME.style_tokens.slice(0, 6).join(', ')}. Seed=${merged.PROMPT_GENOME.seed}.`);
    lines.push(merged.PROMPT_GENOME.suffix);
  }

  return { compiledPrompt: lines.join('\n'), debugSections };
}
