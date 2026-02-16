import { useMemo, useRef, useState } from 'react';
import {
  buildMasterPrompt,
  buildPlatePrompts,
  buildVariantMatrix,
  collectEnabledModules,
  deriveSpec,
  MODULE_TARGETS,
} from './promptBuilders';
import OutputPanel from '../shared/components/OutputPanel';
import PresetManager from '../shared/components/PresetManager';

const builtInModules = [
  {
    id: 'builtin-time-spine',
    name: 'Time Spine',
    enabled: true,
    builtIn: true,
    strength: 70,
    targets: ['structure', 'variation'],
    tokens: ['macro-timeline anchors', 'measured event spacing'],
    rules: ['maintain readable temporal path'],
  },
  {
    id: 'builtin-silence',
    name: 'Silence',
    enabled: true,
    builtIn: true,
    strength: 45,
    targets: ['hypna', 'structure'],
    tokens: ['void fields', 'rest glyph clusters'],
    rules: ['allow negative space to carry rhythm'],
  },
  {
    id: 'builtin-experimental-variation',
    name: 'Experimental Variation',
    enabled: true,
    builtIn: true,
    strength: 65,
    targets: ['variation', 'hypna'],
    tokens: ['asymmetric phrase mutation', 'probability branches'],
    rules: ['avoid literal repetition across variants'],
  },
  {
    id: 'builtin-impossible-geometry',
    name: 'Impossible Geometry',
    enabled: false,
    builtIn: true,
    strength: 55,
    targets: ['impossible', 'variation'],
    tokens: ['non-euclidean axes', 'contradictory perspective rails'],
    rules: ['keep impossible cues interpretable by performers'],
  },
  {
    id: 'builtin-handdrawn-humanizer',
    name: 'Handdrawn Humanizer',
    enabled: true,
    builtIn: true,
    strength: 80,
    targets: ['humanizer', 'hypna'],
    tokens: ['wobble lines', 'pressure drift', 'ink bleed'],
    rules: ['never output sterile vector-perfect marks'],
  },
];

const defaultState = {
  title: 'Signal Cartography No. 1',
  ensemble: 'string trio + live electronics',
  visualIntent: 'high-contrast notation map with temporal anchors and gestural zones',
  durationSec: 180,
  density: 'medium',
  palette: 'black, graphite, and one accent red',
  gestures: 'arc glissando, percussive scratch, held noise cloud',
  constraints: 'avoid conventional staff notation; preserve clear reading path',
  modules: builtInModules,
};

const emptyCustomModule = {
  name: '',
  enabled: true,
  strength: 50,
  targets: ['variation'],
  tokens: '',
  rules: '',
};

