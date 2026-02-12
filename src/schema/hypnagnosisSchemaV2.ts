export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export type HypnagnosisMode = 'FULL' | 'STYLE' | 'GESTURE' | 'PRINT' | 'LIVE';
export type PaletteMode = 'RISO_PLATES' | 'DESCRIPTIVE' | 'IMAGE_EXTRACT' | 'COLOR_WHEEL';
export type ExtractMethod = 'median_cut' | 'kmeans';
export type WheelHarmony = 'complementary' | 'analogous' | 'triadic' | 'split_complementary' | 'tetradic' | 'monochrome';

export type InfluenceWeightKey =
  | 'ink-spray-field'
  | 'meat-brush-field'
  | 'collage-break-field'
  | 'network-map-field'
  | 'occult-diagram-field'
  | 'graphic-novel-field'
  | 'print-material-field'
  | 'hand-drawn-field';

export type InfluenceWeights = Record<InfluenceWeightKey, number>;
export type MaterialBehaviors = Record<InfluenceWeightKey, string>;

export type ModuleToggleMap = {
  INPUT: boolean;
  STATE_MAP: boolean;
  HALLUCINATION: boolean;
  HYPNA_MATRIX: boolean;
  PROMPT_GENOME: boolean;
  VISUAL_GRAMMAR: boolean;
  INFLUENCE_ENGINE: boolean;
  PALETTE: boolean;
  CONSTRAINTS: boolean;
  ANIMATION: boolean;
};

export type SchemaV2 = {
  schemaVersion: 2;
  INPUT: { mode: HypnagnosisMode; 'batch-id': string; seed: string; notes: string; subject: string; styleTokens?: string[] };
  'STATE-MAP': { 'state-name': string; flow: string };
  HALLUCINATION: { level: number };
  'HYPNA-MATRIX': { temporal: number; material: number; space: number; symbol: number; agency: number };
  'PROMPT-GENOME': {
    structure: { composition: string; tension: number; recursion: number };
    perception: { grain: number; 'line-wobble': number; erasure: number; annotation: number };
  };
  'VISUAL-GRAMMAR': {
    'field-structure': { density: number; segmentation: number; rhythm: string };
    'diagram-behavior': { node_bias: number; arc_noise: number; correspondence_lock: boolean };
  };
  'INFLUENCE-ENGINE': {
    'INFLUENCE-WEIGHTS': InfluenceWeights;
    'MATERIAL-BEHAVIORS': MaterialBehaviors;
  };
  PALETTE: {
    mode: PaletteMode;
    riso: { plates: Array<{ name: string; hex: string; role: string; opacity: number }>; misregistration_px: number; overprint_logic: string };
    descriptive: { text: string; keywords: string[] };
    image_extract: { enabled: boolean; source_image_id: string; method: ExtractMethod; k: number; palette: Array<{ hex: string; weight: number }>; lock_palette: boolean };
    wheel: { base_hex: string; harmony: WheelHarmony; count: number; rotate_deg: number; palette: string[]; lock_palette: boolean };
  };
  CONSTRAINTS: { forbid: string[]; require: string[] };
  ANIMATION: {
    enabled: boolean;
    fps: number;
    duration_s: number;
    export_mode: 'PROMPT_SHEET' | 'TIMELINE_JSON' | 'BOTH';
    every_n: number;
    keyframes: Array<{ t: number; state?: string; curves: Record<string, number | string> }>;
  };
  MODULES: ModuleToggleMap;
  IGNORE_RULES: { hard_disable: true; preserve_state: true };

  // legacy compatibility mirrors
  mode: HypnagnosisMode;
  subject: string;
  notes: string;
  styleTokens: string[];
  seed: string;
  batchPrefix: string;
  hallucination: number;
  startH: number;
  endH: number;
  curve: 'linear' | 's-curve' | 'exp';
  mutateStrength: number;
  humanizerLevel: number;
  humanizerMin: number;
  humanizerMax: number;
  triptychPanel1State: string;
  evolvePathPreset: string;
  animation: { enabled: boolean; frames: number; curve: 'linear' | 's-curve' | 'exp'; timeline: Array<{ at: number; overrides: Partial<SchemaV2> }>; keyframes: Array<{ t: number; state?: string; curves: Record<string, number | string> }> };
};

