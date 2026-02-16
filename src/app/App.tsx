import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import GraphicNotationApp from '../graphic-notation/GraphicNotationApp';
import OutputPanel from '../shared/components/OutputPanel';
import PresetManager from '../shared/components/PresetManager';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import './app.css';

const MODE_STORAGE_KEY = 'app:mode';
const ORACLE_STATE_STORAGE_KEY = 'oracle:mode_state';

const ORACLE_STYLE_TEMPLATES = [
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
];

const MODE_META = {
  oracle: { label: 'Oracle', description: 'original prompt builder' },
  graphicNotation: { label: 'Graphic Notation', description: 'graphical score prompt builder' },
};

type BuilderMode = 'oracle' | 'graphicNotation';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const loadStoredOracleForm = () => {
  if (!canUseStorage()) return defaultFormState();
  const raw = window.localStorage.getItem(ORACLE_STATE_STORAGE_KEY);
  if (!raw) return defaultFormState();
  const parsed = safeParse(raw);
  const defaults = defaultFormState();

  if (!parsed || typeof parsed !== 'object') return defaults;
  const incoming = parsed as Partial<FormState>;

  return {
    ...defaults,
    ...incoming,
    qualities: {
      ...defaults.qualities,
      ...(incoming.qualities && typeof incoming.qualities === 'object' ? incoming.qualities : {}),
    },
  };
};

export default function App() {
  return <AppShell />;
}