export default function GraphicNotationApp() {
  const [form, setForm] = useState(defaultState);
  const [newModule, setNewModule] = useState(emptyCustomModule);
  const customIdRef = useRef(1);

  const spec = useMemo(() => deriveSpec(form), [form]);
  const enabledModules = useMemo(() => collectEnabledModules(form.modules), [form.modules]);
  const masterPrompt = useMemo(() => buildMasterPrompt(spec, form.modules), [spec, form.modules]);
  const platePrompts = useMemo(() => buildPlatePrompts(spec, form.modules), [spec, form.modules]);
  const variantMatrix = useMemo(() => buildVariantMatrix(spec, form.modules), [spec, form.modules]);

  const plateTextOutput = useMemo(
    () => platePrompts.map((plate) => `=== ${plate.label} ===\n${plate.prompt || ''}`).join('\n\n'),
    [platePrompts],
  );

  const variantTextOutput = useMemo(
    () => variantMatrix.map((variant) => `=== ${variant.label} ===\n${variant.prompt || ''}`).join('\n\n'),
    [variantMatrix],
  );

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateModule = (moduleId, updater) => {
    setForm((prev) => ({
      ...prev,
      modules: (prev.modules || []).map((module) => (module.id === moduleId ? updater(module) : module)),
    }));
  };

  const toggleTarget = (targets, target, checked) => {
    const current = Array.isArray(targets) ? targets : [];
    if (checked) return Array.from(new Set([...current, target]));
    return current.filter((item) => item !== target);
  };

  const addCustomModule = () => {
    const name = newModule.name.trim();
    if (!name) return;

    const customModule = {
      id: `custom-module-${customIdRef.current}`,
      builtIn: false,
      name,
      enabled: Boolean(newModule.enabled),
      strength: Number.isFinite(Number(newModule.strength)) ? Number(newModule.strength) : 50,
      targets: Array.isArray(newModule.targets) ? newModule.targets : ['variation'],
      tokens: String(newModule.tokens || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      rules: String(newModule.rules || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    };

    customIdRef.current += 1;

    setForm((prev) => ({
      ...prev,
      modules: [...(prev.modules || []), customModule],
    }));

    setNewModule(emptyCustomModule);
  };

  const deleteCustomModule = (moduleId) => {
    setForm((prev) => ({
      ...prev,
      modules: (prev.modules || []).filter((module) => module.id !== moduleId),
    }));
  };

  const loadGraphicPreset = (params) => {
    if (!params || typeof params !== 'object') return;
    setForm((prev) => ({
      ...prev,
      ...params,
      modules: Array.isArray(params.modules) ? params.modules : prev.modules,
    }));
  };

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
          <h3>Modules</h3>
          <p>Enabled modules inject prompt blocks and mutate variant matrix output.</p>
          <div className="graphic-module-list">
            {(form.modules || []).map((module) => (
              <article key={module.id} className="graphic-module-item">
                <div className="graphic-module-header">
                  <strong>{module.name}</strong>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(module.enabled)}
                      onChange={(event) => updateModule(module.id, (current) => ({ ...current, enabled: event.target.checked }))}
                    /> Enabled
                  </label>
                </div>
                <label>Strength
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={module.strength ?? 50}
                    onChange={(event) => updateModule(module.id, (current) => ({ ...current, strength: Number(event.target.value) }))}
                  />
                </label>
                <div className="graphic-module-targets">
                  {MODULE_TARGETS.map((target) => (
                    <label key={`${module.id}-${target}`}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(module.targets) && module.targets.includes(target)}
                        onChange={(event) => updateModule(module.id, (current) => ({
                          ...current,
                          targets: toggleTarget(current.targets, target, event.target.checked),
                        }))}
                      />
                      {target}
                    </label>
                  ))}
                </div>
                <label>Tokens (lines)
                  <textarea
                    value={Array.isArray(module.tokens) ? module.tokens.join('\n') : String(module.tokens || '')}
                    onChange={(event) => updateModule(module.id, (current) => ({ ...current, tokens: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean) }))}
                  />
                </label>
                <label>Rules (lines)
                  <textarea
                    value={Array.isArray(module.rules) ? module.rules.join('\n') : String(module.rules || '')}
                    onChange={(event) => updateModule(module.id, (current) => ({ ...current, rules: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean) }))}
                  />
                </label>
                {!module.builtIn ? (
                  <button type="button" onClick={() => deleteCustomModule(module.id)}>Delete Custom Module</button>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="graphic-notation-card">
          <h3>Add Custom Module</h3>
          <label>Name<input value={newModule.name} onChange={(event) => setNewModule((prev) => ({ ...prev, name: event.target.value }))} /></label>
          <label>
            <input
              type="checkbox"
              checked={Boolean(newModule.enabled)}
              onChange={(event) => setNewModule((prev) => ({ ...prev, enabled: event.target.checked }))}
            /> Enabled
          </label>
          <label>Strength
            <input
              type="number"
              min={0}
              max={100}
              value={newModule.strength}
              onChange={(event) => setNewModule((prev) => ({ ...prev, strength: Number(event.target.value) }))}
            />
          </label>
          <div className="graphic-module-targets">
            {MODULE_TARGETS.map((target) => (
              <label key={`new-${target}`}>
                <input
                  type="checkbox"
                  checked={newModule.targets.includes(target)}
                  onChange={(event) => setNewModule((prev) => ({
                    ...prev,
                    targets: toggleTarget(prev.targets, target, event.target.checked),
                  }))}
                />
                {target}
              </label>
            ))}
          </div>
          <label>Tokens (lines)
            <textarea value={newModule.tokens} onChange={(event) => setNewModule((prev) => ({ ...prev, tokens: event.target.value }))} />
          </label>
          <label>Rules (lines)
            <textarea value={newModule.rules} onChange={(event) => setNewModule((prev) => ({ ...prev, rules: event.target.value }))} />
          </label>
          <button type="button" onClick={addCustomModule} disabled={!newModule.name.trim()}>Add Custom Module</button>
        </section>

        <section className="graphic-notation-card">
          <PresetManager
            title="Graphic Notation Preset Packs"
            storageKey="graphic:preset_packs"
            getCurrentParams={() => form}
            onLoadPreset={loadGraphicPreset}
          />
        </section>

        <section className="graphic-notation-card">
          <h3>Derived Spec</h3>
          <pre>{JSON.stringify({ ...spec, enabledModules }, null, 2)}</pre>
        </section>

        <section className="graphic-notation-card">
          <OutputPanel title="Master Prompt" textOutput={masterPrompt || ''} jsonOutput={{ spec, enabledModules }} />
        </section>

        <section className="graphic-notation-card">
          <OutputPanel title="Variant Matrix" textOutput={variantTextOutput || ''} jsonOutput={variantMatrix} />
        </section>

        <section className="graphic-notation-card">
          <OutputPanel title="Plate Prompts" textOutput={plateTextOutput || ''} jsonOutput={platePrompts} />
        </section>
      </main>
    </div>
  );
}
