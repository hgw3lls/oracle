import { ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  BOOTLOADER_TEXT,
  HUMANIZER_QUALITIES,
  SYSTEM_FILE_TEXT,
  defaultFormState,
  generateSeries,
  type FormState,
  type GeneratedState,
} from './hypnaEngine';
import { extractPaletteFromImage } from './paletteExtract';
import './app.css';

const BUILDERS = {
  oracle: {
    label: 'Oracle',
    title: 'HYPNAGNOSIS Prompt Builder',
    subtitle: 'blank=autofill · SKIP=omit · NONE=disable',
    styleTemplates: [
      {
        label: 'Hypnagogic Print',
        styleTokens: 'STYLE.HYPNAGOGIC, STYLE.PRINT, high-contrast ink',
        notes: 'Favor limited inks, overprint, and visible plate drift.',
      },
      {
        label: 'Occult Diagram',
        styleTokens: 'STYLE.OCCULT, STYLE.CONSPIRACY_DIAGRAM, monochrome diagrammatics',
        notes: 'Push sigils, annotation lines, and ritual map logic.',
      },
      {
        label: 'Graphic Score',
        styleTokens: 'STYLE.GRAPHIC_SCORE, STYLE.NEWWEIRD, tactile mark-making',
        notes: 'Treat composition like a performable visual score with temporal cues.',
      },
    ],
  },
  graphicNotation: {
    label: 'Graphic Notation PromptGen',
    title: 'Graphic Notation PromptGen',
    subtitle: 'notation-first visual scoring · preserves independent state',
    styleTemplates: [
      {
        label: 'Graphic Staff',
        styleTokens: 'STYLE.GRAPHIC_SCORE, notation staves, measured intervals',
        notes: 'Compose forms as staves, bars, accents, and timing marks.',
      },
      {
        label: 'Gesture Cue Sheet',
        styleTokens: 'gesture glyphs, cue marks, kinetic line pressure',
        notes: 'Use directional arrows and dynamic intensity markers.',
      },
      {
        label: 'Diagram Pulse',
        styleTokens: 'diagrammatics, pulse clusters, symbol cadence',
        notes: 'Layer symbol repetition to imply tempo and visual rhythm.',
      },
    ],
  },
} as const;

type BuilderMode = keyof typeof BUILDERS;

type BuilderState = {
  form: FormState;
  series: GeneratedState[];
  output: string;
  status: string;
  lexicon: Record<string, unknown>;
  selectedStyleTemplate: string;
};

const createInitialBuilderState = (mode: BuilderMode): BuilderState => ({
  form: defaultFormState(),
  series: [],
  output: 'Ready. Click Generate.',
  status: 'Ready.',
  lexicon: {},
  selectedStyleTemplate: BUILDERS[mode].styleTemplates[0].label,
});

