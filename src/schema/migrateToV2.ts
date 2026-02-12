import { defaultSchemaV2, mergeSchemaV2, type SchemaV2 } from './hypnagnosisSchemaV2';

type R = Record<string, unknown>;
const asObj = (v: unknown): R => (typeof v === 'object' && v !== null ? v as R : {});
const asStr = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const asNum = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const asBool = (v: unknown, d = false) => (typeof v === 'boolean' ? v : d);
const asStrArray = (v: unknown, d: string[] = []) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : d);

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const migrateToV2 = (input: unknown): SchemaV2 => {
  if (!input) return defaultSchemaV2;
  const src = asObj(input);

  const inputBlock = asObj(src.INPUT);
  const stateMap = asObj(src['STATE-MAP']);
  const hall = asObj(src.HALLUCINATION);
  const matrix = asObj(src['HYPNA-MATRIX']);
  const promptGenome = asObj(src['PROMPT-GENOME']);
  const pgStructure = asObj(promptGenome.structure);
  const pgPerception = asObj(promptGenome.perception);
  const visualGrammar = asObj(src['VISUAL-GRAMMAR']);
  const fieldStructure = asObj(visualGrammar['field-structure']);
  const diagramBehavior = asObj(visualGrammar['diagram-behavior']);
  const influence = asObj(src['INFLUENCE-ENGINE']);
  const palette = asObj(src.PALETTE);
  const constraints = asObj(src.CONSTRAINTS ?? src.constraints);
  const animation = asObj(src.ANIMATION ?? src.animation);

  const mode = asStr(src.mode ?? inputBlock.mode, defaultSchemaV2.mode) as SchemaV2['mode'];
  const subject = asStr(src.subject ?? inputBlock.subject, defaultSchemaV2.subject);
  const notes = asStr(src.notes ?? inputBlock.notes, defaultSchemaV2.notes);
  const seed = asStr(src.seed ?? inputBlock.seed, defaultSchemaV2.seed);
  const styleTokens = asStrArray(src.styleTokens ?? inputBlock.styleTokens, defaultSchemaV2.styleTokens);
  const batch = asStr(src.batchPrefix ?? inputBlock['batch-id'], defaultSchemaV2.batchPrefix);
  const stateName = asStr(src.triptychPanel1State ?? stateMap['state-name'], defaultSchemaV2.triptychPanel1State);
  const flow = asStr(src.evolvePathPreset ?? stateMap.flow, defaultSchemaV2.evolvePathPreset);
  const hallucination = clamp(asNum(src.hallucination ?? hall.level, defaultSchemaV2.hallucination));

  const next = mergeSchemaV2(defaultSchemaV2, {
    schemaVersion: 2,
    mode,
    subject,
    notes,
    seed,
    styleTokens,
    batchPrefix: batch,
    triptychPanel1State: stateName,
    evolvePathPreset: flow,
    hallucination,
    startH: asNum(src.startH, defaultSchemaV2.startH),
    endH: asNum(src.endH, defaultSchemaV2.endH),
    mutateStrength: clamp(asNum(src.mutateStrength, defaultSchemaV2.mutateStrength)),
    humanizerLevel: clamp(asNum(src.humanizerLevel, defaultSchemaV2.humanizerLevel)),
    humanizerMin: clamp(asNum(src.humanizerMin, defaultSchemaV2.humanizerMin)),
    humanizerMax: clamp(asNum(src.humanizerMax, defaultSchemaV2.humanizerMax)),
    MODULES: {
      ...defaultSchemaV2.MODULES,
      ...asObj(src.MODULES),
    } as SchemaV2['MODULES'],
    IGNORE_RULES: {
      hard_disable: true,
      preserve_state: true,
    },
    INPUT: {
      mode,
      subject,
      notes,
      seed,
      styleTokens,
      'batch-id': batch,
    },
    'STATE-MAP': {
      'state-name': stateName,
      flow,
    },
    HALLUCINATION: {
      level: hallucination,
    },
    'HYPNA-MATRIX': {
      temporal: clamp(asNum((src as R).temporal ?? matrix.temporal, defaultSchemaV2['HYPNA-MATRIX'].temporal)),
      material: clamp(asNum((src as R).material ?? matrix.material, defaultSchemaV2['HYPNA-MATRIX'].material)),
      space: clamp(asNum((src as R).space ?? matrix.space, defaultSchemaV2['HYPNA-MATRIX'].space)),
      symbol: clamp(asNum((src as R).symbol ?? matrix.symbol, defaultSchemaV2['HYPNA-MATRIX'].symbol)),
      agency: clamp(asNum((src as R).agency ?? matrix.agency, defaultSchemaV2['HYPNA-MATRIX'].agency)),
    },
    'PROMPT-GENOME': {
      structure: {
        composition: asStr(pgStructure.composition, defaultSchemaV2['PROMPT-GENOME'].structure.composition),
        tension: clamp(asNum(pgStructure.tension, defaultSchemaV2['PROMPT-GENOME'].structure.tension)),
        recursion: clamp(asNum(pgStructure.recursion, defaultSchemaV2['PROMPT-GENOME'].structure.recursion)),
      },
      perception: {
        grain: clamp(asNum(pgPerception.grain ?? (src as R).grain, defaultSchemaV2['PROMPT-GENOME'].perception.grain)),
        'line-wobble': clamp(asNum(pgPerception['line-wobble'] ?? (src as R).lineWobble, defaultSchemaV2['PROMPT-GENOME'].perception['line-wobble'])),
        erasure: clamp(asNum(pgPerception.erasure, defaultSchemaV2['PROMPT-GENOME'].perception.erasure)),
        annotation: clamp(asNum(pgPerception.annotation, defaultSchemaV2['PROMPT-GENOME'].perception.annotation)),
      },
    },
    'VISUAL-GRAMMAR': {
      'field-structure': {
        density: clamp(asNum(fieldStructure.density, defaultSchemaV2['VISUAL-GRAMMAR']['field-structure'].density)),
        segmentation: clamp(asNum(fieldStructure.segmentation, defaultSchemaV2['VISUAL-GRAMMAR']['field-structure'].segmentation)),
        rhythm: asStr(fieldStructure.rhythm, defaultSchemaV2['VISUAL-GRAMMAR']['field-structure'].rhythm),
      },
      'diagram-behavior': {
        node_bias: clamp(asNum(diagramBehavior.node_bias, defaultSchemaV2['VISUAL-GRAMMAR']['diagram-behavior'].node_bias)),
        arc_noise: clamp(asNum(diagramBehavior.arc_noise, defaultSchemaV2['VISUAL-GRAMMAR']['diagram-behavior'].arc_noise)),
        correspondence_lock: asBool(diagramBehavior.correspondence_lock, defaultSchemaV2['VISUAL-GRAMMAR']['diagram-behavior'].correspondence_lock),
      },
    },
    'INFLUENCE-ENGINE': {
      ...defaultSchemaV2['INFLUENCE-ENGINE'],
      ...influence,
    } as SchemaV2['INFLUENCE-ENGINE'],
    PALETTE: {
      ...defaultSchemaV2.PALETTE,
      ...palette,
      descriptive: {
        ...defaultSchemaV2.PALETTE.descriptive,
        ...asObj(palette.descriptive),
        keywords: asStrArray(asObj(palette.descriptive).keywords, defaultSchemaV2.PALETTE.descriptive.keywords),
      },
    } as SchemaV2['PALETTE'],
    CONSTRAINTS: {
      forbid: asStrArray(constraints.forbid, defaultSchemaV2.CONSTRAINTS.forbid),
      require: asStrArray(constraints.require, defaultSchemaV2.CONSTRAINTS.require),
    },
    ANIMATION: {
      ...defaultSchemaV2.ANIMATION,
      ...animation,
      keyframes: Array.isArray(animation.keyframes) ? animation.keyframes as SchemaV2['ANIMATION']['keyframes'] : defaultSchemaV2.ANIMATION.keyframes,
    },
    animation: {
      ...defaultSchemaV2.animation,
      ...asObj(src.animation),
    } as SchemaV2['animation'],
  });

  return next;
};
