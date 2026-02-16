import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildImagePromptFrame,
  buildMasterPrompt,
  buildPlatePrompts,
  buildVariantMatrix,
  collectEnabledModules,
  deriveSpec,
  MODULE_TARGETS,
} from './promptBuilders';
import OutputPanel from '../shared/components/OutputPanel';
import PresetManager from '../shared/components/PresetManager';

const GRAPHIC_STATE_STORAGE_KEY = 'graphic:mode_state';

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

const densityDescriptions = {
  low: 'Sparse symbols with lots of breathing room; useful for slower, meditative readings.',
  medium: 'Balanced amount of information; default choice for most performable score maps.',
  high: 'Dense symbol clusters and rapid event changes; best for complex, high-energy passages.',
};

const moduleTargetDescriptions = {
  hypna: 'Pushes texture, visual atmosphere, and dreamlike character.',
  structure: 'Shapes timing path, hierarchy, and overall readability of the score.',
  variation: 'Creates non-repetitive mutations across variants and plate prompts.',
  impossible: 'Adds paradoxical geometry/space cues while keeping performance feasible.',
  humanizer: 'Introduces hand-made imperfections so output avoids sterile vector precision.',
};

const strengthLabel = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 30) return 'subtle';
  if (numericValue <= 70) return 'balanced';
  return 'dominant';
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const loadGraphicModeState = () => {
  if (!canUseStorage()) return defaultState;
  const raw = window.localStorage.getItem(GRAPHIC_STATE_STORAGE_KEY);
  if (!raw) return defaultState;
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== 'object') return defaultState;

  return {
    ...defaultState,
    ...parsed,
    modules: Array.isArray(parsed.modules) ? parsed.modules : defaultState.modules,
  };
};

const toSheetText = (items) => items.map((item) => `=== ${item.label} ===\n${item.prompt || ''}`).join('\n\n');

function buildGraphicOutputs(form) {
  const spec = deriveSpec(form);
  const enabledModules = collectEnabledModules(form.modules);
  const masterPrompt = buildMasterPrompt(spec, form.modules);
  const imagePromptFrame = buildImagePromptFrame(spec, form.modules);
  const platePrompts = buildPlatePrompts(spec, form.modules);
  const variantMatrix = buildVariantMatrix(spec, form.modules);

  return {
    spec,
    enabledModules,
    masterPrompt,
    imagePromptFrame,
    platePrompts,
    variantMatrix,
    plateTextOutput: toSheetText(platePrompts),
    variantTextOutput: toSheetText(variantMatrix),
  };
}

