import { compilePrompt, expandStyleTokens, type HypnaMode } from './compilePrompt';
import { rngFromSeed, clamp } from './random';

export interface ChainNodeState {
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

export interface ChainNode {
  id: string;
  gen: number;
  agent: number;
  parentId: string | null;
  score: number;
  state: ChainNodeState;
  compiledPrompt: string;
  meta: {
    penalties: number;
    coherence: number;
    recursion: number;
    targetFit: number;
  };
}

export interface ChainEdge {
  id: string;
  from: string;
  to: string;
  type: 'spawn';
}

export interface ChainResult {
  nodes: ChainNode[];
  edges: ChainEdge[];
  bestNodeId: string;
}

export interface ChainBaseState {
  mode?: HypnaMode;
  subject?: string;
  notes?: string;
  styleTokens?: string[];
  seed?: string;
  startParams?: Partial<ChainNodeState>;
}

export interface ChainSettings {
  targetHallucination?: number;
}

export interface ChainOpts {
  generations: number;
  agentsPerGen: number;
  keepTop: number;
  intensity: number;
  seed: string;
}

const DEFAULT_PARAMS: ChainNodeState = {
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

const PARAM_KEYS = Object.keys(DEFAULT_PARAMS) as Array<keyof ChainNodeState>;

const scoreState = (state: ChainNodeState, settings: ChainSettings) => {
  const target = settings.targetHallucination ?? 70;
  const coherence = 1 - Math.abs((state.temporal + state.material + state.space) / 3 - 55) / 55;
  const recursion = (state.symbol * 0.5 + state.annotation * 0.5) / 100;
  const targetFit = 1 - Math.abs(state.hallucination - target) / 100;

  let penalties = 0;
  PARAM_KEYS.forEach((key) => {
    if (state[key] < 0 || state[key] > 100) penalties += 0.2;
  });

  const score = coherence * 0.4 + recursion * 0.25 + targetFit * 0.35 - penalties;
  return { score, coherence, recursion, targetFit, penalties };
};

const mutateFromParent = (
  parent: ChainNodeState,
  rng: () => number,
  intensity: number,
  genBias: number,
): ChainNodeState => {
  const next = { ...parent };
  PARAM_KEYS.forEach((key) => {
    const drift = (rng() - 0.5) * 2 * intensity;
    const bias = key === 'hallucination' ? genBias * (0.6 + rng() * 0.8) : 0;
    next[key] = clamp(parent[key] + drift + bias, 0, 100);
  });
  return next;
};

const compileForNode = (
  baseState: ChainBaseState,
  state: ChainNodeState,
  gen: number,
  agent: number,
  id: string,
) => compilePrompt({
  mode: baseState.mode || 'FULL',
  subject: baseState.subject,
  notes: baseState.notes,
  styleTokens: baseState.styleTokens || [],
  styleExpanded: expandStyleTokens(baseState.styleTokens || []),
  hallucination: Math.round(state.hallucination),
  step: gen,
  steps: gen + 1,
  batchId: `chain-g${gen}`,
  seed: `${baseState.seed || 'chain'}::${id}`,
  hypnaMatrix: {
    temporal: Math.round(state.temporal),
    material: Math.round(state.material),
    space: Math.round(state.space),
    symbol: Math.round(state.symbol),
    agency: Math.round(state.agency),
  },
  stateMap: {
    'state-name': `GEN-${gen}-A${agent}`,
    flow: 'multi-agent-chain',
  },
  autoGesture: {
    mode: 'chain',
    pressure: Math.round(state.gesture),
    jitter: Math.round(state['line-wobble']),
  },
  autoComp: {
    composition: 'chain',
    tension: Math.round(state.erasure),
    framing: Math.round(state.annotation),
    horizon: Math.round(state.space),
  },
  printLayer: {
    'plate-palette': Math.round(state.palette),
  },
});

export const runMultiAgentChain = (
  baseState: ChainBaseState,
  settings: ChainSettings,
  opts: ChainOpts,
): ChainResult => {
  const generations = Math.max(1, Math.min(20, Number(opts.generations) || 1));
  const agentsPerGen = Math.max(1, Math.min(30, Number(opts.agentsPerGen) || 1));
  const keepTop = Math.max(1, Math.min(agentsPerGen, Number(opts.keepTop) || 1));
  const intensity = Math.max(0, Math.min(25, Number(opts.intensity) || 0));
  const rng = rngFromSeed(String(opts.seed || baseState.seed || 'chain-seed'));

  const nodes: ChainNode[] = [];
  const edges: ChainEdge[] = [];

  const rootState: ChainNodeState = { ...DEFAULT_PARAMS, ...(baseState.startParams || {}) };
  const rootScored = scoreState(rootState, settings);
  const rootNode: ChainNode = {
    id: 'node-root',
    gen: 0,
    agent: 0,
    parentId: null,
    score: rootScored.score,
    state: rootState,
    compiledPrompt: compileForNode(baseState, rootState, 0, 0, 'node-root'),
    meta: {
      coherence: rootScored.coherence,
      recursion: rootScored.recursion,
      targetFit: rootScored.targetFit,
      penalties: rootScored.penalties,
    },
  };
  nodes.push(rootNode);

  let parents: ChainNode[] = [rootNode];

  for (let gen = 1; gen <= generations; gen += 1) {
    const genNodes: ChainNode[] = [];

    for (let i = 0; i < agentsPerGen; i += 1) {
      const parent = parents[Math.floor(rng() * parents.length)] || parents[0];
      const agent = i + 1;
      const id = `node-g${gen}-a${agent}`;
      const genBias = (gen / generations) * intensity * 0.35;
      const state = mutateFromParent(parent.state, rng, intensity, genBias);
      const scored = scoreState(state, settings);

      const node: ChainNode = {
        id,
        gen,
        agent,
        parentId: parent.id,
        score: scored.score,
        state,
        compiledPrompt: compileForNode(baseState, state, gen, agent, id),
        meta: {
          coherence: scored.coherence,
          recursion: scored.recursion,
          targetFit: scored.targetFit,
          penalties: scored.penalties,
        },
      };

      genNodes.push(node);
      nodes.push(node);
      edges.push({ id: `edge-${parent.id}-${id}`, from: parent.id, to: id, type: 'spawn' });
    }

    parents = genNodes.sort((a, b) => b.score - a.score).slice(0, keepTop);
  }

  const best = nodes.reduce((acc, node) => (node.score > acc.score ? node : acc), nodes[0]);
  return {
    nodes,
    edges,
    bestNodeId: best.id,
  };
};