export const defaultSchemaV2: SchemaV2 = {
  schemaVersion: 2,
  INPUT: { mode: 'FULL', 'batch-id': 'run', seed: 'oracle-v2-seed', notes: '', subject: '', styleTokens: [] },
  'STATE-MAP': { 'state-name': 'ANCHOR', flow: 'drift' },
  HALLUCINATION: { level: 72 },
  'HYPNA-MATRIX': { temporal: 58, material: 56, space: 52, symbol: 68, agency: 42 },
  'PROMPT-GENOME': {
    structure: { composition: 'fracture', tension: 64, recursion: 48 },
    perception: { grain: 50, 'line-wobble': 46, erasure: 35, annotation: 38 },
  },
  'VISUAL-GRAMMAR': {
    'field-structure': { density: 56, segmentation: 47, rhythm: 'staggered' },
    'diagram-behavior': { node_bias: 58, arc_noise: 44, correspondence_lock: false },
  },
  'INFLUENCE-ENGINE': {
    'INFLUENCE-WEIGHTS': {
      'ink-spray-field': 60,
      'meat-brush-field': 54,
      'collage-break-field': 52,
      'network-map-field': 58,
      'occult-diagram-field': 48,
      'graphic-novel-field': 46,
      'print-material-field': 44,
      'hand-drawn-field': 50,
    },
    'MATERIAL-BEHAVIORS': {
      'ink-spray-field': 'Aerosolized mist, turbulent edges, and splatter recoil from hard stops.',
      'meat-brush-field': 'Smear, scrape, and re-wet passes that drag pigment into stressed anatomy.',
      'collage-break-field': 'Grafted paper shards, abrupt seams, and overpainted joins.',
      'network-map-field': 'Evidence arcs, node clusters, crossing connectors, and annotated vectors.',
      'occult-diagram-field': 'Correspondence rings, sigil-like pivots, and ritual axis alignments.',
      'graphic-novel-field': 'Vintage experimental panel pacing with broken gutters and caption voids.',
      'print-material-field': 'Riso/gelli/screen behavior: flat inks, overprint chatter, press pressure memory.',
      'hand-drawn-field': 'Visible hand pressure drift, hesitant corrections, and re-traced contours.',
    },
  },
  PALETTE: {
    mode: 'RISO_PLATES',
    riso: {
      plates: [
        { name: 'BLACK', hex: '#111111', role: 'keyline', opacity: 1 },
        { name: 'BLUE', hex: '#2358ff', role: 'overlay', opacity: 0.85 },
        { name: 'FLUORO PINK', hex: '#ff477e', role: 'accent', opacity: 0.75 },
      ],
      misregistration_px: 1,
      overprint_logic: 'Stack overlays to create secondary tones with visible plate disagreement.',
    },
    descriptive: { text: '', keywords: [] },
    image_extract: { enabled: false, source_image_id: '', method: 'kmeans', k: 5, palette: [], lock_palette: false },
    wheel: { base_hex: '#5e47ff', harmony: 'triadic', count: 4, rotate_deg: 0, palette: [], lock_palette: false },
  },
  CONSTRAINTS: { forbid: [], require: [] },
  ANIMATION: { enabled: false, fps: 12, duration_s: 2, export_mode: 'BOTH', every_n: 1, keyframes: [] },
  MODULES: {
    INPUT: true,
    STATE_MAP: true,
    HALLUCINATION: true,
    HYPNA_MATRIX: true,
    PROMPT_GENOME: true,
    VISUAL_GRAMMAR: true,
    INFLUENCE_ENGINE: true,
    PALETTE: true,
    CONSTRAINTS: true,
    ANIMATION: false,
  },
  IGNORE_RULES: { hard_disable: true, preserve_state: true },

  mode: 'FULL',
  subject: '',
  notes: '',
  styleTokens: [],
  seed: 'oracle-v2-seed',
  batchPrefix: 'run',
  hallucination: 72,
  startH: 45,
  endH: 88,
  curve: 's-curve',
  mutateStrength: 55,
  humanizerLevel: 56,
  humanizerMin: 35,
  humanizerMax: 84,
  triptychPanel1State: 'ANCHOR',
  evolvePathPreset: 'drift',
  animation: { enabled: false, frames: 24, curve: 's-curve', timeline: [], keyframes: [] },
};

export const mergeSchemaV2 = (base: SchemaV2, patch: DeepPartial<SchemaV2>): SchemaV2 => {
  const output: Record<string, unknown> = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && typeof output[key] === 'object' && output[key] !== null && !Array.isArray(output[key])) {
      output[key] = mergeSchemaV2(output[key] as SchemaV2, value as DeepPartial<SchemaV2>);
    } else if (value !== undefined) {
      output[key] = value;
    }
  });
  return output as SchemaV2;
};
