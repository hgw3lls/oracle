import type { ModuleKey, SchemaV2 } from '@/core/schema/schemaV2';

export const ALLOWED_CURVE_PATHS = [
  'HALLUCINATION.drift',
  'HYPNA_MATRIX.depth',
  'INFLUENCE_ENGINE.weights.inkSpray',
  'INFLUENCE_ENGINE.weights.meatBrush',
  'INFLUENCE_ENGINE.weights.collageBreak',
  'INFLUENCE_ENGINE.weights.networkMap',
  'INFLUENCE_ENGINE.weights.occultDiagram',
  'INFLUENCE_ENGINE.weights.graphicNovel',
  'INFLUENCE_ENGINE.weights.printMaterial',
  'INFLUENCE_ENGINE.weights.handDrawn',
  'PALETTE.color_wheel.rotate_deg',
  'PALETTE.riso_plates.0.opacity',
  'PALETTE.riso_plates.1.opacity',
  'PALETTE.riso_plates.2.opacity',
  'PALETTE.riso_plates.3.opacity',
] as const;

export type AllowedCurvePath = (typeof ALLOWED_CURVE_PATHS)[number];

export function moduleForCurvePath(path: string): ModuleKey | null {
  if (path.startsWith('HALLUCINATION.')) return 'HALLUCINATION';
  if (path.startsWith('HYPNA_MATRIX.')) return 'HYPNA_MATRIX';
  if (path.startsWith('INFLUENCE_ENGINE.')) return 'INFLUENCE_ENGINE';
  if (path.startsWith('PALETTE.')) return 'PALETTE';
  return null;
}

export function isCurvePathAllowed(path: string): path is AllowedCurvePath {
  return (ALLOWED_CURVE_PATHS as readonly string[]).includes(path);
}

export function timelineTimes(schema: SchemaV2): number[] {
  const count = Math.max(1, Math.round(schema.ANIMATION.fps * schema.ANIMATION.duration));
  const denom = Math.max(1, count - 1);
  return Array.from({ length: count }, (_, i) => i / denom);
}
