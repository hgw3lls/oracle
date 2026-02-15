export const SKIP = '__SKIP__';

export const BOOTLOADER_TEXT = `===============================
HYPNAGNOSIS SYSTEM — BOOTLOADER
===============================
HANDRAW-HUMAN is always enforced:
- human-made drawing/print; pressure variation; wobble; redraws; imperfect edges; no sterile vector sheen.

Input conventions:
- blank = AUTOFILL
- SKIP = omit that parameter line
- NONE = neutralize / disable that module or parameter

If user did not specify required minimums, ask for:
1) MODE (FULL/STYLE/GESTURE/PRINT/LIVE)
2) Subject (unless STYLE/GESTURE/PRINT only)
3) Hallucination % (0–100)

END BOOTLOADER`;

export const SYSTEM_FILE_TEXT = `=========================================
HYPNAGNOSIS SYSTEM FILE — v2
=========================================
MODES
- [HYPNA/FULL]     Full stack
- [HYPNA/STYLE]    Style-only
- [HYPNA/GESTURE]  Gesture-only
- [HYPNA/PRINT]    Print/plates-only
- [HYPNA/LIVE]     Live evolving series

VIBE REFERENCES
- Provide a vibe description and optionally attached images.
- Images are vibe-only; never copy composition or elements.

HUMANIZER
- Humanizer range controls how visibly human/physical the making is.
- Qualities toggle specific human artifacts (smudge, redraws, hesitation, etc.)

EXPORTS
- Every module has Copy/Save exports (no export tab).

END SYSTEM FILE`;

export const STYLE_TOKENS: Record<string, string> = {
  'STYLE.HYPNAGOGIC': 'porous perception, threshold drift, waking/dream seam, sensory instability',
  'STYLE.OCCULT': 'sigil-grammar, ritual diagram logic, correspondence pressure, symbolic recursion',
  'STYLE.NEWWEIRD': 'ontology fracture, non-human logic, liminal infrastructures, wrongness-without-reveal',
  'STYLE.PRINT': 'overprint thinking, misregistration drift, plate logic, physical ink behavior',
  'STYLE.GRAPHIC_SCORE': 'score-as-image, performable reading paths, time/intensity vectors, instructional ambiguity',
  'STYLE.CONSPIRACY_DIAGRAM': 'Lombardi-like map logic: arcs, nodes, annotations, evidence lines, ambiguity without resolution',
};

export const HUMANIZER_QUALITIES = [
  ['wobble_lines', 'Wobble lines'], ['hesitation', 'Hesitation marks'], ['redraws', 'Visible redraws'],
  ['smudge', 'Smudge / rub'], ['drybrush', 'Drybrush / broken ink'], ['misregistration', 'Misregistration drift'],
  ['paper_tooth', 'Paper tooth / grain'], ['ghosting', 'Ghosting / plate memory'], ['overpaint', 'Overpaint / correction'],
  ['tape_edges', 'Tape edges / masking'], ['stipple_noise', 'Stipple / noise fill'], ['bleed', 'Ink bleed / feather'],
] as const;

export type FormState = {
  mode: 'FULL' | 'STYLE' | 'GESTURE' | 'PRINT' | 'LIVE';
  subject: string;
  styleTokens: string;
  notes: string;
  exportMode: 'FULL' | 'COMPACT' | 'RAW' | 'IMAGE';
  vibeDescription: string;
  vibeImageList: string;
  hallucination: number;
  steps: number;
  curve: string;
  startH: string;
  endH: string;
  paletteLock: string;
  medium: string;
  aspectRatio: string;
  qualityHint: string;
  negativePrompt: string;
  arcaneEnabled: boolean;
  sleepEnabled: boolean;
  colorEnabled: boolean;
  evolveEnabled: boolean;
  mutateEnabled: boolean;
  printEnabled: boolean;
  platesEnabled: boolean;
  injectSymbols: boolean;
  symbolsPerState: number;
  humanizerLevel: string;
  humanizerNotes: string;
  paintingInfluence: string;
  paintingStrength: string;
  paintingNotes: string;
  plateMap: string;
  qualities: Record<string, boolean>;
};

