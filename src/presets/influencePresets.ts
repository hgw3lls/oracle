import type { SchemaV2 } from '../schema/hypnagnosisSchemaV2';

export type InfluenceWeights = {
  spray: number;
  smear: number;
  collage: number;
  networkMap: number;
  occultGeometry: number;
  printMaterial: number;
};

export type InfluencePreset = {
  name: 'BRUS_LOMBARDI' | 'BACON_COLLAPSE' | 'BASQUIAT_OCCULT' | 'PRINT_PURITY';
  influenceWeights: InfluenceWeights;
  visualGrammar: Partial<SchemaV2>;
};

const clampWeight = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const makePreset = (preset: InfluencePreset): InfluencePreset => ({
  ...preset,
  influenceWeights: {
    spray: clampWeight(preset.influenceWeights.spray),
    smear: clampWeight(preset.influenceWeights.smear),
    collage: clampWeight(preset.influenceWeights.collage),
    networkMap: clampWeight(preset.influenceWeights.networkMap),
    occultGeometry: clampWeight(preset.influenceWeights.occultGeometry),
    printMaterial: clampWeight(preset.influenceWeights.printMaterial),
  },
});

export const BRUS_LOMBARDI = makePreset({
  name: 'BRUS_LOMBARDI',
  influenceWeights: { spray: 78, smear: 62, collage: 45, networkMap: 88, occultGeometry: 42, printMaterial: 38 },
  visualGrammar: {
    mutateStrength: 68,
    humanizerLevel: 64,
    styleTokens: ['STYLE.CONSPIRACY_DIAGRAM', 'STYLE.HYPNAGOGIC'],
    curve: 'exp',
  },
});

export const BACON_COLLAPSE = makePreset({
  name: 'BACON_COLLAPSE',
  influenceWeights: { spray: 55, smear: 92, collage: 40, networkMap: 36, occultGeometry: 58, printMaterial: 28 },
  visualGrammar: {
    mutateStrength: 84,
    humanizerLevel: 72,
    styleTokens: ['STYLE.NEWWEIRD', 'STYLE.HYPNAGOGIC'],
    curve: 's-curve',
  },
});

export const BASQUIAT_OCCULT = makePreset({
  name: 'BASQUIAT_OCCULT',
  influenceWeights: { spray: 82, smear: 74, collage: 58, networkMap: 50, occultGeometry: 90, printMaterial: 44 },
  visualGrammar: {
    mutateStrength: 79,
    humanizerLevel: 70,
    styleTokens: ['STYLE.OCCULT', 'STYLE.GRAPHIC_SCORE'],
    curve: 'linear',
  },
});

export const PRINT_PURITY = makePreset({
  name: 'PRINT_PURITY',
  influenceWeights: { spray: 18, smear: 26, collage: 46, networkMap: 40, occultGeometry: 30, printMaterial: 94 },
  visualGrammar: {
    mode: 'PRINT',
    mutateStrength: 24,
    humanizerLevel: 48,
    styleTokens: ['STYLE.PRINT', 'STYLE.GRAPHIC_SCORE'],
    curve: 'linear',
  },
});

export const INFLUENCE_PRESETS: InfluencePreset[] = [
  BRUS_LOMBARDI,
  BACON_COLLAPSE,
  BASQUIAT_OCCULT,
  PRINT_PURITY,
];

export const INFLUENCE_PRESET_MAP = Object.fromEntries(
  INFLUENCE_PRESETS.map((preset) => [preset.name, preset]),
) as Record<InfluencePreset['name'], InfluencePreset>;

const weightPatchToSchema = (weights: InfluenceWeights): Partial<SchemaV2> => ({
  hallucination: clampWeight((weights.spray + weights.occultGeometry) / 2),
  mutateStrength: clampWeight((weights.smear + weights.collage) / 2),
  humanizerLevel: clampWeight((weights.printMaterial + weights.collage) / 2),
  humanizerMin: clampWeight(Math.min(weights.smear, weights.printMaterial)),
  humanizerMax: clampWeight(Math.max(weights.spray, weights.networkMap, weights.occultGeometry)),
});

const mergeUniqueStyleTokens = (base: string[], extra: string[]) => Array.from(new Set([...base, ...extra]));

export const applyInfluencePreset = (schema: SchemaV2, preset: InfluencePreset): SchemaV2 => {
  const weightPatch = weightPatchToSchema(preset.influenceWeights);
  const styleTokens = mergeUniqueStyleTokens(schema.styleTokens, preset.visualGrammar.styleTokens || []);

  return {
    ...schema,
    ...weightPatch,
    ...preset.visualGrammar,
    styleTokens,
  };
};

export const randomizeInfluenceWithinBounds = (
  schema: SchemaV2,
  rng: () => number = Math.random,
): SchemaV2 => {
  const perturb = (value: number) => clampWeight(value + Math.round((rng() * 20) - 10));

  const nextMin = perturb(schema.humanizerMin);
  const nextMax = Math.max(nextMin, perturb(schema.humanizerMax));

  return {
    ...schema,
    hallucination: perturb(schema.hallucination),
    mutateStrength: perturb(schema.mutateStrength),
    humanizerLevel: perturb(schema.humanizerLevel),
    humanizerMin: nextMin,
    humanizerMax: nextMax,
  };
};

export const isInfluenceWeightInBounds = (value: number) => value >= 0 && value <= 100;
