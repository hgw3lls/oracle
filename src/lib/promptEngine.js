const SKIP = '__SKIP__';

export const STYLE_TOKENS = {
  'STYLE.HYPNAGOGIC': 'porous perception, threshold drift, waking/dream seam, sensory instability',
  'STYLE.OCCULT': 'sigil-grammar, ritual diagram logic, correspondence pressure, symbolic recursion',
  'STYLE.NEWWEIRD': 'ontology fracture, non-human logic, liminal infrastructures, wrongness-without-reveal',
  'STYLE.PRINT': 'overprint thinking, misregistration drift, plate logic, physical ink behavior',
  'STYLE.GRAPHIC_SCORE': 'score-as-image, performable reading paths, time/intensity vectors, instructional ambiguity',
};

export const HUMANIZER_QUALITIES = [
  ['wobble_lines', 'Wobble lines'],
  ['hesitation', 'Hesitation marks'],
  ['redraws', 'Visible redraws'],
  ['smudge', 'Smudge / rub'],
  ['misregistration', 'Misregistration drift'],
];

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(n) || 0));

const curveValue = (curve, tRaw) => {
  const t = Math.max(0, Math.min(1, tRaw));
  switch ((curve || 'linear').toLowerCase()) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 's-curve':
      return t * t * (3 - 2 * t);
    default:
      return t;
  }
};

const autoColorMap = (h) => {
  if (h < 25) return ['monochrome graphite + faint wash', 'mono'];
  if (h < 50) return ['limited 2–3 ink palette', 'duotone'];
  if (h < 75) return ['riso overprint + visible misregistration', 'tritone'];
  return ['unstable spectral overprint (still physical ink)', 'quad'];
};

const defaultFromH = (h) => {
  const [paletteDesc, platePalette] = autoColorMap(h);
  return {
    temporal: clamp(30 + 0.6 * h),
    material: clamp(75 - 0.25 * h),
    space: clamp(35 + 0.45 * h),
    symbol: clamp(12 + 0.78 * h),
    agency: clamp(65 - 0.3 * h),
    saturation: h < 25 ? 'sparse' : h < 50 ? 'balanced' : h < 75 ? 'dense' : 'overload',
    motion: h < 20 ? 'still' : h < 45 ? 'flowing' : h < 75 ? 'kinetic' : 'explosive',
    paletteDesc,
    platePalette,
  };
};

const stateDefaults = (i, n) => {
  const t = i / Math.max(1, n - 1);
  if (t < 0.17) return { label: 'ANCHOR', flow: 'stable horizon' };
  if (t < 0.33) return { label: 'POROUS', flow: 'soft drift' };
  if (t < 0.5) return { label: 'WATCHER', flow: 'compression' };
  if (t < 0.67) return { label: 'COLLAPSE', flow: 'gravity vectors' };
  if (t < 0.84) return { label: 'BLOOM', flow: 'nested rings' };
  return { label: 'RETURN', flow: 'partial closure' };
};

const expandStyleTokens = (tokens) => tokens.map((token) => STYLE_TOKENS[token] || token).join('; ');

const enabledQualities = (qualities) => HUMANIZER_QUALITIES.filter(([key]) => qualities[key]).map(([, label]) => label);

const line = (key, value) => (value === '' || value == null || value === SKIP ? null : `${key}: ${value}`);

const block = (title, lines) => {
  const body = lines.filter(Boolean);
  if (!body.length) return '';
  return `${title}\n${body.join('\n')}`;
};

const compilePrompt = (st) => [
  '===============================',
  'HYPNAGNOSIS SYSTEM — WEB EDITION',
  '===============================',
  block('INPUT', [
    line('mode', st.mode),
    line('subject', st.subject),
    line('hallucination(0-100)', st.hallucination),
    line('state-index', `${st.step + 1}/${st.steps}`),
  ]),
  block('STYLE', [
    line('style-tokens', st.styleTokens.join(', ')),
    line('expanded-style', st.styleExpanded),
    line('notes', st.notes),
  ]),
  block('DYNAMICS', [
    line('state-name', st.stateName),
    line('temporal', st.temporal),
    line('material', st.material),
    line('space', st.space),
    line('symbol', st.symbol),
    line('agency', st.agency),
    line('saturation', st.saturation),
    line('motion', st.motion),
    line('flow', st.flow),
  ]),
  block('AUTO-COLOR', [
    line('palette', st.paletteDesc),
    line('plate-palette', st.platePalette),
  ]),
  block('HUMANIZER', [
    line('level(0-100)', st.humanizerLevel),
    line('qualities', enabledQualities(st.humanizerQualities).join(', ')),
  ]),
].filter(Boolean).join('\n\n');

export const DEFAULT_FORM = {
  mode: 'FULL',
  subject: '',
  notes: '',
  hallucination: 72,
  styleTokens: ['STYLE.HYPNAGOGIC', 'STYLE.OCCULT'],
  evolveEnabled: true,
  evolveSteps: 6,
  startH: 52,
  endH: 92,
  curve: 's-curve',
  humanizerLevel: 60,
  humanizerQualities: Object.fromEntries(HUMANIZER_QUALITIES.map(([key]) => [key, false])),
};

export const generateSeries = (form) => {
  const steps = form.evolveEnabled ? Math.max(1, Math.min(20, Number(form.evolveSteps) || 1)) : 1;

  return Array.from({ length: steps }).map((_, i) => {
    const baseH = clamp(form.hallucination);
    const h = form.evolveEnabled
      ? clamp(form.startH + (form.endH - form.startH) * curveValue(form.curve, i / Math.max(1, steps - 1)))
      : baseH;
    const dyn = defaultFromH(h);
    const sd = stateDefaults(i, steps);

    const state = {
      mode: form.mode,
      subject: form.subject,
      notes: form.notes,
      hallucination: h,
      styleTokens: form.styleTokens,
      styleExpanded: expandStyleTokens(form.styleTokens),
      humanizerLevel: clamp(form.humanizerLevel),
      humanizerQualities: form.humanizerQualities,
      step: i,
      steps,
      stateName: sd.label,
      flow: sd.flow,
      ...dyn,
    };

    return { ...state, prompt: compilePrompt(state) };
  });
};