export const defaultFormState = (): FormState => ({
  mode: 'FULL',
  subject: 'NEW ORIGINAL IMAGE — do not copy refs; follow system behavior.',
  styleTokens: 'STYLE.HYPNAGOGIC, STYLE.NEWWEIRD, STYLE.PRINT',
  notes: '',
  exportMode: 'FULL',
  vibeDescription: '',
  vibeImageList: '',
  hallucination: 72,
  steps: 6,
  curve: 's-curve',
  startH: '',
  endH: '',
  paletteLock: '',
  medium: 'mixed media ink + graphite',
  aspectRatio: '1:1',
  qualityHint: 'high detail, tactile marks, physical media feel',
  negativePrompt: 'sterile vector sheen, glossy CGI surfaces, over-clean geometry',
  arcaneEnabled: true,
  sleepEnabled: true,
  colorEnabled: true,
  evolveEnabled: true,
  mutateEnabled: false,
  printEnabled: false,
  platesEnabled: false,
  injectSymbols: false,
  symbolsPerState: 3,
  humanizerLevel: '',
  humanizerNotes: '',
  paintingInfluence: 'NONE',
  paintingStrength: '',
  paintingNotes: '',
  plateMap: '',
  qualities: Object.fromEntries(HUMANIZER_QUALITIES.map(([k]) => [k, false])),
});

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const curveValue = (curve: string, t: number) => {
  const x = Math.max(0, Math.min(1, t));
  if (curve === 'ease-in') return x * x;
  if (curve === 'ease-out') return 1 - (1 - x) * (1 - x);
  if (curve === 's-curve' || curve === 'sigmoid') return x * x * (3 - 2 * x);
  if (curve === 'pulse') return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
  return x;
};

const expandStyleTokens = (tokens: string) => tokens.split(',').map((t) => t.trim()).filter(Boolean).map((t) => STYLE_TOKENS[t] ?? t).join('; ');

const autoColor = (h: number) => (h < 25 ? 'monochrome graphite + faint wash' : h < 50 ? 'limited 2–3 ink palette' : h < 75 ? 'riso overprint + visible misregistration' : 'unstable spectral overprint (still physical ink)');

function defaultsFromH(h: number) {
  return {
    coherence: clamp(90 - 0.7 * h), recursion: clamp(5 + 0.85 * h), presence: clamp(12 + 0.7 * h), drift: clamp(15 + 0.6 * h),
  };
}

export type GeneratedState = { index: number; hallucination: number; coherence: number; recursion: number; prompt: string };

function sampleSymbols(lexicon: Record<string, unknown>, count: number) {
  const keys = Object.keys(lexicon);
  return [...keys].sort(() => Math.random() - 0.5).slice(0, count).map((k) => `${k}=${String(lexicon[k])}`);
}

