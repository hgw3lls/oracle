import { autoEvolve, type AutoEvolveInput, type EvolveParams, type EvolvePathPreset } from './autoEvolve';
import { compilePrompt, expandStyleTokens, type HypnaMode } from './compilePrompt';
import { clamp, rngFromSeed } from './random';

export interface Frame {
  id: string;
  index: number;
  seed: string;
  state: EvolveParams;
  compiledPrompt: string;
  meta: {
    mode: 'evolution' | 'interpolated';
    t: number;
    diffSummary?: string;
  };
}

export interface FrameEngineBaseState {
  mode?: HypnaMode;
  subject?: string;
  notes?: string;
  styleTokens?: string[];
  seed?: string;
  startParams?: Partial<EvolveParams>;
}

export interface FrameEngineSettings {
  evolvePathPreset?: EvolvePathPreset;
  curve?: AutoEvolveInput['curve'];
  mutationStrength?: number;
  humanizerRange?: { min: number; max: number };
  startH?: number;
  endH?: number;
  locks?: AutoEvolveInput['locks'];
  jitterAmount?: number;
  endParams?: Partial<EvolveParams>;
  batchId?: string;
}

const DEFAULT_START: EvolveParams = {
  hallucination: 52,
  temporal: 55,
  material: 55,
  space: 55,
  symbol: 55,
  agency: 55,
  grain: 40,
  'line-wobble': 40,
  erasure: 32,
  annotation: 42,
  palette: 50,
  gesture: 48,
};

const numericKeys = Object.keys(DEFAULT_START) as Array<keyof EvolveParams>;

const forceFrameCount = (nFrames: number) => Math.max(1, Math.min(300, Number(nFrames) || 1));

const stateFrom = (baseState: FrameEngineBaseState, settings: FrameEngineSettings): EvolveParams => {
  const start = { ...DEFAULT_START, ...(baseState.startParams || {}) };
  if (settings.startH != null) start.hallucination = settings.startH;
  return start;
};

const endStateFrom = (start: EvolveParams, settings: FrameEngineSettings): EvolveParams => {
  const end = { ...start, ...(settings.endParams || {}) };
  if (settings.endH != null) end.hallucination = settings.endH;
  return end;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const curveValue = (curve: AutoEvolveInput['curve'], t: number) => {
  const x = Math.max(0, Math.min(1, t));
  if (curve === 's-curve') return x * x * (3 - 2 * x);
  if (curve === 'exp') return (Math.exp(3 * x) - 1) / (Math.exp(3) - 1);
  return x;
};

const buildPrompt = (
  baseState: FrameEngineBaseState,
  settings: FrameEngineSettings,
  params: EvolveParams,
  index: number,
  nFrames: number,
  frameSeed: string,
) => {
  const mode = baseState.mode || 'FULL';
  const styleTokens = baseState.styleTokens || [];
  return compilePrompt({
    mode,
    subject: baseState.subject,
    notes: baseState.notes,
    styleTokens,
    styleExpanded: expandStyleTokens(styleTokens),
    hallucination: Math.round(params.hallucination),
    step: index,
    steps: nFrames,
    batchId: settings.batchId || 'frames',
    seed: frameSeed,
    hypnaMatrix: {
      temporal: Math.round(params.temporal),
      material: Math.round(params.material),
      space: Math.round(params.space),
      symbol: Math.round(params.symbol),
      agency: Math.round(params.agency),
    },
    autoGesture: {
      mode: settings.evolvePathPreset || 'drift',
      pressure: Math.round(params.gesture),
      jitter: Math.round(params['line-wobble']),
    },
    autoComp: {
      composition: settings.evolvePathPreset || 'drift',
      tension: Math.round(params.erasure),
      framing: Math.round(params.annotation),
      horizon: Math.round(params.space),
    },
    humanizer: {
      'level(0-100)': Math.round(clamp(settings.humanizerRange?.max ?? 65, 0, 100)),
      qualities: 'frame playback',
    },
    printLayer: {
      'plate-palette': Math.round(params.palette),
    },
  });
};

export const generateFramesFromEvolution = (
  baseState: FrameEngineBaseState,
  settings: FrameEngineSettings,
  nFrames: number,
  seed: string,
): Frame[] => {
  const frameCount = forceFrameCount(nFrames);
  const workingSeed = String(seed || baseState.seed || 'oracle-frame-seed');
  const snapshots = autoEvolve({
    mode: baseState.mode || 'FULL',
    seed: workingSeed,
    steps: frameCount,
    curve: settings.curve || 's-curve',
    pathPreset: settings.evolvePathPreset || 'drift',
    mutationStrength: clamp(settings.mutationStrength ?? 45, 0, 100),
    subject: baseState.subject,
    notes: baseState.notes,
    styleTokens: baseState.styleTokens || [],
    batchId: settings.batchId || 'frames-evolution',
    locks: settings.locks || {},
    humanizerRange: settings.humanizerRange || { min: 35, max: 88 },
    targetHallucination: settings.endH,
    startParams: stateFrom(baseState, settings),
  });

  return snapshots.map((snapshot, index) => {
    const frameSeed = `${workingSeed}::f${index + 1}`;
    return {
      id: `${settings.batchId || 'evolution'}-${index + 1}`,
      index,
      seed: frameSeed,
      state: snapshot.params,
      compiledPrompt: snapshot.compiledPrompt,
      meta: {
        mode: 'evolution',
        t: frameCount === 1 ? 0 : index / (frameCount - 1),
        diffSummary: snapshot.diffSummary,
      },
    };
  });
};

export const generateFramesInterpolated = (
  baseState: FrameEngineBaseState,
  settings: FrameEngineSettings,
  nFrames: number,
  seed: string,
): Frame[] => {
  const frameCount = forceFrameCount(nFrames);
  const start = stateFrom(baseState, settings);
  const end = endStateFrom(start, settings);
  const curve = settings.curve || 'linear';
  const jitterAmount = clamp(settings.jitterAmount ?? 2.5, 0, 20);
  const rootSeed = String(seed || baseState.seed || 'oracle-frame-seed');
  const rng = rngFromSeed(`${rootSeed}::interpolated`);

  return Array.from({ length: frameCount }).map((_, index) => {
    const tRaw = frameCount === 1 ? 0 : index / (frameCount - 1);
    const t = curveValue(curve, tRaw);
    const params = { ...start } as EvolveParams;

    numericKeys.forEach((key) => {
      const jitter = ((rng() - 0.5) * 2 * jitterAmount) * (key === 'hallucination' ? 0.6 : 1);
      params[key] = clamp(lerp(start[key], end[key], t) + jitter, 0, 100);
    });

    const frameSeed = `${rootSeed}::i${index + 1}`;
    return {
      id: `${settings.batchId || 'interpolated'}-${index + 1}`,
      index,
      seed: frameSeed,
      state: params,
      compiledPrompt: buildPrompt(baseState, settings, params, index, frameCount, frameSeed),
      meta: {
        mode: 'interpolated',
        t,
        diffSummary: `interpolated t=${t.toFixed(3)}`,
      },
    };
  });
};
