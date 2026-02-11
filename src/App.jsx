import { useEffect, useMemo, useState } from 'react';
import { buildSystemFileDocument, exportTextFile } from './export/systemFile';
import { buildBootloaderDocument } from './export/bootloader';
import { generateBatches } from './engine';
import { generateTriptych } from './engine/generateTriptych';
import { DEFAULT_FORM, parsePreset, serializePreset } from './presets/defaults';
import { PresetSchema, formatPresetIssues } from './presets/schema';
import ControlsPanel from './ui/ControlsPanel';
import StateBrowserPanel from './ui/StateBrowserPanel';
import OutputPanel from './ui/OutputPanel';

const snapshotToState = (snapshot, idx, panelName, stateName) => ({
  mode: 'FULL',
  subject: '',
  notes: '',
  styleTokens: [],
  step: idx,
  steps: 3,
  stateName,
  flow: panelName,
  seed: panelName,
  batchId: panelName,
  linkedFrom: null,
  hallucination: Math.round(snapshot.params.hallucination),
  temporal: Math.round(snapshot.params.temporal),
  material: Math.round(snapshot.params.material),
  space: Math.round(snapshot.params.space),
  symbol: Math.round(snapshot.params.symbol),
  agency: Math.round(snapshot.params.agency),
  saturation: snapshot.params.palette > 65 ? 'dense' : snapshot.params.palette > 40 ? 'balanced' : 'sparse',
  motion: snapshot.params.gesture > 70 ? 'explosive' : snapshot.params.gesture > 45 ? 'kinetic' : 'flowing',
  grain: Math.round(snapshot.params.grain),
  lineWobble: Math.round(snapshot.params['line-wobble']),
  erasure: Math.round(snapshot.params.erasure),
  annotation: Math.round(snapshot.params.annotation),
  paletteValue: Math.round(snapshot.params.palette),
  gestureValue: Math.round(snapshot.params.gesture),
  diffSummary: snapshot.diffSummary,
  mutationNote: panelName,
  prompt: snapshot.compiledPrompt,
});

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [activeState, setActiveState] = useState(0);
  const [selectedIndexes, setSelectedIndexes] = useState([0]);
  const [view, setView] = useState('standard');
  const [presetError, setPresetError] = useState('');

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setActiveState(0);
    setSelectedIndexes([0]);
  };

  const toggleStyleToken = (token, checked) => {
    setForm((prev) => ({
      ...prev,
      styleTokens: checked ? [...prev.styleTokens, token] : prev.styleTokens.filter((item) => item !== token),
    }));
  };

  const manifest = useMemo(() => generateBatches(form), [form]);

  const triptychBundle = useMemo(() => generateTriptych(
    {
      mode: form.mode,
      seed: form.seed,
      subject: form.subject,
      notes: form.notes,
      styleTokens: form.styleTokens,
      vibeRefs: { description: form.notes, images: '' },
      startHallucination: form.startH,
      endHallucination: form.endH,
      mutationStrength: form.mutateStrength,
      curve: form.curve,
      humanizerRange: { min: form.humanizerMin, max: form.humanizerMax },
    },
    {
      panels: [
        {
          panelName: form.triptychPanel1Name,
          stateName: form.triptychPanel1State,
          pathPreset: form.triptychPanel1Path,
          steps: form.triptychPanel1Steps,
          locks: { core: form.lockCore, texture: form.lockTexture },
        },
        {
          panelName: form.triptychPanel2Name,
          stateName: form.triptychPanel2State,
          pathPreset: form.triptychPanel2Path,
          steps: form.triptychPanel2Steps,
          locks: { palette: form.lockPalette },
        },
        {
          panelName: form.triptychPanel3Name,
          stateName: form.triptychPanel3State,
          pathPreset: form.triptychPanel3Path,
          steps: form.triptychPanel3Steps,
          locks: { gesture: form.lockGesture },
        },
      ],
    },
  ), [form]);

  const triptychSeries = useMemo(() => triptychBundle.states.map((snapshot, idx) => {
    const panel = triptychBundle.manifest.panels[idx];
    return snapshotToState(snapshot, idx, panel.panelName, panel.stateName);
  }), [triptychBundle]);

  const series = useMemo(() => {
    if (view === 'triptych') return triptychSeries;
    return manifest.batches[0]?.states || [];
  }, [view, triptychSeries, manifest]);

  const state = series[Math.min(activeState, series.length - 1)] ?? series[0] ?? null;
  const selectedStates = selectedIndexes.map((idx) => series[idx]).filter(Boolean);
  const selectedPrompt = state?.prompt || '';

  useEffect(() => {
    if (!form.autoCopyCompiledPrompt) return;
    if (!selectedPrompt) return;
    navigator.clipboard.writeText(selectedPrompt).catch(() => null);
  }, [selectedPrompt, form.autoCopyCompiledPrompt]);

  const systemDocument = useMemo(
    () => buildSystemFileDocument({ mode: form.mode, selectedPrompt }),
    [form.mode, selectedPrompt],
  );

  const bootloaderDocument = useMemo(
    () => buildBootloaderDocument({ mode: form.mode, selectedPrompt }),
    [form.mode, selectedPrompt],
  );

  const onImportPreset = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const checked = PresetSchema.safeParse(parsed);
      if (!checked.success) {
        setPresetError(`Preset validation failed:\n${formatPresetIssues(checked.error.issues)}`);
        return;
      }
      const merged = parsePreset(text);
      setForm(merged);
      setPresetError('');
      setActiveState(0);
      setSelectedIndexes([0]);
    } catch (error) {
      setPresetError(`Unable to import preset JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      event.target.value = '';
    }
  };

  const onSavePreset = () => {
    exportTextFile('hypnagnosis-preset.json', serializePreset(form));
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        HYPNAGNOSIS — WEB v2
        <div className="top-tabs">
          <button type="button" className={view === 'standard' ? 'tab-btn active' : 'tab-btn'} onClick={() => { setView('standard'); setActiveState(0); setSelectedIndexes([0]); }}>Standard</button>
          <button type="button" className={view === 'triptych' ? 'tab-btn active' : 'tab-btn'} onClick={() => { setView('triptych'); setActiveState(0); setSelectedIndexes([0]); }}>Triptych</button>
        </div>
      </header>

      <section className="layout">
        <ControlsPanel
          form={form}
          patch={patch}
          toggleStyleToken={toggleStyleToken}
          view={view}
          onImportPreset={onImportPreset}
          onSavePreset={onSavePreset}
          presetError={presetError}
        />
        <StateBrowserPanel
          series={series}
          activeState={activeState}
          setActiveState={setActiveState}
          selectedIndexes={selectedIndexes}
          setSelectedIndexes={setSelectedIndexes}
        />
        <OutputPanel
          state={state}
          systemDocument={systemDocument}
          bootloaderDocument={bootloaderDocument}
          manifest={view === 'triptych' ? triptychBundle.manifest : manifest}
          triptychMode={view === 'triptych'}
          triptychStates={triptychSeries}
          selectedStates={selectedStates}
        />
      </section>
    </main>
  );
}
