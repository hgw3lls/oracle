import { ChangeEvent, useEffect, useRef, useState } from 'react';
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

const STYLE_PRESETS = [
  'STYLE.HYPNAGOGIC, STYLE.NEWWEIRD, STYLE.PRINT',
  'STYLE.OCCULT, STYLE.CONSPIRACY_DIAGRAM',
  'STYLE.GRAPHIC_SCORE, STYLE.PRINT',
];

export default function App() {
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [series, setSeries] = useState<GeneratedState[]>([]);
  const [output, setOutput] = useState('Ready. Click Generate.');
  const [status, setStatus] = useState('Ready.');
  const [dark, setDark] = useState(true);
  const [livePreview, setLivePreview] = useState(false);
  const [lexicon, setLexicon] = useState<Record<string, unknown>>({});
  const [palettePreview, setPalettePreview] = useState<string[]>([]);

  const lexiconFileRef = useRef<HTMLInputElement>(null);
  const paletteImageRef = useRef<HTMLInputElement>(null);

  const panelClass = dark ? 'app dark' : 'app light';
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const runGenerate = (asSeries: boolean) => {
    try {
      const next = generateSeries(form, lexicon);
      setSeries(next);
      if (asSeries) {
        setOutput(next.map((s) => `=== STATE ${s.index} ===\n${s.prompt}`).join('\n\n'));
        setStatus(`Generated ${next.length} states.`);
      } else {
        setOutput(next[0]?.prompt ?? '');
        setStatus('Generated 1 prompt.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Generation failed');
    }
  };

  useEffect(() => {
    if (!livePreview) return;
    const id = window.setTimeout(() => runGenerate(false), 350);
    return () => window.clearTimeout(id);
  }, [form, livePreview]);

  const saveText = (name: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loadLexicon = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text()) as Record<string, unknown>;
      setLexicon(json);
      setStatus(`Loaded lexicon: ${Object.keys(json).length} entries.`);
    } catch {
      setStatus('Invalid JSON lexicon file.');
    }
  };

  const onPaletteImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const palette = await extractPaletteFromImage(file, 5);
      setPalettePreview(palette);
      update('paletteLock', palette.join(', '));
      setStatus(`Extracted ${palette.length} colors from image.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Palette extraction failed.');
    }
  };

  return (
    <div className={panelClass}>
      <header className="appbar">
        <div>
          <h1>HYPNAGNOSIS Prompt Builder</h1>
          <p>Image prompt studio: guided form + instant prompt output.</p>
        </div>
        <div className="actions">
          <label><input type="checkbox" checked={livePreview} onChange={(e) => setLivePreview(e.target.checked)} /> Live</label>
          <label><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark</label>
          <button onClick={() => runGenerate(false)}>Generate</button>
          <button onClick={() => runGenerate(true)}>Series</button>
          <button onClick={() => navigator.clipboard.writeText(output)}>Copy</button>
          <button onClick={() => saveText('hypnagnosis_prompts.txt', output)}>Save</button>
        </div>
      </header>

      <main className="body">
        <aside className="sidebar">
          <h3>Tools</h3>
          <button onClick={() => lexiconFileRef.current?.click()}>Load Lexicon JSON</button>
          <input ref={lexiconFileRef} type="file" hidden accept="application/json" onChange={loadLexicon} />
          <button onClick={() => paletteImageRef.current?.click()}>Extract Palette from Image</button>
          <input ref={paletteImageRef} type="file" hidden accept="image/*" onChange={onPaletteImageUpload} />
          <button onClick={() => saveText('boot_system_prompts.txt', `${BOOTLOADER_TEXT}\n\n${SYSTEM_FILE_TEXT}\n\n${output}`)}>Export Boot+System</button>
          <button onClick={() => { setForm(defaultFormState()); setStatus('Reset to defaults.'); }}>Reset Form</button>
          {palettePreview.length > 0 && (
            <>
              <p className="mini-label">Extracted palette</p>
              <div className="swatches">
                {palettePreview.map((hex) => (
                  <button key={hex} className="swatch" style={{ backgroundColor: hex }} title={hex} onClick={() => update('paletteLock', [...new Set([...form.paletteLock.split(',').map((x) => x.trim()).filter(Boolean), hex])].join(', '))} />
                ))}
              </div>
            </>
          )}
        </aside>

        <section className="content">
          <div className="card">
            <h2>Core Prompt</h2>
            <label>Mode<select value={form.mode} onChange={(e) => update('mode', e.target.value as FormState['mode'])}><option>FULL</option><option>STYLE</option><option>GESTURE</option><option>PRINT</option><option>LIVE</option></select></label>
            <label>Subject<input value={form.subject} onChange={(e) => update('subject', e.target.value)} /></label>
            <label>Style tokens<input value={form.styleTokens} onChange={(e) => update('styleTokens', e.target.value)} /></label>
            <div className="chips">{STYLE_PRESETS.map((preset) => <button key={preset} onClick={() => update('styleTokens', preset)}>{preset}</button>)}</div>
            <label>Export mode<select value={form.exportMode} onChange={(e) => update('exportMode', e.target.value as FormState['exportMode'])}><option>FULL</option><option>COMPACT</option><option>RAW</option><option>IMAGE</option></select></label>
          </div>

          <div className="card two-col">
            <h2>Image Generation Hints</h2>
            <label>Medium<input value={form.medium} onChange={(e) => update('medium', e.target.value)} /></label>
            <label>Aspect ratio<input value={form.aspectRatio} onChange={(e) => update('aspectRatio', e.target.value)} placeholder="1:1, 16:9, 4:5" /></label>
            <label>Quality hint<textarea value={form.qualityHint} onChange={(e) => update('qualityHint', e.target.value)} /></label>
            <label>Negative prompt<textarea value={form.negativePrompt} onChange={(e) => update('negativePrompt', e.target.value)} /></label>
            <label>Palette lock<input value={form.paletteLock} onChange={(e) => update('paletteLock', e.target.value)} placeholder="#2f2a24, #785f43" /></label>
            <label>Vibe description<textarea value={form.vibeDescription} onChange={(e) => update('vibeDescription', e.target.value)} /></label>
            <label>Vibe image list<input value={form.vibeImageList} onChange={(e) => update('vibeImageList', e.target.value)} /></label>
          </div>

          <div className="card">
            <h2>Dynamics + Modules</h2>
            <label>Hallucination (0-100)<input type="number" min={0} max={100} value={form.hallucination} onChange={(e) => update('hallucination', Number(e.target.value))} /></label>
            <label>Steps (1-20)<input type="number" min={1} max={20} value={form.steps} onChange={(e) => update('steps', Number(e.target.value))} /></label>
            <label>Curve<input value={form.curve} onChange={(e) => update('curve', e.target.value)} /></label>
            <div className="checks">
              <label><input type="checkbox" checked={form.arcaneEnabled} onChange={(e) => update('arcaneEnabled', e.target.checked)} /> Arcane</label>
              <label><input type="checkbox" checked={form.sleepEnabled} onChange={(e) => update('sleepEnabled', e.target.checked)} /> Sleep</label>
              <label><input type="checkbox" checked={form.colorEnabled} onChange={(e) => update('colorEnabled', e.target.checked)} /> Color</label>
              <label><input type="checkbox" checked={form.evolveEnabled} onChange={(e) => update('evolveEnabled', e.target.checked)} /> Evolution</label>
              <label><input type="checkbox" checked={form.mutateEnabled} onChange={(e) => update('mutateEnabled', e.target.checked)} /> Mutation</label>
              <label><input type="checkbox" checked={form.injectSymbols} onChange={(e) => update('injectSymbols', e.target.checked)} /> Symbol Inject</label>
            </div>
            <label>Symbols per state<input type="number" min={0} max={10} value={form.symbolsPerState} onChange={(e) => update('symbolsPerState', Number(e.target.value))} /></label>
            <label>Humanizer level<input value={form.humanizerLevel} onChange={(e) => update('humanizerLevel', e.target.value)} /></label>
            <label>Notes<textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
          </div>

          <div className="card">
            <h2>Humanizer Qualities</h2>
            <div className="checks">
              {HUMANIZER_QUALITIES.map(([k, label]) => (
                <label key={k}><input type="checkbox" checked={form.qualities[k]} onChange={(e) => setForm((f) => ({ ...f, qualities: { ...f.qualities, [k]: e.target.checked } }))} /> {label}</label>
              ))}
            </div>
          </div>
        </section>

        <section className="output">
          <h2>Output Prompt</h2>
          <textarea value={output} onChange={(e) => setOutput(e.target.value)} />
        </section>
      </main>

      <footer className="status">{status}</footer>
    </div>
  );
}
