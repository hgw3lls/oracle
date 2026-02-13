import { MODULE_KEYS, type SchemaV2 } from './schemaV2';

const HEX = /^#[0-9a-fA-F]{6}$/;

const inRange = (n: unknown, min = 0, max = 100) => typeof n === 'number' && n >= min && n <= max;

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateSchemaV2(value: unknown): ValidationResult {
  const errors: string[] = [];
  const s = value as SchemaV2;

  if (!s || typeof s !== 'object') return { valid: false, errors: ['schema must be an object'] };
  if (s.version !== 2) errors.push('version must be 2');

  for (const key of MODULE_KEYS) {
    if (typeof s.MODULES?.[key] !== 'boolean') errors.push(`MODULES.${key} must be boolean`);
  }

  if (s.IGNORE_RULES?.hard_disable !== true) errors.push('IGNORE_RULES.hard_disable must be true');
  if (s.IGNORE_RULES?.preserve_state !== true) errors.push('IGNORE_RULES.preserve_state must be true');

  const weights = s.INFLUENCE_ENGINE?.weights;
  if (!inRange(weights?.inkSpray)) errors.push('INFLUENCE_ENGINE.weights.inkSpray out of range 0..100');
  if (!inRange(weights?.meatBrush)) errors.push('INFLUENCE_ENGINE.weights.meatBrush out of range 0..100');
  if (!inRange(weights?.collageBreak)) errors.push('INFLUENCE_ENGINE.weights.collageBreak out of range 0..100');
  if (!inRange(weights?.networkMap)) errors.push('INFLUENCE_ENGINE.weights.networkMap out of range 0..100');
  if (!inRange(weights?.occultDiagram)) errors.push('INFLUENCE_ENGINE.weights.occultDiagram out of range 0..100');
  if (!inRange(weights?.graphicNovel)) errors.push('INFLUENCE_ENGINE.weights.graphicNovel out of range 0..100');
  if (!inRange(weights?.printMaterial)) errors.push('INFLUENCE_ENGINE.weights.printMaterial out of range 0..100');
  if (!inRange(weights?.handDrawn)) errors.push('INFLUENCE_ENGINE.weights.handDrawn out of range 0..100');
  if (!inRange(s.INFLUENCE_ENGINE?.behavior?.density)) errors.push('INFLUENCE_ENGINE.behavior.density out of range 0..100');
  if (!inRange(s.INFLUENCE_ENGINE?.behavior?.turbulence)) errors.push('INFLUENCE_ENGINE.behavior.turbulence out of range 0..100');

  const paletteMode = s.PALETTE?.mode;
  if (!['RISO_PLATES', 'DESCRIPTIVE', 'IMAGE_EXTRACT', 'COLOR_WHEEL'].includes(paletteMode)) {
    errors.push('PALETTE.mode invalid');
  }

  if (!Array.isArray(s.PALETTE?.riso_plates) || s.PALETTE.riso_plates.length > 4) {
    errors.push('PALETTE.riso_plates must have max length 4');
  }
  for (const [idx, plate] of (s.PALETTE?.riso_plates ?? []).entries()) {
    if (!HEX.test(plate.hex)) errors.push(`PALETTE.riso_plates[${idx}].hex invalid`);
    if (!inRange(plate.opacity)) errors.push(`PALETTE.riso_plates[${idx}].opacity out of range 0..100`);
    if (!inRange(plate.misregistration, 0, 20)) errors.push(`PALETTE.riso_plates[${idx}].misregistration out of range 0..20`);
  }

  if (!HEX.test(s.PALETTE?.color_wheel?.base_hex ?? '')) errors.push('PALETTE.color_wheel.base_hex invalid');
  if (!['complementary', 'analogous', 'triadic', 'split_complementary', 'tetradic', 'monochrome'].includes(s.PALETTE?.color_wheel?.scheme)) {
    errors.push('PALETTE.color_wheel.scheme invalid');
  }

  if (!inRange(s.PALETTE?.image_extract?.max_colors, 1, 8)) errors.push('PALETTE.image_extract.max_colors out of range 1..8');
  if (!inRange(s.PALETTE?.color_wheel?.count, 1, 8)) errors.push('PALETTE.color_wheel.count out of range 1..8');
  if (!inRange(s.PALETTE?.color_wheel?.rotate_deg, 0, 360)) errors.push('PALETTE.color_wheel.rotate_deg out of range 0..360');

  if (!inRange(s.STATE_MAP?.intensity)) errors.push('STATE_MAP.intensity out of range 0..100');
  if (!inRange(s.HALLUCINATION?.drift)) errors.push('HALLUCINATION.drift out of range 0..100');
  if (!inRange(s.HYPNA_MATRIX?.depth)) errors.push('HYPNA_MATRIX.depth out of range 0..100');
  if (!inRange(s.VISUAL_GRAMMAR?.detail)) errors.push('VISUAL_GRAMMAR.detail out of range 0..100');
  if (!inRange(s.CONSTRAINTS?.safety_level)) errors.push('CONSTRAINTS.safety_level out of range 0..100');
  if (!inRange(s.ANIMATION?.speed)) errors.push('ANIMATION.speed out of range 0..100');
  if (!inRange(s.ANIMATION?.fps, 1, 120)) errors.push('ANIMATION.fps out of range 1..120');
  if (!inRange(s.ANIMATION?.duration, 1, 60)) errors.push('ANIMATION.duration out of range 1..60');
  if (!inRange(s.ANIMATION?.every_n, 1, 60)) errors.push('ANIMATION.every_n out of range 1..60');
  if (!['keyframes_only', 'all_frames', 'every_n'].includes(s.ANIMATION?.export_mode)) errors.push('ANIMATION.export_mode invalid');

  return { valid: errors.length === 0, errors };
}

export function isSchemaV2(value: unknown): value is SchemaV2 {
  return validateSchemaV2(value).valid;
}
