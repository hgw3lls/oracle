import { STYLE_TOKENS } from '../models/schema';

export type HypnaMode = 'FULL' | 'STYLE' | 'GESTURE' | 'PRINT' | 'LIVE';

type Primitive = string | number | boolean | null | undefined;
type Dict = Record<string, Primitive>;

export interface CompilePromptState {
  mode: HypnaMode;
  subject?: string;
  notes?: string;
  styleTokens?: string[];
  styleExpanded?: string;
  hallucination?: number;
  step?: number;
  steps?: number;
  batchId?: string;
  seed?: string;

  hypnaMatrix?: Dict;
  stateMap?: Dict;
  autoGesture?: Dict;
  autoComp?: Dict;
  autoEvolve?: Dict;
  arcaneLayer?: Dict;
  sleepState?: Dict;
  vibeRefs?: Dict;
  humanizer?: Dict;
  printLayer?: Dict;
}

const line = (key: string, value: Primitive): string | null => {
  if (value === '' || value === null || value === undefined) return null;
  return `${key}: ${value}`;
};

const block = (title: string, lines: Array<string | null>): string | null => {
  const body = lines.filter(Boolean) as string[];
  if (!body.length) return null;
  return `${title}\n${body.join('\n')}`;
};

const linesFromDict = (source: Dict = {}, preferredOrder: string[] = []): Array<string | null> => {
  const sourceKeys = Object.keys(source);
  const orderedKeys = [
    ...preferredOrder.filter((key) => sourceKeys.includes(key)),
    ...sourceKeys.filter((key) => !preferredOrder.includes(key)).sort(),
  ];

  return orderedKeys.map((key) => line(key, source[key]));
};

const numeric = (value: Primitive): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
};

const intensityLabel = (value: number, cuts: [number, string][]): string => {
  for (let i = 0; i < cuts.length; i += 1) {
    if (value <= cuts[i][0]) return cuts[i][1];
  }
  return cuts[cuts.length - 1][1];
};

const cleanPhrase = (value: Primitive): string | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized || null;
};

const buildRenderIntent = (state: CompilePromptState, styleExpanded: string): Dict => {
  const h = numeric(state.hallucination) ?? 50;
  const matrix = state.hypnaMatrix || {};
  const gesture = state.autoGesture || {};
  const humanizer = state.humanizer || {};

  const symbol = numeric(matrix.symbol) ?? h;
  const space = numeric(matrix.space) ?? 55;
  const motionRaw = numeric(matrix.motion) ?? numeric(gesture.tempo) ?? numeric(gesture.pressure) ?? 50;
  const humanizerLevel = numeric(humanizer['level(0-100)']) ?? 40;

  const detail = intensityLabel(h, [[30, 'minimal detail'], [60, 'selective detail'], [85, 'high detail'], [100, 'maximal detail']]);
  const surreal = intensityLabel(symbol, [[25, 'grounded realism'], [55, 'subtle surrealism'], [80, 'dreamlike surrealism'], [100, 'hallucinatory surrealism']]);
  const camera = intensityLabel(space, [[35, 'tight framing'], [65, 'balanced framing'], [100, 'wide cinematic framing']]);
  const motion = intensityLabel(motionRaw, [[30, 'still moment'], [60, 'gentle motion'], [85, 'dynamic motion'], [100, 'chaotic motion']]);
  const texture = intensityLabel(humanizerLevel, [[30, 'clean surfaces'], [65, 'textured surfaces'], [100, 'handmade imperfections']]);

  const stylePhrase = styleExpanded || 'hybrid visual language';
  const subject = cleanPhrase(state.subject) || 'abstract subject';
  const notes = cleanPhrase(state.notes);
  const comp = state.autoComp || {};
  const vibe = state.vibeRefs || {};
  const print = state.printLayer || {};
  const sleep = state.sleepState || {};

  const compositionHints = [
    cleanPhrase(comp.composition),
    cleanPhrase(comp.framing),
    cleanPhrase(comp.horizon),
    cleanPhrase(comp.tension),
  ].filter(Boolean).join(', ');

  const atmosphereHints = [
    cleanPhrase(vibe.description),
    cleanPhrase(sleep['neuro-state']),
    cleanPhrase(sleep['visual-drift']),
  ].filter(Boolean).join(', ');

  const materialHints = [
    cleanPhrase(print.texture),
    cleanPhrase(print['print-mode']),
  ].filter(Boolean).join(', ');

  const primaryPrompt = [
    `Create a single still image with ${subject} as the unmistakable focal subject.`,
    `Style direction: ${stylePhrase}.`,
    `Render profile: ${detail}, ${surreal}, ${camera}, ${motion}, ${texture}.`,
    compositionHints ? `Composition cues: ${compositionHints}. Keep depth readable and perspective internally consistent.` : 'Composition cues: establish a clear foreground, midground, and background with readable depth.',
    atmosphereHints ? `Atmosphere and mood cues: ${atmosphereHints}.` : null,
    materialHints ? `Material and surface cues: ${materialHints}.` : null,
    notes ? `Creative notes: ${notes}.` : null,
    'Output requirements: cinematic but plausible lighting, disciplined value structure, intentional color harmony, and no accidental text or logos.',
  ].filter(Boolean).join(' ');

  const negativePrompt = [
    'blurry, low-resolution, jpeg artifacts, watermark, text overlay, logo, signature',
    'deformed anatomy, broken perspective, duplicated limbs, extra fingers, malformed hands, crossed eyes',
    'flat lighting, muddy colors, overexposed highlights, crushed shadows, weak focal contrast',
    'unintentional collage seams, incoherent geometry, noisy background clutter, tangent-heavy composition',
  ].join(', ');

  return {
    'primary-prompt': primaryPrompt,
    'negative-prompt': negativePrompt,
    'render-priority': 'composition > subject readability > style fidelity > micro-texture',
  };
};

