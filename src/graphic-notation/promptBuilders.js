const FALLBACK_SPEC = {
  title: 'Untitled Score',
  ensemble: 'solo performer',
  visualIntent: 'graphic notation with clear performable cues',
  durationSec: 60,
  density: 'medium',
  palette: 'black ink on warm white paper',
  gestures: [],
  constraints: '',
};

const splitList = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const splitLines = (value) =>
  String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const MODULE_TARGETS = ['hypna', 'structure', 'variation', 'impossible', 'humanizer'];

const normalizeTargets = (targets) => {
  if (!Array.isArray(targets)) return [];
  return targets.filter((target) => MODULE_TARGETS.includes(target));
};

export function normalizeModule(moduleInput = {}) {
  if (!moduleInput || typeof moduleInput !== 'object') return null;

  const name = String(moduleInput.name || '').trim();
  if (!name) return null;

  const strengthCandidate = Number(moduleInput.strength);
  const strength = Number.isFinite(strengthCandidate) ? Math.max(0, Math.min(100, strengthCandidate)) : 50;

  const tokens = Array.isArray(moduleInput.tokens) ? moduleInput.tokens.filter(Boolean) : splitLines(moduleInput.tokens);
  const rules = Array.isArray(moduleInput.rules) ? moduleInput.rules.filter(Boolean) : splitLines(moduleInput.rules);

  return {
    id: String(moduleInput.id || ''),
    name,
    enabled: Boolean(moduleInput.enabled),
    builtIn: Boolean(moduleInput.builtIn),
    strength,
    targets: normalizeTargets(moduleInput.targets),
    tokens,
    rules,
  };
}

export function collectEnabledModules(modulesInput = []) {
  if (!Array.isArray(modulesInput)) return [];
  return modulesInput
    .map(normalizeModule)
    .filter(Boolean)
    .filter((module) => module.enabled);
}

export function deriveSpec(input = {}) {
  if (!input || typeof input !== 'object') return { ...FALLBACK_SPEC };

  const durationCandidate = Number(input.durationSec);
  const durationSec = Number.isFinite(durationCandidate) && durationCandidate > 0 ? durationCandidate : FALLBACK_SPEC.durationSec;

  return {
    title: String(input.title || FALLBACK_SPEC.title),
    ensemble: String(input.ensemble || FALLBACK_SPEC.ensemble),
    visualIntent: String(input.visualIntent || FALLBACK_SPEC.visualIntent),
    durationSec,
    density: String(input.density || FALLBACK_SPEC.density),
    palette: String(input.palette || FALLBACK_SPEC.palette),
    gestures: splitList(input.gestures).length ? splitList(input.gestures) : FALLBACK_SPEC.gestures,
    constraints: String(input.constraints || FALLBACK_SPEC.constraints),
  };
}

export function buildMasterPrompt(specInput, modulesInput = []) {
  const spec = deriveSpec(specInput);
  const modules = collectEnabledModules(modulesInput);

  const gestureLine = spec.gestures.length ? spec.gestures.join('; ') : 'free-form marks with controlled recurrence';
  const constraintLine = spec.constraints || 'preserve legibility of event timing and dynamic accents';

  const moduleBlock = modules.length
    ? [
      'MODULES',
      ...modules.map((module) => [
        `- ${module.name} [strength ${module.strength}]`,
        module.targets.length ? `  targets: ${module.targets.join(', ')}` : '',
        module.tokens.length ? `  tokens: ${module.tokens.join(' | ')}` : '',
        module.rules.length ? `  rules: ${module.rules.join(' | ')}` : '',
      ].filter(Boolean).join('\n')),
    ].join('\n')
    : '';

  return [
    'GRAPHIC NOTATION PROMPTGEN',
    `title: ${spec.title}`,
    `ensemble: ${spec.ensemble}`,
    `duration-sec: ${spec.durationSec}`,
    `density: ${spec.density}`,
    `visual-intent: ${spec.visualIntent}`,
    `palette: ${spec.palette}`,
    `gesture-vocabulary: ${gestureLine}`,
    `constraints: ${constraintLine}`,
    moduleBlock,
    'output: one coherent performable graphic score image with strong spatial hierarchy.',
  ].filter(Boolean).join('\n');
}

