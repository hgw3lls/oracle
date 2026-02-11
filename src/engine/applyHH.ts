import type { HHParseResult } from './hhMacroParser';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(n) || 0));
const boolFrom = (v: unknown) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return Boolean(v);
};

const maybeNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export const applyHHToState = (parsed: HHParseResult, state: Record<string, unknown>) => {
  const blocks = parsed.blocks || {};
  const next = { ...state } as Record<string, unknown>;

  if (blocks.subject != null) next.subject = blocks.subject;
  if (blocks.handrawHuman != null) next.handrawHuman = Boolean(blocks.handrawHuman);

  const autoEvolve = blocks.autoEvolve || {};
  const steps = maybeNumber(autoEvolve.steps);
  if (steps != null) next.evolveSteps = clamp(steps, 1, 20);
  if (typeof autoEvolve.curve === 'string') next.curve = autoEvolve.curve;
  if (typeof autoEvolve.path === 'string') next.evolvePathPreset = autoEvolve.path;
  if (autoEvolve.enabled != null) next.evolveEnabled = boolFrom(autoEvolve.enabled);

  const startH = maybeNumber(autoEvolve['start-h']);
  if (startH != null) next.startH = clamp(startH, 0, 100);
  const endH = maybeNumber(autoEvolve['end-h']);
  if (endH != null) next.endH = clamp(endH, 0, 100);

  const mutateStrength = maybeNumber(autoEvolve['mutation-strength']);
  if (mutateStrength != null) {
    next.mutateStrength = clamp(mutateStrength, 0, 100);
    next.mutateEnabled = clamp(mutateStrength, 0, 100) > 0;
  }
  if (typeof autoEvolve['mutation-scope'] === 'string') next.mutateScope = autoEvolve['mutation-scope'];
  if (typeof autoEvolve['mutation-mode'] === 'string') next.mutateMode = autoEvolve['mutation-mode'];
  if (autoEvolve.mutation != null) next.mutateEnabled = boolFrom(autoEvolve.mutation);

  const hypna = blocks.hypnaMatrix || {};
  const hallucination = maybeNumber(hypna.hallucination);
  if (hallucination != null) {
    const h = clamp(hallucination, 0, 100);
    next.startH = h;
    next.endH = h;
  }

  const gesture = blocks.gesture || {};
  const pressure = maybeNumber(gesture.pressure);
  if (pressure != null) {
    const p = clamp(pressure, 0, 100);
    const existing = maybeNumber(next.mutateStrength);
    next.mutateStrength = clamp((existing ?? 0) * 0.65 + p * 0.35, 0, 100);
  }

  const vibeReference = blocks.vibeReference || {};
  if (typeof vibeReference.description === 'string' && vibeReference.description) {
    next.notes = vibeReference.description;
  }

  const stateMap = blocks.stateMap || {};
  if (typeof stateMap.flow === 'string' && stateMap.flow) {
    next.batchPrefix = stateMap.flow;
  }

  const composition = blocks.composition || {};
  if (typeof composition.composition === 'string' && composition.composition) {
    next.evolvePathPreset = composition.composition;
  }

  next.hhBlocks = blocks;

  return next;
};
