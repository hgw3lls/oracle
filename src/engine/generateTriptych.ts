import { autoEvolve, type AutoEvolveInput, type EvolvePathPreset, type ParameterLocks, type StateSnapshot } from './autoEvolve';

export interface TriptychPanelRecipe {
  panelName: string;
  stateName: string;
  pathPreset: EvolvePathPreset;
  steps: number;
  locks: ParameterLocks;
}

export interface TriptychRecipe {
  panels: [TriptychPanelRecipe, TriptychPanelRecipe, TriptychPanelRecipe];
}

export interface TriptychBaseState {
  mode: 'FULL' | 'STYLE' | 'GESTURE' | 'PRINT' | 'LIVE';
  seed: string | number;
  subject: string;
  notes?: string;
  styleTokens: string[];
  vibeRefs?: {
    description?: string;
    images?: string;
  };
  startHallucination: number;
  endHallucination: number;
  mutationStrength: number;
  curve: 'linear' | 's-curve' | 'exp';
  humanizerRange: { min: number; max: number };
}

export interface TriptychBundle {
  states: [StateSnapshot, StateSnapshot, StateSnapshot];
  manifest: {
    seedRoot: string;
    dna: {
      subject: string;
      styleTokens: string[];
      vibeRefs?: {
        description?: string;
        images?: string;
      };
    };
    panels: Array<{
      panelName: string;
      stateName: string;
      pathPreset: EvolvePathPreset;
      steps: number;
      derivedSeed: string;
      locks: ParameterLocks;
      diffSummary: string;
    }>;
  };
}

const makeStartParams = (startHallucination: number): AutoEvolveInput['startParams'] => ({
  hallucination: startHallucination,
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
});

const panelSnapshot = (base: TriptychBaseState, panel: TriptychPanelRecipe): { snapshot: StateSnapshot; derivedSeed: string } => {
  const derivedSeed = `${base.seed}::${panel.panelName}`;
  const states = autoEvolve({
    mode: base.mode,
    seed: derivedSeed,
    steps: panel.steps,
    curve: base.curve,
    pathPreset: panel.pathPreset,
    mutationStrength: base.mutationStrength,
    subject: base.subject,
    notes: base.notes,
    styleTokens: base.styleTokens,
    locks: panel.locks,
    targetHallucination: base.endHallucination,
    humanizerRange: base.humanizerRange,
    stateNamePrefix: panel.stateName,
    batchId: panel.panelName,
    startParams: makeStartParams(base.startHallucination),
  });

  return { snapshot: states.at(-1) || states[0], derivedSeed };
};

export const generateTriptych = (base: TriptychBaseState, recipe: TriptychRecipe): TriptychBundle => {
  const [p1, p2, p3] = recipe.panels;

  const s1 = panelSnapshot(base, p1);
  const s2 = panelSnapshot(base, p2);
  const s3 = panelSnapshot(base, p3);

  return {
    states: [s1.snapshot, s2.snapshot, s3.snapshot],
    manifest: {
      seedRoot: String(base.seed),
      dna: {
        subject: base.subject,
        styleTokens: base.styleTokens,
        vibeRefs: base.vibeRefs,
      },
      panels: [
        { panelName: p1.panelName, stateName: p1.stateName, pathPreset: p1.pathPreset, steps: p1.steps, derivedSeed: s1.derivedSeed, locks: p1.locks, diffSummary: s1.snapshot.diffSummary },
        { panelName: p2.panelName, stateName: p2.stateName, pathPreset: p2.pathPreset, steps: p2.steps, derivedSeed: s2.derivedSeed, locks: p2.locks, diffSummary: s2.snapshot.diffSummary },
        { panelName: p3.panelName, stateName: p3.stateName, pathPreset: p3.pathPreset, steps: p3.steps, derivedSeed: s3.derivedSeed, locks: p3.locks, diffSummary: s3.snapshot.diffSummary },
      ],
    },
  };
};
