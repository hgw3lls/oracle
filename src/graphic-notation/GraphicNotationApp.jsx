import { useMemo, useState } from 'react';
import { buildMasterPrompt, buildPlatePrompts, deriveSpec } from './promptBuilders';

const defaultState = {
  title: 'Signal Cartography No. 1',
  ensemble: 'string trio + live electronics',
  visualIntent: 'high-contrast notation map with temporal anchors and gestural zones',
  durationSec: 180,
  density: 'medium',
  palette: 'black, graphite, and one accent red',
  gestures: 'arc glissando, percussive scratch, held noise cloud',
  constraints: 'avoid conventional staff notation; preserve clear reading path',
};

export default function GraphicNotationApp() {
  const [form, setForm] = useState(defaultState);

  const spec = useMemo(() => deriveSpec(form), [form]);
  const masterPrompt = useMemo(() => buildMasterPrompt(spec), [spec]);
  const platePrompts = useMemo(() => buildPlatePrompts(spec), [spec]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="graphic-notation-app">
      <header className="graphic-notation-header">
        <h2>Graphic Notation PromptGen</h2>
        <p>Build master + plate prompts for performable visual score generation.</p>
      </header>

      <main className="graphic-notation-grid">
        <section className="graphic-notation-card">
          <h3>Specification</h3>
          <label>Title<input value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
          <label>Ensemble<input value={form.ensemble} onChange={(event) => update('ensemble', event.target.value)} /></label>
          <label>Visual intent<textarea value={form.visualIntent} onChange={(event) => update('visualIntent', event.target.value)} /></label>
          <label>Duration (sec)<input type="number" min={1} value={form.durationSec} onChange={(event) => update('durationSec', Number(event.target.value))} /></label>
          <label>Density
            <select value={form.density} onChange={(event) => update('density', event.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label>Palette<input value={form.palette} onChange={(event) => update('palette', event.target.value)} /></label>
          <label>Gesture vocabulary (comma-separated)<textarea value={form.gestures} onChange={(event) => update('gestures', event.target.value)} /></label>
          <label>Constraints<textarea value={form.constraints} onChange={(event) => update('constraints', event.target.value)} /></label>
        </section>

        <section className="graphic-notation-card">
          <h3>Derived Spec</h3>
          <pre>{JSON.stringify(spec || {}, null, 2)}</pre>
        </section>

        <section className="graphic-notation-card">
          <h3>Master Prompt</h3>
          <textarea value={masterPrompt || ''} readOnly />
        </section>

        <section className="graphic-notation-card">
          <h3>Plate Prompts</h3>
          {platePrompts.length === 0 ? <p>No plate prompts yet.</p> : null}
          <div className="graphic-notation-plates">
            {platePrompts.map((plate) => (
              <article key={plate.id} className="graphic-notation-plate">
                <h4>{plate.label}</h4>
                <textarea value={plate.prompt || ''} readOnly />
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
