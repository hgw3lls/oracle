import type { AnimationCurveValue, AnimationKeyframe, SchemaV2 } from '@/core/schema/schemaV2';
import { compilePromptV2 } from '../compilePromptV2';
import { pathGet, pathSet } from '@/shared/utils/path';
import { isCurvePathAllowed, moduleForCurvePath, timelineTimes } from './timeline';

export type FrameRecord = {
  frameIndex: number;
  t: number;
  frameSchema: SchemaV2;
  compiledPrompt: string;
};

export type FrameSeriesResult = {
  status: 'ok' | 'animation_disabled';
  frames: FrameRecord[];
};

const sortKeyframes = (keyframes: AnimationKeyframe[]) => [...keyframes].sort((a, b) => a.t - b.t);

function nearestValueForPath(path: string, keyframes: AnimationKeyframe[], t: number): AnimationCurveValue | undefined {
  const withPath = keyframes.filter((k) => Object.prototype.hasOwnProperty.call(k.curves, path));
  if (withPath.length === 0) return undefined;
  return withPath
    .map((k) => ({ d: Math.abs(k.t - t), v: k.curves[path] }))
    .sort((a, b) => a.d - b.d)[0].v;
}

export function interpolateAtTime(schema: SchemaV2, t: number): SchemaV2 {
  const frame = JSON.parse(JSON.stringify(schema)) as SchemaV2;
  const keyframes = sortKeyframes(schema.ANIMATION.keyframes);
  if (keyframes.length === 0) return frame;

  const curvePaths = new Set<string>();
  keyframes.forEach((kf) => Object.keys(kf.curves).forEach((p) => curvePaths.add(p)));

  for (const path of curvePaths) {
    if (!isCurvePathAllowed(path)) continue;

    const moduleKey = moduleForCurvePath(path);
    if (schema.IGNORE_RULES.hard_disable && moduleKey && !schema.MODULES[moduleKey]) {
      continue;
    }

    const nearest = nearestValueForPath(path, keyframes, t);
    if (nearest === undefined) continue;

    if (typeof nearest === 'string') {
      Object.assign(frame, pathSet(frame as Record<string, unknown>, path, nearest));
      continue;
    }

    const points = keyframes
      .filter((k) => typeof k.curves[path] === 'number')
      .map((k) => ({ t: k.t, v: Number(k.curves[path]) }))
      .sort((a, b) => a.t - b.t);

    if (points.length === 0) continue;
    if (points.length === 1 || t <= points[0].t) {
      Object.assign(frame, pathSet(frame as Record<string, unknown>, path, points[0].v));
      continue;
    }
    if (t >= points[points.length - 1].t) {
      Object.assign(frame, pathSet(frame as Record<string, unknown>, path, points[points.length - 1].v));
      continue;
    }

    let left = points[0];
    let right = points[points.length - 1];
    for (let i = 0; i < points.length - 1; i += 1) {
      if (t >= points[i].t && t <= points[i + 1].t) {
        left = points[i];
        right = points[i + 1];
        break;
      }
    }

    const span = right.t - left.t || 1;
    const alpha = (t - left.t) / span;
    const value = left.v + (right.v - left.v) * alpha;
    Object.assign(frame, pathSet(frame as Record<string, unknown>, path, value));
  }

  return frame;
}

export function buildFrameSeries(schema: SchemaV2): FrameSeriesResult {
  if (!schema.MODULES.ANIMATION) {
    return { status: 'animation_disabled', frames: [] };
  }

  const allTimes = timelineTimes(schema);
  const selectedTimes = (() => {
    if (schema.ANIMATION.export_mode === 'keyframes_only') {
      return sortKeyframes(schema.ANIMATION.keyframes).map((k) => k.t);
    }
    if (schema.ANIMATION.export_mode === 'every_n') {
      const n = Math.max(1, Math.round(schema.ANIMATION.every_n));
      return allTimes.filter((_, i) => i % n === 0);
    }
    return allTimes;
  })();

  const frames = selectedTimes.map((t, frameIndex) => {
    const frameSchema = interpolateAtTime(schema, t);
    const compiledPrompt = compilePromptV2(frameSchema).compiledPrompt;
    return { frameIndex, t, frameSchema, compiledPrompt };
  });

  return { status: 'ok', frames };
}

export function exportTimelineJson(series: FrameSeriesResult): string {
  return JSON.stringify(series, null, 2);
}

export function exportFramePromptSheet(series: FrameSeriesResult): string {
  return series.frames
    .map((f) => `# Frame ${f.frameIndex} (t=${f.t.toFixed(3)})\n${f.compiledPrompt}`)
    .join('\n\n');
}

export function getInterpolatedValue(schema: SchemaV2, t: number, path: string): unknown {
  return pathGet(interpolateAtTime(schema, t) as Record<string, unknown>, path);
}
