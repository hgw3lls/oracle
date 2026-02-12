import { HUMANIZER_QUALITIES } from '../models/schema';

export type HypnagnosisMode = 'FULL' | 'STYLE' | 'GESTURE' | 'PRINT' | 'LIVE';
export type EvolutionCurve = 'linear' | 's-curve' | 'exp';

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

export type SchemaV2 = {
  schemaVersion: 2;
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
  constraints: {
    forbid: [],
    require: [],
  },
  animation: {
    enabled: false,
    frames: 24,
    curve: 's-curve',
    timeline: [],
    keyframes: [],
  },
};
