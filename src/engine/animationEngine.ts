import { compilePromptV2 } from './compilePromptV2';
import { type SchemaV2 } from '../schema/hypnagnosisSchemaV2';
import { migrateToV2 } from '../schema/migrateToV2';

export type Keyframe = { t: number; state?: string; curves: Record<string, number | string> };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const moduleFromCurve = (path: string): keyof SchemaV2['MODULES'] | null => {
  if (path.startsWith('INPUT.')) return 'INPUT';
  if (path.startsWith('STATE-MAP.')) return 'STATE_MAP';
  if (path.startsWith('HALLUCINATION.')) return 'HALLUCINATION';
  if (path.startsWith('HYPNA-MATRIX.')) return 'HYPNA_MATRIX';
  if (path.startsWith('PROMPT-GENOME.')) return 'PROMPT_GENOME';
  if (path.startsWith('VISUAL-GRAMMAR.')) return 'VISUAL_GRAMMAR';
  if (path.startsWith('INFLUENCE-ENGINE.')) return 'INFLUENCE_ENGINE';
  if (path.startsWith('PALETTE.')) return 'PALETTE';
  if (path.startsWith('CONSTRAINTS.')) return 'CONSTRAINTS';
  if (path.startsWith('ANIMATION.')) return 'ANIMATION';
  return null;
};

const getByPath = (obj: Record<string, unknown>, path: string): unknown => path.split('.').reduce((acc: unknown, key) => {
  if (typeof acc === 'object' && acc !== null) return (acc as Record<string, unknown>)[key];
  return undefined;
}, obj);

const setByPath = (obj: Record<string, unknown>, path: string, value: unknown) => {
  const keys = path.split('.');
  let cur: Record<string, unknown> = obj;
  keys.forEach((key, idx) => {
    if (idx === keys.length - 1) {
      cur[key] = value;
      return;
    }
    if (typeof cur[key] !== 'object' || cur[key] === null) cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  });
};

export const interpolateAtTime = (schemaInput: SchemaV2, tRaw: number) => {
  const schema = migrateToV2(schemaInput);
  const t = clamp01(tRaw);
  const keyframes = [...(schema.ANIMATION.keyframes || [])].sort((a, b) => a.t - b.t);
  const allowed = keyframes.map((kf) => ({
    ...kf,
    curves: Object.fromEntries(Object.entries(kf.curves).filter(([curve]) => {
      const moduleName = moduleFromCurve(curve);
      return !moduleName || schema.MODULES[moduleName];
    })),
  }));

  const overrides: Record<string, unknown> = {};
  const keys = Array.from(new Set(allowed.flatMap((kf) => Object.keys(kf.curves))));

  keys.forEach((path) => {
    const points = allowed
      .filter((kf) => kf.curves[path] !== undefined)
      .map((kf) => ({ t: clamp01(kf.t), value: kf.curves[path] }));
    if (!points.length) return;

    const prev = [...points].reverse().find((pt) => pt.t <= t) || points[0];
    const next = points.find((pt) => pt.t >= t) || points[points.length - 1];

    if (isNum(prev.value) && isNum(next.value)) {
      const span = Math.max(1e-8, next.t - prev.t);
      const local = clamp01((t - prev.t) / span);
      setByPath(overrides, path, prev.value + (next.value - prev.value) * local);
    } else {
      setByPath(overrides, path, t < next.t ? prev.value : next.value);
    }
  });

  const closest = allowed.reduce((acc, frame) => (Math.abs(frame.t - t) < Math.abs(acc.t - t) ? frame : acc), allowed[0]);
  if (closest?.state && schema.MODULES.STATE_MAP) setByPath(overrides, 'STATE-MAP.state-name', closest.state);

  return overrides as Partial<SchemaV2>;
};

export const buildFrameSeries = (schemaInput: SchemaV2) => {
  const schema = migrateToV2(schemaInput);
  if (!schema.MODULES.ANIMATION || !schema.ANIMATION.enabled) return [];

  const totalFrames = Math.max(1, Math.floor(schema.ANIMATION.duration_s * schema.ANIMATION.fps));
  return Array.from({ length: totalFrames }, (_, frameIndex) => {
    const t = totalFrames <= 1 ? 0 : frameIndex / (totalFrames - 1);
    const frameOverrides = interpolateAtTime(schema, t);

    const merged = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
    Object.keys(frameOverrides).forEach((k) => setByPath(merged, k, getByPath(frameOverrides as Record<string, unknown>, k)));

    const frameState = migrateToV2(merged);
    const { compiledPrompt } = compilePromptV2(frameState);

    return { frameIndex, t, compiledPrompt, frameState };
  });
};

export const exportFramePromptSheet = (frames: Array<{ frameIndex: number; t: number; compiledPrompt: string }>, options?: { every_n?: number }) => {
  const every = Math.max(1, options?.every_n ?? 1);
  return frames
    .filter((_, idx) => idx % every === 0)
    .map((f) => `# FRAME ${f.frameIndex + 1} t=${f.t.toFixed(4)}\n${f.compiledPrompt}`)
    .join('\n\n---\n\n');
};

export const exportTimelineJSON = (schemaInput: SchemaV2) => {
  const schema = migrateToV2(schemaInput);
  return JSON.stringify({ schemaVersion: 2, ANIMATION: schema.ANIMATION }, null, 2);
};
