import { compilePrompt, expandStyleTokens } from './compilePrompt';
import { rngFromSeed } from './random';

export type EvolvePathPreset = 'collapse' | 'drift' | 'bloom' | 'fracture' | 'return';
export type EvolveCurve = 'linear' | 's-curve' | 'exp';

export interface EvolveParams {
  hallucination: number;
  temporal: number;
  material: number;
  space: number;
  symbol: number;
  agency: number;
  grain: number;
  'line-wobble': number;
  erasure: number;
  annotation: number;
  palette: number;
  gesture: number;
}

export interface ParameterLocks {
  core?: boolean;
  texture?: boolean;
  palette?: boolean;
  gesture?: boolean;
}

export interface HumanizerRange {
  min: number;
  max: number;
}

export interface AutoEvolveInput {
  mode: 'FULL' | 'STYLE' | 'GESTURE' | 'PRINT' | 'LIVE';
  seed: string | number;
  steps: number;
  curve: EvolveCurve;
  pathPreset: EvolvePathPreset;
  mutationStrength: number;
  subject?: string;
  notes?: string;
  styleTokens?: string[];
  startParams: EvolveParams;
  targetHallucination?: number;
  locks?: ParameterLocks;
  clamps?: Partial<Record<keyof EvolveParams, [number, number]>>;
  humanizerRange: HumanizerRange;
  stateNamePrefix?: string;
  batchId?: string;
}

export interface StateSnapshot {
  stepIndex: number;
  params: EvolveParams;
  compiledPrompt: string;
  diffSummary: string;
}

const clampTo = (value: number, range: [number, number]) => Math.max(range[0], Math.min(range[1], value));
const clamp01 = (v: number) => Math.max(0, Math.min(100, v));

const curveValue = (curve: EvolveCurve, t: number) => {
  const x = Math.max(0, Math.min(1, t));
  if (curve === 's-curve') return x * x * (3 - 2 * x);
  if (curve === 'exp') return (Math.exp(3 * x) - 1) / (Math.exp(3) - 1);
  return x;
};

const PATH_VECTORS: Record<EvolvePathPreset, Partial<EvolveParams>> = {
  collapse: { hallucination: 12, temporal: -10, material: 8, space: -18, symbol: 10, agency: -12, grain: 8, erasure: 10, palette: -6, gesture: -10 },
  drift: { hallucination: 6, temporal: 8, material: -4, space: 6, symbol: 7, agency: -3, grain: 4, annotation: 5, palette: 3, gesture: 6 },
  bloom: { hallucination: 14, temporal: 10, material: -8, space: 12, symbol: 15, agency: -8, grain: 10, 'line-wobble': 12, palette: 12, gesture: 11 },
  fracture: { hallucination: 18, temporal: -8, material: 10, space: -10, symbol: 18, agency: -16, grain: 14, erasure: 14, annotation: 11, palette: 9, gesture: 13 },
  return: { hallucination: -12, temporal: 6, material: 8, space: 10, symbol: -10, agency: 10, grain: -8, erasure: -7, palette: -6, gesture: -9 },
};

const IMPERFECTION_VOCAB = [
  'pressure variation',
  'wobble lines',
  'hesitation marks',
  'broken edges',
  'visible redraws',
  'smudge drift',
  'ink bleed',
  'paper tooth noise',
  'misregistration shimmer',
  'ghost plate memory',
];

const defaultClamps = (): Record<keyof EvolveParams, [number, number]> => ({
  hallucination: [0, 100],
  temporal: [0, 100],
  material: [0, 100],
  space: [0, 100],
  symbol: [0, 100],
  agency: [0, 100],
  grain: [0, 100],
  'line-wobble': [0, 100],
  erasure: [0, 100],
  annotation: [0, 100],
  palette: [0, 100],
  gesture: [0, 100],
});

const lockGroupFor = (key: keyof EvolveParams): keyof ParameterLocks => {
  if (['hallucination', 'temporal', 'material', 'space', 'symbol', 'agency'].includes(key)) return 'core';
  if (['grain', 'line-wobble', 'erasure', 'annotation'].includes(key)) return 'texture';
  if (key === 'palette') return 'palette';
  return 'gesture';
};