export function buildVariantMatrix(specInput, modulesInput = []) {
  const spec = deriveSpec(specInput);
  const modules = collectEnabledModules(modulesInput);
  const gestures = spec.gestures.length ? spec.gestures : ['anchor glyph', 'transition mark', 'silence field'];

  return gestures.map((gesture, index) => {
    const variant = index + 1;
    const influences = modules
      .filter((module) => module.targets.includes('variation') || module.targets.includes('structure') || module.targets.includes('hypna'))
      .map((module) => `${module.name}(${module.strength})`);

    const mutationTokens = modules.flatMap((module) => module.tokens.map((token) => `${token} [${module.name}]`));
    const mutationRules = modules.flatMap((module) => module.rules.map((rule) => `${rule} [${module.name}]`));

    return {
      id: `variant-${variant}`,
      label: `Variant ${variant}`,
      gesture,
      influences,
      mutationTokens,
      mutationRules,
      prompt: [
        `VARIANT ${variant}`,
        `gesture-focus: ${gesture}`,
        `density: ${spec.density}`,
        influences.length ? `influences: ${influences.join(', ')}` : 'influences: baseline',
        mutationTokens.length ? `tokens: ${mutationTokens.join(' | ')}` : 'tokens: baseline mark set',
        mutationRules.length ? `rules: ${mutationRules.join(' | ')}` : 'rules: maintain coherence with master spine',
      ].join('\n'),
    };
  });
}

export function buildPlatePrompts(specInput, modulesInput = []) {
  const spec = deriveSpec(specInput);
  const modules = collectEnabledModules(modulesInput);
  const gestures = spec.gestures.length ? spec.gestures : ['anchor glyph', 'transition mark', 'silence field'];

  return gestures.map((gesture, index) => {
    const plate = index + 1;
    const moduleTokens = modules
      .filter((module) => module.targets.includes('structure') || module.targets.includes('humanizer') || module.targets.includes('impossible'))
      .flatMap((module) => module.tokens.map((token) => `${token} [${module.name}]`));

    return {
      id: `plate-${plate}`,
      label: `Plate ${plate}`,
      prompt: [
        `GRAPHIC SCORE PLATE ${plate}`,
        `title: ${spec.title}`,
        `focus-gesture: ${gesture}`,
        `timing-slice: ${(plate - 1) * Math.round(spec.durationSec / gestures.length)}-${plate * Math.round(spec.durationSec / gestures.length)} sec`,
        `density: ${spec.density}`,
        `palette: ${spec.palette}`,
        `constraint: ${spec.constraints || 'keep symbols performable and legible at distance'}`,
        moduleTokens.length ? `module-tokens: ${moduleTokens.join(' | ')}` : '',
      ].filter(Boolean).join('\n'),
    };
  });
}

export function buildImagePromptFrame(specInput, modulesInput = []) {
  const spec = deriveSpec(specInput);
  const modules = collectEnabledModules(modulesInput);
  const gestures = spec.gestures.length ? spec.gestures : ['anchor glyph', 'transition mark', 'silence field'];

  const styleTokens = modules
    .filter((module) => module.targets.includes('hypna') || module.targets.includes('humanizer'))
    .flatMap((module) => module.tokens.map((token) => `${token} [${module.name}]`));

  const structureRules = modules
    .filter((module) => module.targets.includes('structure') || module.targets.includes('variation'))
    .flatMap((module) => module.rules.map((rule) => `${rule} [${module.name}]`));

  const impossibleTokens = modules
    .filter((module) => module.targets.includes('impossible'))
    .flatMap((module) => module.tokens.map((token) => `${token} [${module.name}]`));

  return [
    'IMAGE GENERATION PROMPT FRAME',
    '[SUBJECT]',
    `${spec.title} interpreted as a performable graphic music score for ${spec.ensemble}.`,
    '[COMPOSITION]',
    `Duration map: ${spec.durationSec} seconds with ${spec.density} information density and clear left-to-right reading flow.`,
    `Primary gestures: ${gestures.join('; ')}.`,
    '[STYLE]',
    `Visual intent: ${spec.visualIntent}.`,
    styleTokens.length ? `Tactile/style tokens: ${styleTokens.join(' | ')}.` : 'Tactile/style tokens: hand-drawn ink, pressure drift, visible human correction.',
    '[PALETTE]',
    `${spec.palette}.`,
    '[PERFORMANCE CUES]',
    structureRules.length ? `Rule spine: ${structureRules.join(' | ')}.` : 'Rule spine: preserve legible timing, dynamics, and event hierarchy.',
    '[EXPERIMENTAL LAYER]',
    impossibleTokens.length ? `Optional impossible cues: ${impossibleTokens.join(' | ')}.` : 'Optional impossible cues: subtle non-euclidean spacing that remains playable.',
    '[NEGATIVE PROMPT]',
    `${spec.constraints || 'Avoid sterile vector polish, conventional 5-line staff notation, and unreadable symbol clutter.'}`,
    '[OUTPUT]',
    'One high-resolution still image of a coherent, performable, gallery-ready graphic notation score sheet.',
  ].join('\n');
}
