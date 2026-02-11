import { useMemo, useState } from 'react';
import { DEFAULT_FORM, generateSeries, HUMANIZER_QUALITIES, STYLE_TOKENS } from './lib/promptEngine';

const CURVE_OPTIONS = ['linear', 'ease-in', 'ease-out', 's-curve'];
const MODES = ['FULL', 'STYLE', 'GESTURE', 'PRINT', 'LIVE'];

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [activeState, setActiveState] = useState(0);

  const series = useMemo(() => generateSeries(form), [form]);
  const state = series[Math.min(activeState, series.length - 1)] ?? series[0];

  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <main className="app-shell">
      <header className="app-header">HYPNAGNOSIS — PYTHON TO WEB REFACTOR</header>

      <section className="layout">
        <aside className="panel controls">
          <h2>Input</h2>

          <label>
            Mode
            <select value={form.mode} onChange={(e) => patch('mode', e.target.value)}>
              {MODES.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </label>

          <label>
            Subject
            <input value={form.subject} onChange={(e) => patch('subject', e.target.value)} placeholder="Ash-fall cathedrals" />
          </label>

          <label>
            Notes
            <textarea value={form.notes} onChange={(e) => patch('notes', e.target.value)} rows={3} />
          </label>

          <fieldset>
            <legend>Style Tokens</legend>
            {Object.keys(STYLE_TOKENS).map((token) => (
              <label key={token} className="check-row">
                <input
                  type="checkbox"
                  checked={form.styleTokens.includes(token)}
                  onChange={(e) => {
                    if (e.target.checked) patch('styleTokens', [...form.styleTokens, token]);
                    else patch('styleTokens', form.styleTokens.filter((item) => item !== token));
                  }}
                />
                {token}
              </label>
            ))}
          </fieldset>

          <label>
            Base Hallucination: <strong>{form.hallucination}</strong>
            <input
              type="range"
              min="0"
              max="100"
              value={form.hallucination}
              onChange={(e) => patch('hallucination', Number(e.target.value))}
            />
          </label>

          <fieldset>
            <legend>Auto-Evolve</legend>
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.evolveEnabled}
                onChange={(e) => patch('evolveEnabled', e.target.checked)}
              />
              Enabled
            </label>

            <label>
              Steps
              <input
                type="number"
                min="1"
                max="20"
                value={form.evolveSteps}
                onChange={(e) => patch('evolveSteps', Number(e.target.value))}
              />
            </label>

            <div className="split">
              <label>
                Start H
                <input type="number" min="0" max="100" value={form.startH} onChange={(e) => patch('startH', Number(e.target.value))} />
              </label>
              <label>
                End H
                <input type="number" min="0" max="100" value={form.endH} onChange={(e) => patch('endH', Number(e.target.value))} />
              </label>
            </div>

            <label>
              Curve
              <select value={form.curve} onChange={(e) => patch('curve', e.target.value)}>
                {CURVE_OPTIONS.map((curve) => (
                  <option key={curve} value={curve}>{curve}</option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Humanizer</legend>
            <label>
              Level: <strong>{form.humanizerLevel}</strong>
              <input
                type="range"
                min="0"
                max="100"
                value={form.humanizerLevel}
                onChange={(e) => patch('humanizerLevel', Number(e.target.value))}
              />
            </label>

            {HUMANIZER_QUALITIES.map(([key, label]) => (
              <label key={key} className="check-row">
                <input
                  type="checkbox"
                  checked={Boolean(form.humanizerQualities[key])}
                  onChange={(e) => patch('humanizerQualities', { ...form.humanizerQualities, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </aside>

        <section className="panel states">
          <h2>States</h2>
          <div className="states-grid">
            {series.map((item, idx) => (
              <button
                key={`${item.stateName}-${idx}`}
                type="button"
                className={idx === activeState ? 'state-chip active' : 'state-chip'}
                onClick={() => setActiveState(idx)}
              >
                {idx + 1}. {item.stateName} ({item.hallucination})
              </button>
            ))}
          </div>

          <article className="state-summary">
            <h3>Current state</h3>
            <ul>
              <li>Flow: {state.flow}</li>
              <li>Temporal: {state.temporal}</li>
              <li>Material: {state.material}</li>
              <li>Space: {state.space}</li>
              <li>Symbol: {state.symbol}</li>
              <li>Agency: {state.agency}</li>
              <li>Saturation: {state.saturation}</li>
              <li>Motion: {state.motion}</li>
            </ul>
          </article>
        </section>

        <section className="panel output">
          <h2>Compiled Prompt</h2>
          <pre>{state.prompt}</pre>
        </section>
      </section>
    </main>
  );
}
