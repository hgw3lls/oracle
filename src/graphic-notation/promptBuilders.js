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

export function buildMasterPrompt(specInput) {
  const spec = deriveSpec(specInput);

  const gestureLine = spec.gestures.length ? spec.gestures.join('; ') : 'free-form marks with controlled recurrence';
  const constraintLine = spec.constraints || 'preserve legibility of event timing and dynamic accents';

  return [
    `GRAPHIC NOTATION PROMPTGEN`,
    `title: ${spec.title}`,
    `ensemble: ${spec.ensemble}`,
    `duration-sec: ${spec.durationSec}`,
    `density: ${spec.density}`,
    `visual-intent: ${spec.visualIntent}`,
    `palette: ${spec.palette}`,
    `gesture-vocabulary: ${gestureLine}`,
    `constraints: ${constraintLine}`,
    'output: one coherent performable graphic score image with strong spatial hierarchy.',
  ].join('\n');
}

export function buildPlatePrompts(specInput) {
  const spec = deriveSpec(specInput);
  const gestures = spec.gestures.length ? spec.gestures : ['anchor glyph', 'transition mark', 'silence field'];

  return gestures.map((gesture, index) => {
    const plate = index + 1;
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
      ].join('\n'),
    };
  });
}