const buildDiffSummary = (prev: EvolveParams | null, next: EvolveParams): string => {
  if (!prev) return 'seeded baseline';
  const parts = (Object.keys(next) as Array<keyof EvolveParams>)
    .map((key) => {
      const diff = Math.round(next[key] - prev[key]);
      if (!diff) return null;
      const sign = diff > 0 ? '+' : '';
      return `${key} ${sign}${diff}`;
    })
    .filter(Boolean);
  return parts.length ? parts.slice(0, 6).join(' | ') : 'no-op';
};

const vocabForJitter = (rng: () => number, humanizerLevel: number): string => {
  const count = Math.max(1, Math.min(4, Math.round(humanizerLevel / 28)));
  const picks: string[] = [];
  for (let i = 0; i < count; i += 1) {
    picks.push(IMPERFECTION_VOCAB[Math.floor(rng() * IMPERFECTION_VOCAB.length)]);
  }
  return Array.from(new Set(picks)).join(', ');
};

const hallucinationTargetForce = (target: number | undefined, start: number, curved: number) => {
  if (target == null || Number.isNaN(Number(target))) return 0;
  return (Number(target) - start) * curved;
};

export const autoEvolve = (input: AutoEvolveInput): StateSnapshot[] => {
  const steps = Math.max(1, Math.min(30, Number(input.steps) || 1));
  const rng = rngFromSeed(String(input.seed));
  const clamps = { ...defaultClamps(), ...(input.clamps || {}) };
  const styleTokens = input.styleTokens || [];
  const styleExpanded = expandStyleTokens(styleTokens);
  const pathVector = PATH_VECTORS[input.pathPreset];
  const lockConfig = input.locks || {};
  const humanizerMin = clamp01(input.humanizerRange.min);
  const humanizerMax = clamp01(input.humanizerRange.max);

  let prev: EvolveParams | null = null;

  return Array.from({ length: steps }).map((_, i) => {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const curved = curveValue(input.curve, t);
    const humanizerLevel = clamp01(humanizerMin + (humanizerMax - humanizerMin) * curved);
    const jitterScale = (humanizerLevel / 100) * (input.mutationStrength / 100);

    const params = { ...input.startParams } as EvolveParams;

    (Object.keys(params) as Array<keyof EvolveParams>).forEach((key) => {
      const lockGroup = lockGroupFor(key);
      if (lockConfig[lockGroup]) {
        params[key] = prev ? prev[key] : params[key];
        return;
      }

      const base = prev ? prev[key] : params[key];
      const directional = (pathVector[key] || 0) * curved;
      const hallucinationPull = key === 'hallucination'
        ? hallucinationTargetForce(input.targetHallucination, input.startParams.hallucination, curved)
        : 0;
      const jitter = (rng() - 0.5) * 2 * 18 * jitterScale;
      params[key] = clampTo(base + directional + hallucinationPull + jitter, clamps[key]);
    });

    const diffSummary = buildDiffSummary(prev, params);
    const imperfectionVocab = vocabForJitter(rng, humanizerLevel);

    const compiledPrompt = compilePrompt({
      mode: input.mode,
      subject: input.subject,
      notes: input.notes,
      styleTokens,
      styleExpanded,
      hallucination: Math.round(params.hallucination),
      step: i,
      steps,
      batchId: input.batchId || 'run-001',
      seed: String(input.seed),
      hypnaMatrix: {
        temporal: Math.round(params.temporal),
        material: Math.round(params.material),
        space: Math.round(params.space),
        symbol: Math.round(params.symbol),
        agency: Math.round(params.agency),
      },
      stateMap: {
        'state-name': `${input.stateNamePrefix || input.pathPreset.toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
        flow: input.pathPreset,
      },
      autoGesture: {
        mode: input.pathPreset,
        pressure: Math.round(params.gesture),
        jitter: Math.round(params['line-wobble']),
      },
      autoComp: {
        composition: input.pathPreset,
        tension: Math.round(params.erasure),
        framing: Math.round(params.annotation),
        horizon: Math.round(params.space),
      },
      autoEvolve: {
        enabled: true,
        steps,
        curve: input.curve,
        path: input.pathPreset,
        'mutation-strength': input.mutationStrength,
        locks: JSON.stringify(lockConfig),
      },
      humanizer: {
        'level(0-100)': Math.round(humanizerLevel),
        qualities: imperfectionVocab,
      },
      printLayer: {
        'plate-palette': Math.round(params.palette),
      },
    });

    const snapshot: StateSnapshot = {
      stepIndex: i,
      params,
      compiledPrompt,
      diffSummary,
    };

    prev = params;
    return snapshot;
  });
};
