import { autoEvolve } from './autoEvolve';

const stateDefaults = (i, n) => {
  const t = i / Math.max(1, n - 1);
  if (t < 0.17) return { label: 'ANCHOR', flow: 'stable horizon' };
  if (t < 0.33) return { label: 'POROUS', flow: 'soft drift' };
  if (t < 0.5) return { label: 'WATCHER', flow: 'compression' };
  if (t < 0.67) return { label: 'COLLAPSE', flow: 'gravity vectors' };
  if (t < 0.84) return { label: 'BLOOM', flow: 'nested rings' };
  return { label: 'RETURN', flow: 'partial closure' };
};

const pathFromForm = (value) => {
  const normalized = String(value || 'drift').toLowerCase();
  if (['collapse', 'drift', 'bloom', 'fracture', 'return'].includes(normalized)) return normalized;
  return 'drift';
};

export const generateEvolutionSeries = ({ form, seed, batchId = 'run-001', hallucinationRange, linkedFrom = null }) => {
  const startH = hallucinationRange?.startH ?? form.startH;
  const endH = hallucinationRange?.endH ?? form.endH;

  const snapshots = autoEvolve({
    mode: form.mode,
    seed: seed || form.seed,
    steps: form.evolveEnabled ? form.evolveSteps : 1,
    curve: form.curve === 'ease-in' || form.curve === 'ease-out' ? 'exp' : form.curve,
    pathPreset: pathFromForm(form.evolvePathPreset),
    mutationStrength: form.mutateEnabled ? form.mutateStrength : 0,
    subject: form.subject,
    notes: form.notes,
    styleTokens: form.styleTokens,
    batchId,
    locks: {
      core: Boolean(form.lockCore),
      texture: Boolean(form.lockTexture),
      palette: Boolean(form.lockPalette),
      gesture: Boolean(form.lockGesture),
    },
    humanizerRange: {
      min: form.humanizerMin,
      max: form.humanizerMax,
    },
    targetHallucination: endH,
    startParams: {
      hallucination: startH,
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
    },
    clamps: {
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
    },
  });

  return snapshots.map((snapshot, i) => {
    const sd = stateDefaults(i, snapshots.length);
    return {
      mode: form.mode,
      subject: form.subject,
      notes: form.notes,
      styleTokens: form.styleTokens,
      step: snapshot.stepIndex,
      steps: snapshots.length,
      stateName: sd.label,
      flow: sd.flow,
      seed: seed || form.seed,
      batchId,
      linkedFrom,
      hallucination: Math.round(snapshot.params.hallucination),
      temporal: Math.round(snapshot.params.temporal),
      material: Math.round(snapshot.params.material),
      space: Math.round(snapshot.params.space),
      symbol: Math.round(snapshot.params.symbol),
      agency: Math.round(snapshot.params.agency),
      saturation: snapshot.params.palette > 65 ? 'dense' : snapshot.params.palette > 40 ? 'balanced' : 'sparse',
      motion: snapshot.params.gesture > 70 ? 'explosive' : snapshot.params.gesture > 45 ? 'kinetic' : 'flowing',
      grain: Math.round(snapshot.params.grain),
      lineWobble: Math.round(snapshot.params['line-wobble']),
      erasure: Math.round(snapshot.params.erasure),
      annotation: Math.round(snapshot.params.annotation),
      paletteValue: Math.round(snapshot.params.palette),
      gestureValue: Math.round(snapshot.params.gesture),
      diffSummary: snapshot.diffSummary,
      mutationNote: `${form.evolvePathPreset}/${form.curve}@${form.mutateStrength}`,
      prompt: snapshot.compiledPrompt,
    };
  });
};

export const generateBatches = (form) => {
  const runs = Math.max(1, Math.min(30, Number(form.batchCount) || 1));
  const batches = [];

  for (let i = 0; i < runs; i += 1) {
    const batchId = `${form.batchPrefix || 'run'}-${String(i + 1).padStart(3, '0')}`;
    const seed = `${form.seed}::${batchId}`;
    const states = generateEvolutionSeries({ form, seed, batchId });
    batches.push({
      batchId,
      seed,
      stateCount: states.length,
      hallucinationRange: [states[0]?.hallucination, states.at(-1)?.hallucination],
      states,
    });
  }

  return {
    createdAt: new Date().toISOString(),
    mode: form.mode,
    runs,
    mutateEnabled: form.mutateEnabled,
    triptychAuto: form.triptychAuto,
    batches,
  };
};
