import { HUMANIZER_QUALITIES } from '../models/schema';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export type HypnagnosisMode = 'FULL' | 'STYLE' | 'GESTURE' | 'PRINT' | 'LIVE';
export type EvolutionCurve = 'linear' | 's-curve' | 'exp';
export type PaletteMode = 'RISO_PLATES' | 'DESCRIPTIVE' | 'IMAGE_EXTRACT' | 'COLOR_WHEEL';
export type ExtractMethod = 'median_cut' | 'kmeans';
export type WheelHarmony = 'complementary' | 'analogous' | 'triadic' | 'split_complementary' | 'tetradic' | 'monochrome';

export type HumanizerQualityKey = (typeof HUMANIZER_QUALITIES)[number][0];
export type HumanizerQualitiesMap = Record<HumanizerQualityKey, boolean>;

export type ConstraintBlock = {
  forbid: string[];
  require: string[];
};

export type AnimationTimelinePoint = {
  at: number;
  overrides: Partial<SchemaV2>;
};

export type AnimationKeyframeV2 = {
  t: number;
  state?: string;
  curves: Record<string, number | string>;
};

export type AnimationConfigV2 = {
  enabled: boolean;
  frames: number;
  curve: EvolutionCurve;
  timeline: AnimationTimelinePoint[];
  keyframes: AnimationKeyframeV2[];
};

export type InfluenceWeightKey =
  | 'ink-spray-field'
  | 'meat-brush-field'
  | 'collage-break-field'
  | 'network-map-field'
  | 'occult-diagram-field'
  | 'graphic-novel-field'
  | 'print-material-field'
  | 'hand-drawn-field';

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

export type IgnoreRulesV2 = {
  hard_disable: boolean;
  preserve_state: boolean;
};

export type SchemaV2 = {
  schemaVersion: 2;

  // legacy-compatible root fields
  mode: HypnagnosisMode;
  subject: string;
  notes: string;
  styleTokens: string[];
  hallucination: number;
  evolveEnabled: boolean;
  evolveSteps: number;
  evolvePathPreset: string;
  startH: number;
  endH: number;
  curve: EvolutionCurve;
  mutateEnabled: boolean;
  mutateStrength: number;
  mutateScope: string;
  mutateMode: string;
  mutateAnchor: string;
  lockCore: boolean;
  lockTexture: boolean;
  lockPalette: boolean;
  lockGesture: boolean;
  seed: string;
  batchCount: number;
  batchPrefix: string;
  triptychAuto: boolean;
  triptychPanel1Name: string;
  triptychPanel1State: string;
  triptychPanel1Path: string;
  triptychPanel1Steps: number;
  triptychPanel2Name: string;
  triptychPanel2State: string;
  triptychPanel2Path: string;
  triptychPanel2Steps: number;
  triptychPanel3Name: string;
  triptychPanel3State: string;
  triptychPanel3Path: string;
  triptychPanel3Steps: number;
  humanizerLevel: number;
  autoCopyCompiledPrompt: boolean;
  humanizerMin: number;
  humanizerMax: number;
  humanizerQualities: HumanizerQualitiesMap;
  constraints: ConstraintBlock;
  animation: AnimationConfigV2;

  // Schema V2 structured source of truth
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
    'INFLUENCE-WEIGHTS': Record<InfluenceWeightKey, number>;
    'MATERIAL-BEHAVIORS': Record<InfluenceWeightKey, string>;
  };
  PALETTE: {
    mode: PaletteMode;
    riso: { plates: Array<{ name: string; hex: string; role: string; opacity: number }>; misregistration_px: number; overprint_logic: string };
    descriptive: { text: string; keywords: string[] };
    image_extract: { enabled: boolean; source_image_id: string; method: ExtractMethod; k: number; palette: Array<{ hex: string; weight: number }>; lock_palette: boolean };
    wheel: { base_hex: string; harmony: WheelHarmony; count: number; rotate_deg: number; palette: string[]; lock_palette: boolean };
  };
  CONSTRAINTS: ConstraintBlock;
  ANIMATION: {
    enabled: boolean;
    fps: number;
    duration_s: number;
    export_mode: 'PROMPT_SHEET' | 'TIMELINE_JSON' | 'BOTH';
    every_n: number;
    keyframes: AnimationKeyframeV2[];
  };

  MODULES: ModuleToggleMap;
  IGNORE_RULES: IgnoreRulesV2;
};

export const defaultSchemaV2: SchemaV2 = {
  schemaVersion: 2,
  mode: 'FULL',
  subject: '',
  notes: '',
  styleTokens: ['STYLE.HYPNAGOGIC', 'STYLE.OCCULT'],
  hallucination: 72,
  evolveEnabled: true,
  evolveSteps: 6,
  evolvePathPreset: 'drift',
  startH: 52,
  endH: 92,
  curve: 's-curve',
  mutateEnabled: true,
  mutateStrength: 45,
  mutateScope: 'total',
  mutateMode: 'recursive',
  mutateAnchor: 'gesture+material',
  lockCore: false,
  lockTexture: false,
  lockPalette: false,
  lockGesture: false,
  seed: 'oracle-v2-seed',
  batchCount: 1,
  batchPrefix: 'run',
  triptychAuto: false,
  triptychPanel1Name: 'STATE 1',
  triptychPanel1State: 'ANCHOR',
  triptychPanel1Path: 'collapse',
  triptychPanel1Steps: 5,
  triptychPanel2Name: 'STATE 2',
  triptychPanel2State: 'POROUS',
  triptychPanel2Path: 'drift',
  triptychPanel2Steps: 5,
  triptychPanel3Name: 'STATE 3',
  triptychPanel3State: 'WATCHER',
  triptychPanel3Path: 'fracture',
  triptychPanel3Steps: 5,
  humanizerLevel: 60,
  autoCopyCompiledPrompt: false,
  humanizerMin: 35,
  humanizerMax: 88,
  humanizerQualities: Object.fromEntries(HUMANIZER_QUALITIES.map(([key]) => [key, false])) as HumanizerQualitiesMap,
  constraints: { forbid: [], require: [] },
  animation: { enabled: false, frames: 24, curve: 's-curve', timeline: [], keyframes: [] },

  INPUT: { mode: 'FULL', 'batch-id': 'run', seed: 'oracle-v2-seed', notes: '', subject: '', styleTokens: ['STYLE.HYPNAGOGIC', 'STYLE.OCCULT'] },
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
      'ink-spray-field': 'Aerosolized mist and turbulent splatter recoil.',
      'meat-brush-field': 'Smear and scrape passes with dragged pigment.',
      'collage-break-field': 'Paper graft seams with abrupt overpaint joins.',
      'network-map-field': 'Evidence arcs, nodes, and crossing connectors.',
      'occult-diagram-field': 'Correspondence rings and sigil pivot geometry.',
      'graphic-novel-field': 'Vintage experimental panel pacing and gutter breaks.',
      'print-material-field': 'Riso/gelli/screen flat ink with overprint chatter.',
      'hand-drawn-field': 'Visible hand pressure drift and retraced contour wobble.',
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
      overprint_logic: 'Visible overlap and slight misregistration.',
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
};

export const mergeSchemaV2 = <T>(base: T, patch: DeepPartial<T>): T => {
  const output = { ...(base as Record<string, unknown>) };
  Object.entries(patch as Record<string, unknown>).forEach(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === 'object' &&
      !Array.isArray(output[key])
    ) {
      output[key] = mergeSchemaV2(output[key], value as DeepPartial<typeof output[key]>);
    } else if (value !== undefined) {
      output[key] = value;
    }
  });
  return output as T;
};
