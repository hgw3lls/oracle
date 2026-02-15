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
import './app.css';

export default function App() {
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [series, setSeries] = useState<GeneratedState[]>([]);
  const [output, setOutput] = useState('Ready. Click Generate.');
  const [status, setStatus] = useState('Ready.');
  const [dark, setDark] = useState(true);
  const [lexicon, setLexicon] = useState<Record<string, unknown>>({});
  const [showGraph, setShowGraph] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const saveText = (name: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const graphData = useMemo(() => {
    if (!series.length) return '';
    const maxX = Math.max(...series.map((s) => s.index));
    const toPoint = (x: number, y: number) => `${(x / maxX) * 560 + 20},${320 - y * 2.8}`;
    return {
      h: series.map((s) => toPoint(s.index, s.hallucination)).join(' '),
      c: series.map((s) => toPoint(s.index, s.coherence)).join(' '),
      r: series.map((s) => toPoint(s.index, s.recursion)).join(' '),
    };
  }, [series]);

  const loadLexicon = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const json = JSON.parse(await file.text()) as Record<string, unknown>;
    setLexicon(json);
    setStatus(`Loaded lexicon: ${Object.keys(json).length} entries.`);
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
          <button onClick={() => navigator.clipboard.writeText(output)}>Copy</button>
          <button onClick={() => saveText('hypnagnosis_prompts.txt', output)}>Save</button>
        </div>
      </header>
      <main className="body">
        <aside className="sidebar">
          <button onClick={() => fileInputRef.current?.click()}>Load Lexicon</button>
          <input ref={fileInputRef} type="file" hidden accept="application/json" onChange={loadLexicon} />
          <button onClick={() => saveText('boot_system_prompts.txt', `${BOOTLOADER_TEXT}\n\n${SYSTEM_FILE_TEXT}\n\n${output}`)}>Export Boot+System</button>
          <button onClick={() => setShowGraph(true)}>View Evolution Graph</button>
        </aside>

        <section className="content">
          <div className="card">
            <h2>Core</h2>
            <label>Mode<select value={form.mode} onChange={(e) => update('mode', e.target.value as FormState['mode'])}><option>FULL</option><option>STYLE</option><option>GESTURE</option><option>PRINT</option><option>LIVE</option></select></label>
            <label>Subject<input value={form.subject} onChange={(e) => update('subject', e.target.value)} /></label>
            <label>Style tokens<input value={form.styleTokens} onChange={(e) => update('styleTokens', e.target.value)} /></label>
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
          <h2>Output</h2>
          <textarea value={output} onChange={(e) => setOutput(e.target.value)} />
        </section>
      </main>
      <footer className="status">{status}</footer>

      {showGraph && (
        <div className="modal" onClick={() => setShowGraph(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Evolution Graph</h3>
            {!series.length ? <p>Generate series first.</p> : (
              <svg viewBox="0 0 600 340">
                <polyline points={graphData.h} fill="none" stroke="#4f7cff" strokeWidth="3" />
                <polyline points={graphData.c} fill="none" stroke="#12b981" strokeWidth="3" />
                <polyline points={graphData.r} fill="none" stroke="#f97316" strokeWidth="3" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