function compilePrompt(parts: Record<string, unknown>, mode: FormState['exportMode']) {
  if (mode === 'RAW') return JSON.stringify(parts, null, 2);
  if (mode === 'IMAGE') return [
    'HANDRAW-HUMAN',
    parts.subject ? `subject: ${parts.subject}` : '',
    parts.style ? `style: ${parts.style}` : '',
    `hallucination ${parts.hallucination}; drift ${parts.drift}; presence ${parts.presence}`,
  ].filter(Boolean).join(' — ');

  const lines = [
    'HANDRAW-HUMAN',
    parts.subject ? `subject: ${parts.subject}` : '',
    parts.style ? `style: ${parts.style}` : '',
    parts.events ? `EVENTS: ${String(parts.events)}` : '',
    `HYPNA-MATRIX\nhallucination: ${parts.hallucination}\ncoherence: ${parts.coherence}\nrecursion: ${parts.recursion}\nauto-color: ${parts.autoColor}`,
    `SLEEP-STATE\npresence: ${parts.presence}\nvisual-drift: ${parts.drift}`,
    `HUMANIZER\nlevel: ${parts.humanizerLevel}\nqualities: ${parts.qualities || 'none'}`,
    parts.paletteLock ? `AUTO-COLOR\npalette-lock: ${parts.paletteLock}` : '',
    parts.vibeDescription ? `VIBE-REFERENCE\nvibe-description: ${parts.vibeDescription}` : '',
    parts.vibeImageList ? `vibe-images-to-attach: ${parts.vibeImageList}` : '',
    `IMAGE-GEN
medium: ${parts.medium}
aspect-ratio: ${parts.aspectRatio}
quality-hint: ${parts.qualityHint}
negative: ${parts.negativePrompt}` ,
    parts.notes ? `notes: ${parts.notes}` : '',
  ].filter(Boolean).join('\n\n');

  if (mode === 'COMPACT') return lines.replace(/^([A-Z\-]+)$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  return lines;
}

export function validateForm(form: FormState) {
  if (Number.isNaN(form.hallucination) || form.hallucination < 0 || form.hallucination > 100) throw new Error('Hallucination must be 0–100.');
  if (form.steps < 1 || form.steps > 20) throw new Error('Steps must be 1–20.');
  if (!['FULL', 'STYLE', 'GESTURE', 'PRINT', 'LIVE'].includes(form.mode)) throw new Error('Invalid mode.');
  if (!['STYLE', 'GESTURE', 'PRINT'].includes(form.mode) && !form.subject.trim()) throw new Error('Subject is required for FULL/LIVE.');
}

export function generateSeries(form: FormState, lexicon: Record<string, unknown>): GeneratedState[] {
  validateForm(form);
  const steps = form.evolveEnabled ? form.steps : 1;
  const startH = form.startH ? Number(form.startH) : clamp(form.hallucination - 20);
  const endH = form.endH ? Number(form.endH) : clamp(form.hallucination + 20);

  return Array.from({ length: steps }, (_, i) => {
    const t = steps <= 1 ? 0 : i / (steps - 1);
    const h = form.evolveEnabled ? clamp(Math.round(startH + (endH - startH) * curveValue(form.curve, t))) : form.hallucination;
    const d = defaultsFromH(h);
    const events = [h >= 82 && d.coherence <= 40 ? 'rupture' : '', d.recursion >= 75 ? 'loop-pressure' : ''].filter(Boolean).join(', ');
    const qualities = HUMANIZER_QUALITIES.filter(([k]) => form.qualities[k]).map(([, l]) => l).join(', ');
    const symbols = form.injectSymbols ? sampleSymbols(lexicon, form.symbolsPerState).join(', ') : '';

    const prompt = compilePrompt({
      subject: !['STYLE', 'GESTURE', 'PRINT'].includes(form.mode) ? form.subject : '',
      style: expandStyleTokens(form.styleTokens),
      hallucination: h,
      coherence: d.coherence,
      recursion: d.recursion,
      autoColor: autoColor(h),
      presence: d.presence,
      drift: d.drift,
      events,
      humanizerLevel: form.humanizerLevel || clamp(25 + 0.6 * h),
      qualities,
      paletteLock: form.paletteLock,
      vibeDescription: form.vibeDescription,
      vibeImageList: form.vibeImageList,
      medium: form.medium,
      aspectRatio: form.aspectRatio,
      qualityHint: form.qualityHint,
      negativePrompt: form.negativePrompt,
      notes: [form.notes, symbols ? `symbol-lexicon-injection: ${symbols}` : ''].filter(Boolean).join('\n'),
    }, form.exportMode);

    return { index: i + 1, hallucination: h, coherence: d.coherence, recursion: d.recursion, prompt };
  });
}