export default function GraphicNotationApp() {
  const [form, setForm] = useState(() => loadGraphicModeState());
  const [newModule, setNewModule] = useState(emptyCustomModule);
  const [status, setStatus] = useState('Ready. Generate graphic prompts.');
  const [outputs, setOutputs] = useState(() => buildGraphicOutputs(loadGraphicModeState()));
  const customIdRef = useRef(1);

  useEffect(() => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(GRAPHIC_STATE_STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const spec = useMemo(() => deriveSpec(form), [form]);
  const enabledModules = useMemo(() => collectEnabledModules(form.modules), [form.modules]);
  const masterPrompt = useMemo(() => buildMasterPrompt(spec, form.modules), [spec, form.modules]);
  const imagePromptFrame = useMemo(() => buildImagePromptFrame(spec, form.modules), [spec, form.modules]);
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

  const generateGraphicPrompts = () => {
    const next = buildGraphicOutputs(form);
    setOutputs(next);
    setStatus(`Generated graphic prompts (${next.platePrompts.length} plates / ${next.variantMatrix.length} variants).`);
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
    setStatus(`Added custom module: ${name}. Regenerate to include it in outputs.`);
  };

  const deleteCustomModule = (moduleId) => {
    setForm((prev) => ({
      ...prev,
      modules: (prev.modules || []).filter((module) => module.id !== moduleId),
    }));
    setStatus('Removed custom module. Regenerate to refresh outputs.');
  };

  const loadGraphicPreset = (params) => {
    if (!params || typeof params !== 'object') return;
    setForm((prev) => ({
      ...prev,
      ...params,
      modules: Array.isArray(params.modules) ? params.modules : prev.modules,
    }));
    setStatus('Graphic preset loaded. Generate to refresh outputs.');
  };

  const resetGraphicModeState = () => {
    if (canUseStorage()) window.localStorage.removeItem(GRAPHIC_STATE_STORAGE_KEY);
    setForm(defaultState);
    setNewModule(emptyCustomModule);
    const resetOutputs = buildGraphicOutputs(defaultState);
    setOutputs(resetOutputs);
    setStatus('Graphic notation state reset to defaults.');
  };

  const derivedJson = useMemo(
    () => ({ ...outputs.spec, enabledModules: outputs.enabledModules }),
    [outputs.spec, outputs.enabledModules],
  );

  return (
    <div className="graphic-notation-app">
      <header className="graphic-notation-header">
        <h2>Graphic Notation PromptGen</h2>
        <p>Dedicated generator for performable visual score image prompts (independent from Oracle mode).</p>
        <div className="actions">
          <button type="button" onClick={generateGraphicPrompts}>Generate Graphic Prompts</button>
          <button type="button" onClick={resetGraphicModeState}>Reset mode state</button>
        </div>
        <p>{status}</p>
      </header>

      <main className="graphic-notation-grid">
        <section className="graphic-notation-card">
          <h3>Specification</h3>
          <p className="graphic-help-text">Fill these core fields first, then tune module controls below. Prompts are rebuilt when you click <strong>Generate Graphic Prompts</strong>.</p>
          <label>Title<input value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
          <label>Ensemble<input value={form.ensemble} onChange={(event) => update('ensemble', event.target.value)} placeholder="e.g., prepared piano + electronics" /></label>
          <label>Visual intent<textarea value={form.visualIntent} onChange={(event) => update('visualIntent', event.target.value)} placeholder="Describe the look/feel performers should read from the page." /></label>
          <label>Duration (sec)<input type="number" min={1} value={form.durationSec} onChange={(event) => update('durationSec', Number(event.target.value))} /></label>
          <label>Density
            <select value={form.density} onChange={(event) => update('density', event.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <p className="graphic-help-text">Density behavior: {densityDescriptions[form.density] || densityDescriptions.medium}</p>
          <label>Palette<input value={form.palette} onChange={(event) => update('palette', event.target.value)} placeholder="e.g., black ink, graphite, muted cyan accents" /></label>
          <label>Gesture vocabulary (comma-separated)<textarea value={form.gestures} onChange={(event) => update('gestures', event.target.value)} placeholder="e.g., arc glissando, impact burst, held noise cloud" /></label>
          <label>Constraints<textarea value={form.constraints} onChange={(event) => update('constraints', event.target.value)} placeholder="What should be avoided in the generated graphic score?" /></label>
        </section>

        <section className="graphic-notation-card">
          <h3>Modules</h3>
          <p>Enable/disable module influence for this mode only. Changes apply after Generate.</p>
          <div className="graphic-parameter-guide">
            <h4>How module parameters work</h4>
            <ul>
              <li><strong>Strength (0-100):</strong> how strongly a module pushes prompt language.</li>
              <li><strong>Targets:</strong> where that influence is applied in generated outputs.</li>
              <li><strong>Tokens:</strong> descriptive vocabulary injected into prompt content.</li>
              <li><strong>Rules:</strong> behavioral constraints/instructions added to the prompt spine.</li>
            </ul>
          </div>
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
                    type="range"
                    min={0}
                    max={100}
                    value={module.strength ?? 50}
                    onChange={(event) => updateModule(module.id, (current) => ({ ...current, strength: Number(event.target.value) }))}
                  />
                </label>
                <p className="graphic-help-text">Current strength: <strong>{module.strength ?? 50}</strong> ({strengthLabel(module.strength)} influence)</p>
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
                <ul className="graphic-target-help-list">
                  {(Array.isArray(module.targets) ? module.targets : []).map((target) => (
                    <li key={`${module.id}-hint-${target}`}><strong>{target}:</strong> {moduleTargetDescriptions[target]}</li>
                  ))}
                </ul>
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
          <p className="graphic-help-text">Create reusable influences for specific score behaviors. Add one token/rule per line for cleaner prompt output.</p>
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
              type="range"
              min={0}
              max={100}
              value={newModule.strength}
              onChange={(event) => setNewModule((prev) => ({ ...prev, strength: Number(event.target.value) }))}
            />
          </label>
          <p className="graphic-help-text">New module strength: <strong>{newModule.strength}</strong> ({strengthLabel(newModule.strength)} influence)</p>
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
          <pre>{JSON.stringify(derivedJson, null, 2)}</pre>
        </section>

        <section className="graphic-notation-card">
          <OutputPanel title="Master Prompt" textOutput={outputs.masterPrompt || ''} jsonOutput={derivedJson} />
        </section>

        <section className="graphic-notation-card">
          <OutputPanel title="Image Prompt Frame" textOutput={imagePromptFrame || ''} jsonOutput={{ spec, enabledModules }} />
        </section>

        <section className="graphic-notation-card">
          <OutputPanel title="Variant Matrix" textOutput={variantTextOutput || ''} jsonOutput={variantMatrix} />
        </section>

        <section className="graphic-notation-card">
          <OutputPanel title="Plate Prompts" textOutput={outputs.plateTextOutput || ''} jsonOutput={outputs.platePrompts} />
        </section>
      </main>
    </div>
  );
}