export const expandStyleTokens = (tokens: string[] = []): string => (
  tokens.map((token) => STYLE_TOKENS[token] || token).join('; ')
);

const sectionEnabledByMode = (mode: HypnaMode, section: string): boolean => {
  if (mode === 'STYLE') return ['INPUT', 'STYLE', 'VIBE-REFS', 'HUMANIZER', 'IMAGE-GENERATION'].includes(section);
  if (mode === 'GESTURE') return ['INPUT', 'AUTO-GESTURE', 'STATE-MAP', 'HUMANIZER', 'VIBE-REFS', 'IMAGE-GENERATION'].includes(section);
  if (mode === 'PRINT') return ['INPUT', 'STYLE', 'PRINT-LAYER', 'HUMANIZER', 'VIBE-REFS', 'IMAGE-GENERATION'].includes(section);
  if (mode === 'LIVE') return section !== 'PRINT-LAYER';
  return true;
};

export const compilePrompt = (state: CompilePromptState): string => {
  const styleExpanded = state.styleExpanded || expandStyleTokens(state.styleTokens || []);
  const renderIntent = buildRenderIntent(state, styleExpanded);

  const inputBlock = block('INPUT', [
    line('mode', state.mode),
    line('subject', state.subject),
    line('hallucination(0-100)', state.hallucination),
    (state.step !== undefined && state.steps !== undefined) ? line('state-index', `${state.step + 1}/${state.steps}`) : null,
    line('batch-id', state.batchId),
    line('seed', state.seed),
  ]);

  const blocks = [
    inputBlock,
    block('STYLE', [
      line('style-tokens', (state.styleTokens || []).join(', ')),
      line('expanded-style', styleExpanded),
      line('notes', state.notes),
    ]),
    block('HYPNA-MATRIX', linesFromDict(state.hypnaMatrix, [
      'temporal', 'material', 'space', 'symbol', 'agency', 'saturation', 'motion',
    ])),
    block('STATE-MAP', linesFromDict(state.stateMap, ['state-name', 'flow', 'linked-from'])),
    block('AUTO-GESTURE', linesFromDict(state.autoGesture, ['mode', 'pressure', 'tempo', 'jitter'])),
    block('AUTO-COMP', linesFromDict(state.autoComp, ['composition', 'tension', 'framing', 'horizon'])),
    block('AUTO-EVOLVE', linesFromDict(state.autoEvolve, [
      'enabled', 'steps', 'curve', 'start-h', 'end-h', 'mutation', 'mutation-strength', 'mutation-scope', 'mutation-mode',
    ])),
    block('ARCANE-LAYER', linesFromDict(state.arcaneLayer, ['enabled', 'arcane-mode'])),
    block('SLEEP-STATE', linesFromDict(state.sleepState, ['enabled', 'neuro-state', 'presence', 'visual-drift', 'auditory'])),
    block('PRINT-LAYER', linesFromDict(state.printLayer, ['print-mode', 'registration', 'texture', 'plate-palette'])),
    block('VIBE-REFS', linesFromDict(state.vibeRefs, ['description', 'images', 'policy'])),
    block('HUMANIZER', linesFromDict(state.humanizer, ['level(0-100)', 'qualities', 'notes'])),
    block('IMAGE-GENERATION', linesFromDict(renderIntent, ['primary-prompt', 'negative-prompt', 'render-priority'])),
  ];

  const filtered = blocks
    .map((current, index) => ({
      value: current,
      title: current?.split('\n')[0] || (index === 0 ? 'INPUT' : ''),
    }))
    .filter((item) => item.value && sectionEnabledByMode(state.mode, item.title))
    .map((item) => item.value as string);

  return [
    '===============================',
    'HYPNAGNOSIS SYSTEM — WEB EDITION',
    '===============================',
    ...filtered,
  ].join('\n\n');
};