function AppShell() {
  const [mode, setMode] = useState<BuilderMode>(() => {
    if (!canUseStorage()) return 'oracle';
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
    return stored === 'graphicNotation' ? 'graphicNotation' : 'oracle';
  });

  useEffect(() => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  return (
    <div className="app-shell">
      <header className="mode-shell-header">
        <h1>Mode Switch</h1>
        <div className="mode-toggle" role="tablist" aria-label="Prompt builder mode switch">
          <button type="button" role="tab" aria-selected={mode === 'oracle'} className={mode === 'oracle' ? 'active' : ''} onClick={() => setMode('oracle')}>
            Oracle
          </button>
          <button type="button" role="tab" aria-selected={mode === 'graphicNotation'} className={mode === 'graphicNotation' ? 'active' : ''} onClick={() => setMode('graphicNotation')}>
            Graphic Notation
          </button>
        </div>
        <p className="mode-indicator">
          Mode: <strong>{MODE_META[mode].label}</strong> — {MODE_META[mode].description}
        </p>
      </header>

      <div className="mode-shell-content">
        <section hidden={mode !== 'oracle'} aria-hidden={mode !== 'oracle'}>
          <ErrorBoundary>
            <OracleApp />
          </ErrorBoundary>
        </section>
        <section hidden={mode !== 'graphicNotation'} aria-hidden={mode !== 'graphicNotation'}>
          <ErrorBoundary>
            <GraphicNotationApp />
          </ErrorBoundary>
        </section>
      </div>
    </div>
  );
}

function OracleApp() {
  const [form, setForm] = useState<FormState>(() => loadStoredOracleForm());
  const [series, setSeries] = useState<GeneratedState[]>([]);
  const [output, setOutput] = useState('Ready. Click Generate.');
  const [imagePromptOutput, setImagePromptOutput] = useState('Ready. Generate to build an image-specific prompt.');
  const [status, setStatus] = useState('Ready.');
  const [dark, setDark] = useState(true);
  const [lexicon, setLexicon] = useState<Record<string, unknown>>({});
  const [selectedStyleTemplate, setSelectedStyleTemplate] = useState(ORACLE_STYLE_TEMPLATES[0].label);
  const [isExtractingPalette, setIsExtractingPalette] = useState(false);
  const [lastRunMode, setLastRunMode] = useState<'single' | 'series'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paletteImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ORACLE_STATE_STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const panelClass = dark ? 'app dark' : 'app light';

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const runGenerate = (asSeries: boolean) => {
    try {
      const next = generateSeries(form, lexicon);
      setSeries(next);
      const firstImagePrompt = next[0]?.prompt ?? '';

      if (asSeries) {
        setOutput(next.map((s) => `=== STATE ${s.index} ===\n${s.prompt}`).join('\n\n'));
        setStatus(`Generated ${next.length} states.`);
      } else {
        setOutput(next[0]?.prompt ?? '');
        setStatus('Generated 1 prompt.');
      }

      const imagePromptStates = generateSeries({ ...form, exportMode: 'IMAGE' }, lexicon);
      setImagePromptOutput(
        asSeries
          ? imagePromptStates.map((state) => `=== IMAGE STATE ${state.index} ===\n${state.prompt}`).join('\n\n')
          : (imagePromptStates[0]?.prompt ?? firstImagePrompt),
      );
      setLastRunMode(asSeries ? 'series' : 'single');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Generation failed');
    }
  };

  const regenerate = () => {
    runGenerate(lastRunMode === 'series');
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
    const file = e.target.files?.[0];
    if (!file) return;
    const json = JSON.parse(await file.text()) as Record<string, unknown>;
    setLexicon(json);
    setStatus(`Loaded lexicon: ${Object.keys(json).length} entries.`);
  };

  const applyStyleTemplate = () => {
    const template = ORACLE_STYLE_TEMPLATES.find((t) => t.label === selectedStyleTemplate);
    if (!template) return;
    setForm((f) => ({ ...f, styleTokens: template.styleTokens, notes: template.notes }));
    setStatus(`Applied style template: ${template.label}.`);
  };

  const loadOraclePreset = (params: Record<string, unknown>) => {
    const defaults = defaultFormState();
    const safeParams = params && typeof params === 'object' ? params : {};
    const incomingQualities =
      safeParams.qualities && typeof safeParams.qualities === 'object'
        ? (safeParams.qualities as Record<string, boolean>)
        : {};

    setForm({
      ...defaults,
      ...(safeParams as Partial<FormState>),
      qualities: { ...defaults.qualities, ...incomingQualities },
    });
    setStatus('Loaded preset.');
  };

  const resetOracleModeState = () => {
    if (canUseStorage()) window.localStorage.removeItem(ORACLE_STATE_STORAGE_KEY);
    setForm(defaultFormState());
    setSeries([]);
    setOutput('Ready. Click Generate.');
    setImagePromptOutput('Ready. Generate to build an image-specific prompt.');
    setStatus('Oracle mode reset to defaults.');
    setLexicon({});
    setSelectedStyleTemplate(ORACLE_STYLE_TEMPLATES[0].label);
    setLastRunMode('single');
  };

  const handlePaletteImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtractingPalette(true);
      const colors = await extractPaletteFromImage(file, 5);
      update('paletteLock', colors.join(', '));
      setStatus(`Extracted ${colors.length} colors from ${file.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Palette extraction failed.');
    } finally {
      setIsExtractingPalette(false);
      e.target.value = '';
    }
  };

  return (
    <div className={panelClass}>
      <header className="appbar">
        <div>
          <h1>HYPNAGNOSIS Prompt Builder</h1>
          <p>blank=autofill · SKIP=omit · NONE=disable</p>
        </div>
        <div className="actions">
          <label><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark</label>
          <button onClick={() => runGenerate(false)}>Generate</button>
          <button onClick={() => runGenerate(true)}>Series</button>
          <button onClick={regenerate}>Regenerate</button>
          <button type="button" onClick={resetOracleModeState}>Reset mode state</button>
        </div>
      </header>
      <main className="body">
        <aside className="sidebar">
          <button onClick={() => fileInputRef.current?.click()}>Load Lexicon</button>
          <input ref={fileInputRef} type="file" hidden accept="application/json" onChange={loadLexicon} />
          <button type="button" onClick={() => runGenerate(false)}>Quick Generate</button>
          <button type="button" onClick={regenerate}>Quick Regenerate</button>
          <button onClick={() => saveText('boot_system_prompts.txt', `${BOOTLOADER_TEXT}\n\n${SYSTEM_FILE_TEXT}\n\n${output}`)}>Export Boot+System</button>
          <button onClick={() => paletteImageInputRef.current?.click()} disabled={isExtractingPalette}>{isExtractingPalette ? 'Extracting palette…' : 'Upload Palette Image'}</button>
          <input ref={paletteImageInputRef} type="file" hidden accept="image/*" onChange={handlePaletteImageUpload} />
          <PresetManager
            title="Oracle Preset Packs"
            storageKey="oracle:preset_packs"
            getCurrentParams={() => form}
            onLoadPreset={loadOraclePreset}
          />
        </aside>

        <section className="content">
          <div className="card">
            <h2>Core</h2>
            <label>Mode<select value={form.mode} onChange={(e) => update('mode', e.target.value as FormState['mode'])}><option>FULL</option><option>STYLE</option><option>GESTURE</option><option>PRINT</option><option>LIVE</option></select></label>
            <label>Subject<input value={form.subject} onChange={(e) => update('subject', e.target.value)} /></label>
            <label>Style tokens<input value={form.styleTokens} onChange={(e) => update('styleTokens', e.target.value)} /></label>
            <label>Style template
              <div className="inline-group">
                <select value={selectedStyleTemplate} onChange={(e) => setSelectedStyleTemplate(e.target.value)}>
                  {ORACLE_STYLE_TEMPLATES.map((template) => <option key={template.label}>{template.label}</option>)}
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
                <label key={k}><input type="checkbox" checked={form.qualities[k]} onChange={(e) => setForm((f) => ({ ...f, qualities: { ...f.qualities, [k]: e.target.checked } }))} /> {label}</label>
              ))}
            </div>
            <label><input type="checkbox" checked={form.injectSymbols} onChange={(e) => update('injectSymbols', e.target.checked)} /> Inject symbol lexicon</label>
            <label>Symbols per state<input type="number" min={0} max={10} value={form.symbolsPerState} onChange={(e) => update('symbolsPerState', Number(e.target.value))} /></label>
          </div>
        </section>

        <section className="output">
          <OutputPanel title="Oracle Output" textOutput={output} />
          <OutputPanel title="Image Generation Prompt" textOutput={imagePromptOutput} />
        </section>
      </main>
      <footer className="status">{status}</footer>
    </div>
  );
}