export default function App() {
  const [activeBuilder, setActiveBuilder] = useState<BuilderMode>('oracle');
  const [builderStates, setBuilderStates] = useState<Record<BuilderMode, BuilderState>>({
    oracle: createInitialBuilderState('oracle'),
    graphicNotation: createInitialBuilderState('graphicNotation'),
  });
  const [dark, setDark] = useState(true);
  const [isExtractingPalette, setIsExtractingPalette] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paletteImageInputRef = useRef<HTMLInputElement>(null);

  const activeState = builderStates[activeBuilder];
  const { form, output, status, lexicon, selectedStyleTemplate } = activeState;
  const templates = BUILDERS[activeBuilder].styleTemplates;

  const panelClass = dark ? 'app dark' : 'app light';

  const updateBuilderState = (updater: (state: BuilderState) => BuilderState, mode = activeBuilder) => {
    setBuilderStates((previous) => ({
      ...previous,
      [mode]: updater(previous[mode]),
    }));
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    updateBuilderState((state) => ({ ...state, form: { ...state.form, [key]: value } }));
  };

  const runGenerate = (asSeries: boolean) => {
    try {
      const next = generateSeries(form, lexicon);
      if (asSeries) {
        updateBuilderState((state) => ({
          ...state,
          series: next,
          output: next.map((s) => `=== STATE ${s.index} ===\n${s.prompt}`).join('\n\n'),
          status: `Generated ${next.length} states.`,
        }));
      } else {
        updateBuilderState((state) => ({
          ...state,
          series: next,
          output: next[0]?.prompt ?? '',
          status: 'Generated 1 prompt.',
        }));
      }
    } catch (error) {
      updateBuilderState((state) => ({
        ...state,
        status: error instanceof Error ? error.message : 'Generation failed',
      }));
    }
  };

  const saveText = (name: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const palettePreview = useMemo(
    () => form.paletteLock.split(',').map((c) => c.trim()).filter(Boolean),
    [form.paletteLock],
  );

  const loadLexicon = async (e: ChangeEvent<HTMLInputElement>) => {
    const mode = activeBuilder;
    const file = e.target.files?.[0];
    if (!file) return;
    const json = JSON.parse(await file.text()) as Record<string, unknown>;
    updateBuilderState(
      (state) => ({
        ...state,
        lexicon: json,
        status: `Loaded lexicon: ${Object.keys(json).length} entries.`,
      }),
      mode,
    );
  };

  const applyStyleTemplate = () => {
    const template = templates.find((t) => t.label === selectedStyleTemplate);
    if (!template) return;
    updateBuilderState((state) => ({
      ...state,
      form: { ...state.form, styleTokens: template.styleTokens, notes: template.notes },
      status: `Applied style template: ${template.label}.`,
    }));
  };

  const handlePaletteImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const mode = activeBuilder;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtractingPalette(true);
      const colors = await extractPaletteFromImage(file, 5);
      updateBuilderState(
        (state) => ({
          ...state,
          form: { ...state.form, paletteLock: colors.join(', ') },
          status: `Extracted ${colors.length} colors from ${file.name}.`,
        }),
        mode,
      );
    } catch (error) {
      updateBuilderState(
        (state) => ({
          ...state,
          status: error instanceof Error ? error.message : 'Palette extraction failed.',
        }),
        mode,
      );
    } finally {
      setIsExtractingPalette(false);
      e.target.value = '';
    }
  };

  return (
    <div className={panelClass}>
      <header className="appbar">
        <div>
          <h1>{BUILDERS[activeBuilder].title}</h1>
          <p>{BUILDERS[activeBuilder].subtitle}</p>
        </div>
        <div className="actions">
          <div className="mode-toggle" role="tablist" aria-label="Prompt builder mode">
            {(Object.keys(BUILDERS) as BuilderMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={activeBuilder === mode}
                className={activeBuilder === mode ? 'active' : ''}
                onClick={() => setActiveBuilder(mode)}
              >
                {BUILDERS[mode].label}
              </button>
            ))}
          </div>
          <label><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark</label>
          <button onClick={() => runGenerate(false)}>Generate</button>
          <button onClick={() => runGenerate(true)}>Series</button>
          <button onClick={() => navigator.clipboard.writeText(output)}>Copy</button>
          <button onClick={() => saveText('hypnagnosis_prompts.txt', output)}>Save</button>
        </div>
      </header>
      <main className="body">
        <aside className="sidebar">
          <button onClick={() => fileInputRef.current?.click()}>Load Lexicon</button>
          <input ref={fileInputRef} type="file" hidden accept="application/json" onChange={loadLexicon} />
          <button onClick={() => saveText('boot_system_prompts.txt', `${BOOTLOADER_TEXT}\n\n${SYSTEM_FILE_TEXT}\n\n${output}`)}>Export Boot+System</button>
          <button onClick={() => paletteImageInputRef.current?.click()} disabled={isExtractingPalette}>{isExtractingPalette ? 'Extracting palette…' : 'Upload Palette Image'}</button>
          <input ref={paletteImageInputRef} type="file" hidden accept="image/*" onChange={handlePaletteImageUpload} />
        </aside>

        <section className="content">
          <div className="card">
            <h2>Core</h2>
            <label>Mode<select value={form.mode} onChange={(e) => update('mode', e.target.value as FormState['mode'])}><option>FULL</option><option>STYLE</option><option>GESTURE</option><option>PRINT</option><option>LIVE</option></select></label>
            <label>Subject<input value={form.subject} onChange={(e) => update('subject', e.target.value)} /></label>
            <label>Style tokens<input value={form.styleTokens} onChange={(e) => update('styleTokens', e.target.value)} /></label>
            <label>Style template
              <div className="inline-group">
                <select value={selectedStyleTemplate} onChange={(e) => updateBuilderState((state) => ({ ...state, selectedStyleTemplate: e.target.value }))}>
                  {templates.map((template) => <option key={template.label}>{template.label}</option>)}
                </select>
                <button type="button" onClick={applyStyleTemplate}>Apply Template</button>
              </div>
            </label>
            <label>Export mode<select value={form.exportMode} onChange={(e) => update('exportMode', e.target.value as FormState['exportMode'])}><option>FULL</option><option>COMPACT</option><option>RAW</option><option>IMAGE</option></select></label>
          </div>

          <div className="card">
            <h2>Vibe + Dynamics</h2>
            <label>Vibe description<textarea value={form.vibeDescription} onChange={(e) => update('vibeDescription', e.target.value)} /></label>
            <label>Vibe image list<input value={form.vibeImageList} onChange={(e) => update('vibeImageList', e.target.value)} /></label>
            <label>Hallucination (0-100)<input type="number" min={0} max={100} value={form.hallucination} onChange={(e) => update('hallucination', Number(e.target.value))} /></label>
            <label>Steps (1-20)<input type="number" min={1} max={20} value={form.steps} onChange={(e) => update('steps', Number(e.target.value))} /></label>
            <label>Curve<input value={form.curve} onChange={(e) => update('curve', e.target.value)} /></label>
            <label>Start hallucination<input value={form.startH} onChange={(e) => update('startH', e.target.value)} /></label>
            <label>End hallucination<input value={form.endH} onChange={(e) => update('endH', e.target.value)} /></label>
          </div>

          <div className="card">
            <h2>Modules</h2>
            <div className="checks">
              <label><input type="checkbox" checked={form.arcaneEnabled} onChange={(e) => update('arcaneEnabled', e.target.checked)} /> Arcane</label>
              <label><input type="checkbox" checked={form.sleepEnabled} onChange={(e) => update('sleepEnabled', e.target.checked)} /> Sleep</label>
              <label><input type="checkbox" checked={form.colorEnabled} onChange={(e) => update('colorEnabled', e.target.checked)} /> Color</label>
              <label><input type="checkbox" checked={form.evolveEnabled} onChange={(e) => update('evolveEnabled', e.target.checked)} /> Evolution</label>
              <label><input type="checkbox" checked={form.mutateEnabled} onChange={(e) => update('mutateEnabled', e.target.checked)} /> Mutation</label>
              <label><input type="checkbox" checked={form.printEnabled} onChange={(e) => update('printEnabled', e.target.checked)} /> Print</label>
              <label><input type="checkbox" checked={form.platesEnabled} onChange={(e) => update('platesEnabled', e.target.checked)} /> Plates</label>
            </div>
            <label>Palette lock<input value={form.paletteLock} onChange={(e) => update('paletteLock', e.target.value)} placeholder="#ff0000, #00ff00" /></label>
            {!!palettePreview.length && (
              <div className="palette-preview" aria-label="Palette preview">
                {palettePreview.map((color) => <span key={color} style={{ background: color }} title={color} />)}
              </div>
            )}
            <label>Painting influence<input value={form.paintingInfluence} onChange={(e) => update('paintingInfluence', e.target.value)} /></label>
            <label>Humanizer level<input value={form.humanizerLevel} onChange={(e) => update('humanizerLevel', e.target.value)} /></label>
            <label>Notes<textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
          </div>

          <div className="card">
            <h2>Humanizer Qualities + Symbol Injection</h2>
            <div className="checks">
              {HUMANIZER_QUALITIES.map(([k, label]) => (
                <label key={k}><input type="checkbox" checked={form.qualities[k]} onChange={(e) => updateBuilderState((state) => ({ ...state, form: { ...state.form, qualities: { ...state.form.qualities, [k]: e.target.checked } } }))} /> {label}</label>
              ))}
            </div>
            <label><input type="checkbox" checked={form.injectSymbols} onChange={(e) => update('injectSymbols', e.target.checked)} /> Inject symbol lexicon</label>
            <label>Symbols per state<input type="number" min={0} max={10} value={form.symbolsPerState} onChange={(e) => update('symbolsPerState', Number(e.target.value))} /></label>
          </div>
        </section>

        <section className="output">
          <h2>Output</h2>
          <textarea value={output} onChange={(e) => updateBuilderState((state) => ({ ...state, output: e.target.value }))} />
        </section>
      </main>
      <footer className="status">{status}</footer>
    </div>
  );
}
