import { useEffect, useMemo, useState } from 'react';
import { buildSystemFileDocument, exportTextFile } from './export/systemFile';
import { buildBootloaderDocument } from './export/bootloader';
import { generateBatches } from './engine';
import { generateTriptych } from './engine/generateTriptych';
import { generateFramesFromEvolution, generateFramesInterpolated } from './engine/frameEngine';
import { usePlayback } from './hooks/usePlayback';
import { runMultiAgentChain } from './engine/chainEngine';
import { DEFAULT_FORM, parsePreset, serializePreset } from './presets/defaults';
import { parseHH } from './engine/hhMacroParser';
import { applyHHToState } from './engine/applyHH';
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

const EXAMPLE_HH = `HANDRAW-HUMAN
subject: Ash-fall cathedrals
HYPNA-MATRIX
temporal: 66
material: 58
space: 42
symbol: 73
agency: 35
STATE-MAP
flow: drift
COMPOSITION
composition: fracture
tension: 64
AUTO-EVOLVE
enabled: true
steps: 8
curve: s-curve
start-h: 40
end-h: 86
mutation-strength: 52
GESTURE
pressure: 67
VIBE-REFERENCE
description: brittle edges, damp paper memory, annotated margins`;

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [animationFrames, setAnimationFrames] = useState([]);
  const [animationConfig, setAnimationConfig] = useState({
    mode: 'evolution',
    nFrames: 24,
    fps: 12,
    isPlaying: false,
    index: 0,
  });
  const [activeState, setActiveState] = useState(0);
  const [selectedIndexes, setSelectedIndexes] = useState([0]);
  const [view, setView] = useState('standard');
  const [presetError, setPresetError] = useState('');
  const [hhText, setHHText] = useState('');
  const [hhErrors, setHHErrors] = useState([]);
  const [chainConfig, setChainConfig] = useState({ generations: 4, agentsPerGen: 5, keepTop: 2, intensity: 8, seed: 'oracle-chain-seed' });
  const [chainResult, setChainResult] = useState(null);
  const [selectedChainNodeId, setSelectedChainNodeId] = useState(null);
  const [selectionMode, setSelectionMode] = useState('manual');

  const playback = usePlayback({
    length: animationFrames.length,
    initialIndex: animationConfig.index,
    initialFps: animationConfig.fps,
    initialLoop: true,
  });

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setActiveState(0);
    setSelectedIndexes([0]);
    setSelectedChainNodeId(null);
    setSelectionMode('manual');
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

  const baseState = series[Math.min(activeState, series.length - 1)] ?? series[0] ?? null;
  const activeAnimationFrame = animationFrames[Math.max(0, Math.min(animationFrames.length - 1, animationConfig.index))] || null;
  const chainSelectedNode = chainResult?.nodes?.find((node) => node.id === selectedChainNodeId) || null;
  const chainDerivedState = chainSelectedNode ? {
    ...baseState,
    stateName: chainSelectedNode.id,
    flow: 'multi-agent-chain',
    seed: form.seed,
    hallucination: Math.round(chainSelectedNode.state.hallucination),
    temporal: Math.round(chainSelectedNode.state.temporal),
    material: Math.round(chainSelectedNode.state.material),
    space: Math.round(chainSelectedNode.state.space),
    symbol: Math.round(chainSelectedNode.state.symbol),
    agency: Math.round(chainSelectedNode.state.agency),
    grain: Math.round(chainSelectedNode.state.grain),
    lineWobble: Math.round(chainSelectedNode.state['line-wobble']),
    erasure: Math.round(chainSelectedNode.state.erasure),
    annotation: Math.round(chainSelectedNode.state.annotation),
    paletteValue: Math.round(chainSelectedNode.state.palette),
    gestureValue: Math.round(chainSelectedNode.state.gesture),
    prompt: chainSelectedNode.compiledPrompt,
    diffSummary: `chain score ${chainSelectedNode.score.toFixed(3)}`,
  } : null;
  const frameDerivedState = activeAnimationFrame ? {
    ...baseState,
    stateName: `FRAME-${activeAnimationFrame.index + 1}`,
    flow: 'animation-frame',
    seed: activeAnimationFrame.seed,
    hallucination: Math.round(activeAnimationFrame.state.hallucination),
    temporal: Math.round(activeAnimationFrame.state.temporal),
    material: Math.round(activeAnimationFrame.state.material),
    space: Math.round(activeAnimationFrame.state.space),
    symbol: Math.round(activeAnimationFrame.state.symbol),
    agency: Math.round(activeAnimationFrame.state.agency),
    grain: Math.round(activeAnimationFrame.state.grain),
    lineWobble: Math.round(activeAnimationFrame.state['line-wobble']),
    erasure: Math.round(activeAnimationFrame.state.erasure),
    annotation: Math.round(activeAnimationFrame.state.annotation),
    paletteValue: Math.round(activeAnimationFrame.state.palette),
    gestureValue: Math.round(activeAnimationFrame.state.gesture),
    prompt: activeAnimationFrame.compiledPrompt,
    diffSummary: activeAnimationFrame.meta?.diffSummary || 'frame snapshot',
  } : null;

  const state = useMemo(() => {
    if (selectionMode === 'chain' && chainDerivedState) return chainDerivedState;
    if ((selectionMode === 'frame' || animationConfig.isPlaying) && frameDerivedState) return frameDerivedState;
    return baseState;
  }, [selectionMode, chainDerivedState, frameDerivedState, animationConfig.isPlaying, baseState]);

  const viewingIndicator = useMemo(() => {
    if (selectionMode === 'chain' && chainSelectedNode) {
      return `Viewing: Chain gen ${chainSelectedNode.gen} node ${chainSelectedNode.agent}`;
    }
    if ((selectionMode === 'frame' || animationConfig.isPlaying) && activeAnimationFrame) {
      return `Viewing: Frame ${activeAnimationFrame.index + 1}/${animationFrames.length}`;
    }
    return 'Viewing: Manual';
  }, [selectionMode, chainSelectedNode, activeAnimationFrame, animationConfig.isPlaying, animationFrames.length]);

  const selectedStates = selectedIndexes.map((idx) => series[idx]).filter(Boolean);
  const selectedPrompt = state?.prompt || '';
  const effectiveAnimationFrame = (selectionMode === 'frame' || animationConfig.isPlaying) ? activeAnimationFrame : null;

  useEffect(() => {
    if (!form.autoCopyCompiledPrompt) return;
    if (!selectedPrompt) return;
    navigator.clipboard.writeText(selectedPrompt).catch(() => null);
  }, [selectedPrompt, form.autoCopyCompiledPrompt]);

  const buildAnimationFrames = (mode = animationConfig.mode, nFrames = animationConfig.nFrames) => {
    playback.stop();
    const baseState = {
      mode: form.mode,
      subject: form.subject,
      notes: form.notes,
      styleTokens: form.styleTokens,
      seed: form.seed,
      startParams: {
        hallucination: form.startH,
      },
    };

    const settings = {
      evolvePathPreset: form.evolvePathPreset,
      curve: form.curve,
      mutationStrength: form.mutateEnabled ? form.mutateStrength : 0,
      humanizerRange: { min: form.humanizerMin, max: form.humanizerMax },
      startH: form.startH,
      endH: form.endH,
      batchId: 'app-animation',
      jitterAmount: Math.max(0, (form.mutateStrength || 0) / 20),
    };

    const nextFrames = mode === 'interpolated'
      ? generateFramesInterpolated(baseState, settings, nFrames, `${form.seed}::interpolated`)
      : generateFramesFromEvolution(baseState, settings, nFrames, `${form.seed}::evolution`);

    setAnimationFrames(nextFrames);
    setAnimationConfig((prev) => ({
      ...prev,
      mode,
      nFrames,
      index: 0,
      isPlaying: false,
    }));
    setSelectionMode('frame');
  };

  const selectAnimationFrame = (index) => {
    playback.setIndex(index);
    setAnimationConfig((prev) => ({ ...prev, index }));
    setSelectionMode('frame');
    setSelectedChainNodeId(null);
    if (series.length) {
      setActiveState(Math.max(0, Math.min(series.length - 1, index)));
    }
  };

  const setAnimationMode = (mode) => {
    buildAnimationFrames(mode, animationConfig.nFrames);
  };

  const setAnimationFrameCount = (value) => {
    const nextCount = Math.max(1, Math.min(300, Number(value) || 1));
    buildAnimationFrames(animationConfig.mode, nextCount);
  };

  const setAnimationFps = (value) => {
    playback.setFps(value);
  };

  useEffect(() => {
    buildAnimationFrames(animationConfig.mode, animationConfig.nFrames);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.mode,
    form.subject,
    form.notes,
    form.styleTokens,
    form.seed,
    form.startH,
    form.endH,
    form.evolvePathPreset,
    form.curve,
    form.mutateEnabled,
    form.mutateStrength,
    form.humanizerMin,
    form.humanizerMax,
  ]);

  useEffect(() => {
    setAnimationConfig((prev) => ({
      ...prev,
      index: playback.index,
      fps: playback.fps,
      isPlaying: playback.isPlaying,
    }));
    if (playback.isPlaying) setSelectionMode('frame');
    if (series.length) {
      setActiveState(Math.max(0, Math.min(series.length - 1, playback.index)));
    }
  }, [playback.fps, playback.index, playback.isPlaying]);

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

  const onParseApplyHH = () => {
    const parsed = parseHH(hhText);
    setHHErrors(parsed.errors);

    const next = applyHHToState(parsed, form);
    setForm(next);
    setActiveState(0);
    setSelectedIndexes([0]);
    setSelectionMode('manual');
  };

  const onLoadExampleHH = () => {
    setHHText(EXAMPLE_HH);
    setHHErrors([]);
  };

  const onClearHH = () => {
    setHHText('');
    setHHErrors([]);
  };

  const onSelectStateIndex = (idx) => {
    setSelectedChainNodeId(null);
    setSelectionMode('manual');
    setActiveState(idx);
  };

  const onPatchChainConfig = (key, value) => {
    setChainConfig((prev) => ({ ...prev, [key]: value }));
  };

  const onRunChain = () => {
    const start = series[Math.max(0, Math.min(series.length - 1, activeState))] || null;
    const baseState = {
      mode: form.mode,
      subject: form.subject,
      notes: form.notes,
      styleTokens: form.styleTokens,
      seed: form.seed,
      startParams: start ? {
        hallucination: start.hallucination,
        temporal: start.temporal,
        material: start.material,
        space: start.space,
        symbol: start.symbol,
        agency: start.agency,
        grain: start.grain,
        'line-wobble': start.lineWobble,
        erasure: start.erasure,
        annotation: start.annotation,
        palette: start.paletteValue,
        gesture: start.gestureValue,
      } : { hallucination: form.startH },
    };

    const result = runMultiAgentChain(baseState, { targetHallucination: form.endH }, chainConfig);
    setChainResult(result);
    setSelectedChainNodeId(result.bestNodeId);
    setSelectionMode('chain');
  };


  const onSelectChainNode = (id) => {
    setSelectedChainNodeId(id);
    setSelectionMode('chain');
    setActiveState(0);
  };
  const onUseBestChainState = () => {
    if (!chainResult?.bestNodeId) return;
    const bestNode = chainResult.nodes.find((n) => n.id === chainResult.bestNodeId);
    if (!bestNode) return;
    const st = bestNode.state || {};
    setForm((prev) => ({
      ...prev,
      startH: Math.round(st.hallucination ?? prev.startH),
      endH: Math.round(st.hallucination ?? prev.endH),
      mutateStrength: Math.round(st.gesture ?? prev.mutateStrength),
      notes: `${prev.notes || ''}
[CHAIN BEST] ${bestNode.id} score=${bestNode.score?.toFixed?.(3) || bestNode.score}`.trim(),
    }));
    setActiveState(0);
    setSelectedIndexes([0]);
    setSelectionMode('manual');
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        HYPNAGNOSIS — WEB v2
        <div className="top-tabs">
          <button type="button" className={view === 'standard' ? 'tab-btn active' : 'tab-btn'} onClick={() => { setView('standard'); setActiveState(0); setSelectedIndexes([0]); }}>Standard</button>
          <button type="button" className={view === 'triptych' ? 'tab-btn active' : 'tab-btn'} onClick={() => { setView('triptych'); setActiveState(0); setSelectedIndexes([0]); }}>Triptych</button>
        </div>
        <div className="button-row" style={{ marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
          <label>
            Anim mode
            <select value={animationConfig.mode} onChange={(e) => setAnimationMode(e.target.value)}>
              <option value="evolution">evolution</option>
              <option value="interpolated">interpolated</option>
            </select>
          </label>
          <label>
            Frames
            <input
              type="number"
              min="1"
              max="300"
              value={animationConfig.nFrames}
              onChange={(e) => setAnimationFrameCount(e.target.value)}
            />
          </label>
          <label>
            FPS
            <input
              type="number"
              min="1"
              max="120"
              value={animationConfig.fps}
              onChange={(e) => setAnimationFps(e.target.value)}
            />
          </label>
          <button type="button" className="tab-btn" onClick={() => playback.togglePlay()}>
            {animationConfig.isPlaying ? 'Stop' : 'Play'}
          </button>
          <button type="button" className="tab-btn" onClick={() => selectAnimationFrame(animationConfig.index - 1)}>
            Prev
          </button>
          <button type="button" className="tab-btn" onClick={() => selectAnimationFrame(animationConfig.index + 1)}>
            Next
          </button>
          <span style={{ alignSelf: 'end' }}>
            Frame {animationConfig.index + 1}/{animationFrames.length || 1}
          </span>
        </div>
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.85rem', fontWeight: 700 }}>
          {viewingIndicator}
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
          hhText={hhText}
          onHHTextChange={setHHText}
          onParseApplyHH={onParseApplyHH}
          onLoadExampleHH={onLoadExampleHH}
          onClearHH={onClearHH}
          hhErrors={hhErrors}
          chainConfig={chainConfig}
          onPatchChainConfig={onPatchChainConfig}
          onRunChain={onRunChain}
        />
        <StateBrowserPanel
          series={series}
          activeState={activeState}
          setActiveState={onSelectStateIndex}
          selectedIndexes={selectedIndexes}
          setSelectedIndexes={setSelectedIndexes}
          animation={animationConfig}
          onSelectAnimationFrame={selectAnimationFrame}
          animationFrames={animationFrames}
          chainResult={chainResult}
          selectedChainNodeId={selectedChainNodeId}
          onSelectChainNode={onSelectChainNode}
          selectionMode={selectionMode}
        />
        <OutputPanel
          state={state}
          systemDocument={systemDocument}
          bootloaderDocument={bootloaderDocument}
          manifest={view === 'triptych' ? triptychBundle.manifest : manifest}
          triptychMode={view === 'triptych'}
          triptychStates={triptychSeries}
          selectedStates={selectedStates}
          animationFrame={effectiveAnimationFrame}
          chainResult={chainResult}
          onUseBestChainState={onUseBestChainState}
        />
      </section>
    </main>
  );
}
