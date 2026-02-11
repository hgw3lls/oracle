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

export const expandStyleTokens = (tokens: string[] = []): string => (
  tokens.map((token) => STYLE_TOKENS[token] || token).join('; ')
);

const sectionEnabledByMode = (mode: HypnaMode, section: string): boolean => {
  if (mode === 'STYLE') return ['INPUT', 'STYLE', 'VIBE-REFS', 'HUMANIZER'].includes(section);
  if (mode === 'GESTURE') return ['INPUT', 'AUTO-GESTURE', 'STATE-MAP', 'HUMANIZER', 'VIBE-REFS'].includes(section);
  if (mode === 'PRINT') return ['INPUT', 'STYLE', 'PRINT-LAYER', 'HUMANIZER', 'VIBE-REFS'].includes(section);
  if (mode === 'LIVE') return section !== 'PRINT-LAYER';
  return true;
};

export const compilePrompt = (state: CompilePromptState): string => {
  const styleExpanded = state.styleExpanded || expandStyleTokens(state.styleTokens || []);

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
