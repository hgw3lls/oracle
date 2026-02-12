import { migrateToV2 } from '../schema/migrateToV2';
import { type SchemaV2 } from '../schema/hypnagnosisSchemaV2';

export type TimelineKeyframe = {
  t: number;
  state?: string;
  curves: Record<string, number | string>;
};

export type FrameTimeline = {
  fps: number;
  duration_s: number;
  frames: number;
  times: number[];
};

export type PromptCompilerV2 = (schema: SchemaV2, frameOverrides?: Partial<SchemaV2>) => { compiledPrompt: string };

export type ExportSchemaOptions = {
  enabledOnly?: boolean;
};

export type ExportFramePromptSheetOptions = {
  includeDisabledNotes?: boolean;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const keyAliasToSchemaField = (key: string): keyof SchemaV2 | null => {
  const normalized = key.trim().toLowerCase();
  const map: Record<string, keyof SchemaV2> = {
    'hallucination.level': 'hallucination',
    'hypna-matrix.temporal': 'startH',
    'hypna-matrix.material': 'mutateStrength',
    'hypna-matrix.space': 'endH',
    'influence-weights.spray': 'mutateStrength',
    'influence-weights.smear': 'humanizerLevel',
    'influence-weights.collage': 'humanizerMin',
    'influence-weights.network-map': 'humanizerMax',
    'material.ink': 'humanizerLevel',
    'material.paper': 'humanizerMin',
    'state-map.state-name': 'triptychPanel1State',
    hallucination: 'hallucination',
    starth: 'startH',
    endh: 'endH',
    mutatestrength: 'mutateStrength',
    curve: 'curve',
    mode: 'mode',
  };
  return map[normalized] || null;
};

const categoricalFields = new Set<keyof SchemaV2>([
  'triptychPanel1State',
  'curve',
  'mode',
  'mutateMode',
  'mutateScope',
  'mutateAnchor',
]);

const curveKeyAllowed = (curveKey: string, modules: SchemaV2['MODULES']) => {
  const normalized = curveKey.trim().toLowerCase();

  if (normalized.startsWith('influence-weights.') || normalized.startsWith('material-weights.') || normalized.startsWith('material.')) {
    return modules.INFLUENCE_ENGINE;
  }
  if (normalized.startsWith('palette.')) {
    return modules.PALETTE;
  }
  if (normalized.startsWith('hypna-matrix.')) {
    return modules.HYPNA_MATRIX;
  }
  if (normalized.startsWith('state-map.')) {
    return modules.STATE_MAP;
  }
  if (normalized.startsWith('hallucination.')) {
    return modules.HALLUCINATION;
  }

  return true;
};

const filterKeyframesByModules = (keyframes: TimelineKeyframe[], modules: SchemaV2['MODULES']) => keyframes
  .map((frame) => ({
    ...frame,
    state: modules.STATE_MAP ? frame.state : undefined,
    curves: Object.fromEntries(Object.entries(frame.curves).filter(([curveKey]) => curveKeyAllowed(curveKey, modules))),
  }));

const getAnimationKeyframes = (schema: SchemaV2): TimelineKeyframe[] => {
  const animationAny = schema.animation as unknown as { keyframes?: TimelineKeyframe[]; timeline?: Array<{ at: number; overrides: Partial<SchemaV2> }> };

  let keyframes: TimelineKeyframe[];

  if (Array.isArray(animationAny.keyframes) && animationAny.keyframes.length) {
    keyframes = animationAny.keyframes
      .map((kf) => ({ t: clamp01(kf.t), state: kf.state, curves: { ...(kf.curves || {}) } }))
      .sort((a, b) => a.t - b.t);
  } else if (Array.isArray(animationAny.timeline) && animationAny.timeline.length) {
    keyframes = animationAny.timeline
      .map((item) => ({
        t: clamp01(item.at),
        curves: { ...(item.overrides as Record<string, number | string>) },
      }))
      .sort((a, b) => a.t - b.t);
  } else {
    keyframes = [
      { t: 0, curves: { 'HALLUCINATION.level': schema.startH } },
      { t: 1, curves: { 'HALLUCINATION.level': schema.endH } },
    ];
  }

  return filterKeyframesByModules(keyframes, schema.MODULES);
};

const pickClosestKeyframe = (frames: TimelineKeyframe[], t: number) => {
  if (!frames.length) return null;
  const target = clamp01(t);
  let closest = frames[0];
  let bestDist = Math.abs(closest.t - target);
  for (let i = 1; i < frames.length; i += 1) {
    const d = Math.abs(frames[i].t - target);
    if (d < bestDist) {
      closest = frames[i];
      bestDist = d;
    }
  }
  return closest;
};

const numericInterpolate = (frames: TimelineKeyframe[], key: string, t: number): number | null => {
  const target = clamp01(t);
  const points = frames
    .filter((kf) => isNumber(kf.curves[key]))
    .map((kf) => ({ t: kf.t, value: Number(kf.curves[key]) }));

  if (!points.length) return null;
  const prev = [...points].reverse().find((p) => p.t <= target) || points[0];
  const next = points.find((p) => p.t >= target) || points[points.length - 1];
  if (prev.t === next.t) return prev.value;
  const localT = clamp01((target - prev.t) / (next.t - prev.t));
  return prev.value + (next.value - prev.value) * localT;
};

const categoricalSnap = (frames: TimelineKeyframe[], key: string, t: number): string | null => {
  const closest = pickClosestKeyframe(frames.filter((kf) => typeof kf.curves[key] === 'string'), t);
  if (!closest) return null;
  const value = closest.curves[key];
  return typeof value === 'string' ? value : null;
};

export const interpolateAtTime = (schemaInput: SchemaV2, t: number): Partial<SchemaV2> => {
  const schema = migrateToV2(schemaInput);
  const keyframes = getAnimationKeyframes(schema);
  const overrides: Partial<SchemaV2> = {};

  const curveKeys = Array.from(new Set(keyframes.flatMap((kf) => Object.keys(kf.curves))));

  curveKeys.forEach((curveKey) => {
    const field = keyAliasToSchemaField(curveKey);
    if (!field) return;

    if (categoricalFields.has(field) || curveKey.toLowerCase() === 'state-map.state-name') {
      const snapValue = categoricalSnap(keyframes, curveKey, t);
      if (snapValue !== null) {
        (overrides as Record<string, unknown>)[field] = snapValue;
      }
      return;
    }

    const interpolated = numericInterpolate(keyframes, curveKey, t);
    if (interpolated !== null) {
      (overrides as Record<string, unknown>)[field] = interpolated;
    }
  });

  const closest = pickClosestKeyframe(keyframes, t);
  if (schema.MODULES.STATE_MAP && closest?.state) {
    overrides.triptychPanel1State = closest.state;
  }

  return overrides;
};

export const buildFrameTimeline = (schemaInput: SchemaV2): FrameTimeline => {
  const schema = migrateToV2(schemaInput);
  const fps = 12;
  const frames = schema.animation.enabled ? Math.max(1, Math.floor(schema.animation.frames)) : 1;
  const duration_s = frames / fps;
  const times = Array.from({ length: frames }, (_, i) => (frames <= 1 ? 0 : i / (frames - 1)));
  return { fps, duration_s, frames, times };
};

export const buildFrameSeries = (schemaInput: SchemaV2, compilerV2: PromptCompilerV2) => {
  const schema = migrateToV2(schemaInput);
  if (!schema.MODULES.ANIMATION) {
    console.warn('buildFrameSeries: skipped because MODULES.ANIMATION is disabled');
    return [];
  }

  const timeline = buildFrameTimeline(schema);

  return timeline.times.map((t, frameIndex) => {
    const frameOverrides = interpolateAtTime(schema, t);
    const frameState = migrateToV2({ ...schema, ...frameOverrides });
    const { compiledPrompt } = compilerV2(schema, frameOverrides);

    return {
      frameIndex,
      t,
      frameOverrides,
      frameState,
      compiledPrompt,
    };
  });
};


export const exportSchema = (schemaInput: SchemaV2, options: ExportSchemaOptions = {}) => {
  const schema = migrateToV2(schemaInput);
  const enabledOnly = Boolean(options.enabledOnly);

  if (!enabledOnly) {
    return JSON.stringify(schema, null, 2);
  }

  const moduleNames = Object.keys(schema.MODULES) as Array<keyof SchemaV2['MODULES']>;
  const disabledModules = moduleNames.filter((name) => !schema.MODULES[name]);

  return JSON.stringify({
    ...schema,
    exportMeta: {
      mode: 'enabled-only',
      disabledModules,
      note: 'Disabled module blocks are retained and tagged via exportMeta.disabledModules.',
    },
  }, null, 2);
};

export const exportTimelineJSON = (schemaInput: SchemaV2) => {
  const schema = migrateToV2(schemaInput);
  const timeline = buildFrameTimeline(schema);
  const keyframes = getAnimationKeyframes(schema);
  return JSON.stringify({
    schemaVersion: 2,
    animation: {
      ...timeline,
      keyframes,
    },
  }, null, 2);
};

export const exportFramePromptSheet = (
  frames: Array<{ frameIndex: number; t: number; compiledPrompt: string; frameState?: SchemaV2 }>,
  options: ExportFramePromptSheetOptions = {},
) => frames
  .map((frame) => {
    if (!options.includeDisabledNotes) {
      return `# FRAME ${frame.frameIndex + 1} (t=${frame.t.toFixed(4)})\n${frame.compiledPrompt}`;
    }

    const disabledModules = frame.frameState
      ? (Object.keys(frame.frameState.MODULES) as Array<keyof SchemaV2['MODULES']>)
        .filter((moduleName) => !frame.frameState?.MODULES[moduleName])
      : [];

    const disabledNote = disabledModules.length
      ? `Disabled modules: ${disabledModules.join(', ')}`
      : 'Disabled modules: none';

    return `# FRAME ${frame.frameIndex + 1} (t=${frame.t.toFixed(4)})\n${disabledNote}\n${frame.compiledPrompt}`;
  })
  .join('\n\n---\n\n');
