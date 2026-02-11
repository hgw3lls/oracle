type Primitive = string | number | boolean;
type BlockBody = Record<string, Primitive> & { _extra?: Record<string, Primitive> };

type HHBlocks = {
  handrawHuman?: boolean;
  subject?: string;
  hypnaMatrix?: BlockBody;
  stateMap?: BlockBody;
  composition?: BlockBody;
  autoEvolve?: BlockBody;
  arcaneLayer?: BlockBody;
  sleepState?: BlockBody;
  gesture?: BlockBody;
  vibeReference?: BlockBody;
  _extra?: Record<string, Record<string, Primitive>>;
};

export interface HHParseResult {
  blocks: HHBlocks;
  errors: string[];
}

const HEADERS = {
  'HYPNA-MATRIX': 'hypnaMatrix',
  'STATE-MAP': 'stateMap',
  COMPOSITION: 'composition',
  'AUTO-EVOLVE': 'autoEvolve',
  'ARCANE-LAYER': 'arcaneLayer',
  'SLEEP-STATE': 'sleepState',
  GESTURE: 'gesture',
  'VIBE-REFERENCE': 'vibeReference',
} as const;

const KNOWN_KEYS: Record<string, string[]> = {
  hypnaMatrix: ['temporal', 'material', 'space', 'symbol', 'agency', 'saturation', 'motion', 'hallucination'],
  stateMap: ['state-name', 'flow', 'linked-from'],
  composition: ['composition', 'tension', 'framing', 'horizon'],
  autoEvolve: ['enabled', 'steps', 'curve', 'start-h', 'end-h', 'path', 'mutation', 'mutation-strength', 'mutation-scope', 'mutation-mode'],
  arcaneLayer: ['enabled', 'arcane-mode'],
  sleepState: ['enabled', 'neuro-state', 'presence', 'visual-drift', 'auditory'],
  gesture: ['mode', 'pressure', 'tempo', 'jitter'],
  vibeReference: ['description', 'images', 'policy'],
};

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/[_\s]+/g, '-');

const parseValue = (raw: string): Primitive => {
  const txt = raw.trim();
  if (/^(true|false)$/i.test(txt)) return txt.toLowerCase() === 'true';
  if (/^[+-]?\d+(\.\d+)?$/.test(txt)) return Number(txt);
  return txt;
};

const setIntoBlock = (blocks: HHBlocks, blockKey: keyof HHBlocks, key: string, value: Primitive) => {
  const current = (blocks[blockKey] || {}) as BlockBody;
  const known = KNOWN_KEYS[String(blockKey)] || [];

  if (known.includes(key)) {
    blocks[blockKey] = { ...current, [key]: value };
    return;
  }

  blocks[blockKey] = {
    ...current,
    _extra: {
      ...(current._extra || {}),
      [key]: value,
    },
  };
};

export const parseHH = (text: string): HHParseResult => {
  const errors: string[] = [];
  const blocks: HHBlocks = { _extra: {} };
  const lines = String(text || '').split(/\r?\n/);
  let currentSection: keyof typeof HEADERS | null = null;

  lines.forEach((line, idx) => {
    const raw = line.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('//')) return;

    if (raw === 'HANDRAW-HUMAN') {
      blocks.handrawHuman = true;
      currentSection = null;
      return;
    }

    if ((raw as keyof typeof HEADERS) in HEADERS) {
      currentSection = raw as keyof typeof HEADERS;
      return;
    }

    const match = raw.match(/^([^:]+):(.*)$/);
    if (!match) {
      errors.push(`Line ${idx + 1}: expected "key: value" format.`);
      return;
    }

    const key = normalizeKey(match[1]);
    const value = parseValue(match[2]);

    if (!currentSection) {
      if (key === 'subject') {
        blocks.subject = String(value);
        return;
      }

      blocks._extra = {
        ...(blocks._extra || {}),
        root: {
          ...((blocks._extra || {}).root || {}),
          [key]: value,
        },
      };
      errors.push(`Line ${idx + 1}: key outside a known HH section.`);
      return;
    }

    const blockKey = HEADERS[currentSection] as keyof HHBlocks;
    setIntoBlock(blocks, blockKey, key, value);
  });

  return { blocks, errors };
};
