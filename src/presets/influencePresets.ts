import { type InfluenceWeightKey, type SchemaV2 } from '../schema/hypnagnosisSchemaV2';

export type InfluencePreset = {
  name: 'BRUS_LOMBARDI' | 'BACON_COLLAPSE' | 'BASQUIAT_OCCULT' | 'PRINT_PURITY';
  influenceWeights: Record<InfluenceWeightKey, number>;
  materialBehaviors?: Partial<SchemaV2['INFLUENCE-ENGINE']['MATERIAL-BEHAVIORS']>;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
export const isInfluenceWeightInBounds = (v: number) => v >= 0 && v <= 100;

const mk = (preset: InfluencePreset): InfluencePreset => ({
  ...preset,
  influenceWeights: Object.fromEntries(Object.entries(preset.influenceWeights).map(([k, v]) => [k, clamp(v)])) as Record<InfluenceWeightKey, number>,
});

export const BRUS_LOMBARDI = mk({
  name: 'BRUS_LOMBARDI',
  influenceWeights: {
    'ink-spray-field': 88,
    'meat-brush-field': 34,
    'collage-break-field': 45,
    'network-map-field': 90,
    'occult-diagram-field': 36,
    'graphic-novel-field': 41,
    'print-material-field': 52,
    'hand-drawn-field': 49,
  },
});

export const BACON_COLLAPSE = mk({
  name: 'BACON_COLLAPSE',
  influenceWeights: {
    'ink-spray-field': 38,
    'meat-brush-field': 93,
    'collage-break-field': 44,
    'network-map-field': 28,
    'occult-diagram-field': 42,
    'graphic-novel-field': 31,
    'print-material-field': 26,
    'hand-drawn-field': 55,
  },
});

export const BASQUIAT_OCCULT = mk({
  name: 'BASQUIAT_OCCULT',
  influenceWeights: {
    'ink-spray-field': 66,
    'meat-brush-field': 52,
    'collage-break-field': 89,
    'network-map-field': 47,
    'occult-diagram-field': 91,
    'graphic-novel-field': 74,
    'print-material-field': 39,
    'hand-drawn-field': 72,
  },
});

export const PRINT_PURITY = mk({
  name: 'PRINT_PURITY',
  influenceWeights: {
    'ink-spray-field': 18,
    'meat-brush-field': 22,
    'collage-break-field': 35,
    'network-map-field': 40,
    'occult-diagram-field': 24,
    'graphic-novel-field': 48,
    'print-material-field': 96,
    'hand-drawn-field': 44,
  },
});

export const INFLUENCE_PRESETS = [BRUS_LOMBARDI, BACON_COLLAPSE, BASQUIAT_OCCULT, PRINT_PURITY];
export const INFLUENCE_PRESET_MAP = Object.fromEntries(INFLUENCE_PRESETS.map((preset) => [preset.name, preset])) as Record<InfluencePreset['name'], InfluencePreset>;

export const applyInfluencePreset = (schema: SchemaV2, preset: InfluencePreset): SchemaV2 => ({
  ...schema,
  'INFLUENCE-ENGINE': {
    ...schema['INFLUENCE-ENGINE'],
    'INFLUENCE-WEIGHTS': {
      ...schema['INFLUENCE-ENGINE']['INFLUENCE-WEIGHTS'],
      ...preset.influenceWeights,
    },
    'MATERIAL-BEHAVIORS': {
      ...schema['INFLUENCE-ENGINE']['MATERIAL-BEHAVIORS'],
      ...(preset.materialBehaviors || {}),
    },
  },
});

export const randomizeInfluenceWithinBounds = (schema: SchemaV2, rng: () => number = Math.random): SchemaV2 => {
  const next = Object.fromEntries(Object.entries(schema['INFLUENCE-ENGINE']['INFLUENCE-WEIGHTS']).map(([k, v]) => [k, clamp(v + Math.round(rng() * 20 - 10))])) as Record<InfluenceWeightKey, number>;
  return {
    ...schema,
    'INFLUENCE-ENGINE': {
      ...schema['INFLUENCE-ENGINE'],
      'INFLUENCE-WEIGHTS': next,
    },
  };
};
