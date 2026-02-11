import { useMemo, useRef, useState } from 'react';
import { copyTextToClipboard, exportTextFile } from '../export/systemFile';
import PlateSeparationCanvas from './PlateSeparationCanvas';
import { exportChainManifest, exportEvolutionManifest } from '../export/manifestExport';

const exportManifest = (manifest) => {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'triptych-manifest.json';
  anchor.click();
  URL.revokeObjectURL(url);
};

const exportBatchSnapshots = ({ selectedStates, seed }) => {
  const payload = {
    appVersion: 'web-v2',
    createdAt: new Date().toISOString(),
    seed,
    states: selectedStates.map((state, idx) => ({
      id: `${state.batchId || 'state'}-${idx + 1}`,
      name: state.stateName,
      params: {
        hallucination: state.hallucination,
        temporal: state.temporal,
        material: state.material,
        space: state.space,
        symbol: state.symbol,
        agency: state.agency,
        grain: state.grain,
        lineWobble: state.lineWobble,
        erasure: state.erasure,
        annotation: state.annotation,
        palette: state.paletteValue,
        gesture: state.gestureValue,
      },
      compiledPrompt: state.prompt,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'hypnagnosis-batch-snapshots.json';
  anchor.click();
  URL.revokeObjectURL(url);
};

const OUTPUT_TABS = {
  prompt: 'Prompt',
  parameters: 'Parameters',
  plates: 'Plates',
};

export default function OutputPanel({
  state,
  systemDocument,
  bootloaderDocument,
  manifest,
  triptychMode = false,
  triptychStates = [],
  selectedStates = [],
  animationFrame = null,
  chainResult = null,
  onUseBestChainState,
}) {
  const [copyStatus, setCopyStatus] = useState('');
  const [activeTab, setActiveTab] = useState('prompt');
  const [showSystemTools, setShowSystemTools] = useState(false);
  const systemToolsRef = useRef(null);

  const [plateMode, setPlateMode] = useState('composite');

  const plateState = useMemo(() => {
    if (animationFrame?.state) {
      const params = animationFrame.state;
      return {
        ...state,
        hallucination: Math.round(params.hallucination ?? state?.hallucination ?? 50),
        temporal: Math.round(params.temporal ?? state?.temporal ?? 55),
        material: Math.round(params.material ?? state?.material ?? 55),
        space: Math.round(params.space ?? state?.space ?? 55),
        symbol: Math.round(params.symbol ?? state?.symbol ?? 55),
        agency: Math.round(params.agency ?? state?.agency ?? 55),
        grain: Math.round(params.grain ?? state?.grain ?? 40),
        lineWobble: Math.round(params['line-wobble'] ?? params.lineWobble ?? state?.lineWobble ?? 40),
        erasure: Math.round(params.erasure ?? state?.erasure ?? 30),
        annotation: Math.round(params.annotation ?? state?.annotation ?? 42),
        paletteValue: Math.round(params.palette ?? params.paletteValue ?? state?.paletteValue ?? 50),
        gestureValue: Math.round(params.gesture ?? params.gestureValue ?? state?.gestureValue ?? 50),
      };
    }

    return state;
  }, [state, animationFrame]);

  const plateSeed = animationFrame?.seed || state?.seed || manifest?.seed || 'oracle-plates';

  const parameterSnapshot = useMemo(() => {
    if (!state) return { currentState: null, manifest };

    return {
      currentState: {
        stateName: state.stateName,
        batchId: state.batchId,
        seed: state.seed,
        flow: state.flow,
        params: {
          hallucination: state.hallucination,
          temporal: state.temporal,
          material: state.material,
          space: state.space,
          symbol: state.symbol,
          agency: state.agency,
          grain: state.grain,
          lineWobble: state.lineWobble,
          erasure: state.erasure,
          annotation: state.annotation,
          palette: state.paletteValue,
          gesture: state.gestureValue,
        },
        textureProfile: state.saturation,
        motionProfile: state.motion,
        mutationNote: state.mutationNote,
      },
      manifest,
    };
  }, [state, manifest]);

  const exportPromptBundle = () => {
    if (triptychMode) {
      const payload = triptychStates.map((item) => ({
        stateName: item.stateName,
        prompt: item.prompt,
      }));
      exportTextFile('hypnagnosis-triptych-prompts.json', JSON.stringify(payload, null, 2));
      return;
    }

    exportTextFile('hypnagnosis-prompt.txt', state?.prompt || '');
  };

  const openSystemTools = () => {
    setShowSystemTools(true);
    setTimeout(() => {
      systemToolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const copyDoc = async (docType, content) => {
    if (!content) {
      setCopyStatus(`No ${docType} to copy.`);
      setTimeout(() => setCopyStatus(''), 1800);
      return;
    }

    try {
      await copyTextToClipboard(content);
      setCopyStatus(`${docType} copied.`);
      setTimeout(() => setCopyStatus(''), 1800);
    } catch {
      setCopyStatus(`Unable to copy ${docType}.`);
      setTimeout(() => setCopyStatus(''), 1800);
    }
  };

  return (
    <section className="panel output">
      <div className="output-content">
        {activeTab === 'prompt' ? (
          <div className="tab-content-block">
            {triptychMode ? (
              <>
                <h2>Triptych Compiled Prompts</h2>
                <div className="button-row stack-mobile">
                  <button
                    type="button"
                    className="manifest-btn"
                    onClick={() => copyDoc('Triptych Prompts', triptychStates.map((item) => `${item.stateName}\n${item.prompt}`).join('\n\n---\n\n'))}
                    disabled={!triptychStates.length}
                  >
                    Copy all triptych prompts
                  </button>
                  <button
                    type="button"
                    className="manifest-btn"
                    onClick={exportPromptBundle}
                    disabled={!triptychStates.length}
                  >
                    Save prompts
                  </button>
                  <button
                    type="button"
                    className="manifest-btn"
                    onClick={openSystemTools}
                  >
                    System + bootloader tools
                  </button>
                </div>
                <div className="triptych-prompts">
                  {triptychStates.map((item, idx) => (
                    <article key={`trip-${idx}`} className="triptych-column">
                      <div className="triptych-header">
                        <h3>{item.stateName}</h3>
                        <button type="button" className="manifest-btn inline-copy" onClick={() => copyDoc(`${item.stateName} prompt`, item.prompt)}>Copy</button>
                      </div>
                      <pre>{item.prompt}</pre>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2>Compiled Prompt</h2>
                <div className="button-row stack-mobile">
                  <button type="button" className="manifest-btn" onClick={() => copyDoc('Compiled Prompt', state?.prompt)} disabled={!state?.prompt}>Copy prompt</button>
                  <button type="button" className="manifest-btn" onClick={exportPromptBundle} disabled={!state?.prompt}>Save prompt</button>
                  <button type="button" className="manifest-btn" onClick={openSystemTools}>System + bootloader tools</button>
                  <button
                    type="button"
                    className="manifest-btn"
                    onClick={() => exportEvolutionManifest(selectedStates.length ? selectedStates : (state ? [state] : []), { seed: state?.seed, mode: state?.mode })}
                    disabled={!state}
                  >
                    Export evolution manifest
                  </button>
                </div>
                <pre>{state?.prompt}</pre>
              </>
            )}

            {showSystemTools ? (
              <div className="export-actions" ref={systemToolsRef}>
                <h2>Batch Export (selected snapshots)</h2>
                <button
                  type="button"
                  className="manifest-btn"
                  onClick={() => exportBatchSnapshots({ selectedStates, seed: state?.seed || manifest?.seed || 'n/a' })}
                  disabled={!selectedStates.length}
                >
                  Export selected snapshots .json
                </button>

                {triptychMode ? (
                  <button type="button" className="manifest-btn" onClick={() => exportManifest(manifest)}>Export manifest</button>
                ) : null}

                <h2>System File (paste anytime)</h2>
                <div className="button-row">
                  <button type="button" className="manifest-btn" onClick={() => exportTextFile('hypnagnosis-system-file.txt', systemDocument)}>Export .txt</button>
                  <button type="button" className="manifest-btn" onClick={() => copyDoc('System File', systemDocument)}>Copy to clipboard</button>
                </div>
                <pre>{systemDocument}</pre>

                <h2>Bootloader (run this)</h2>
                <div className="button-row">
                  <button type="button" className="manifest-btn" onClick={() => exportTextFile('hypnagnosis-bootloader.txt', bootloaderDocument)}>Export .txt</button>
                  <button type="button" className="manifest-btn" onClick={() => copyDoc('Bootloader', bootloaderDocument)}>Copy to clipboard</button>
                </div>
                <pre>{bootloaderDocument}</pre>
              </div>
            ) : null}
          </div>
        ) : null}



        {activeTab === 'plates' ? (
          <div className="tab-content-block">
            <h2>Plate Separation</h2>
            <div className="button-row">
              <button type="button" className={plateMode === 'composite' ? 'tab-btn active' : 'tab-btn'} onClick={() => setPlateMode('composite')}>Composite</button>
              <button type="button" className={plateMode === 'separate' ? 'tab-btn active' : 'tab-btn'} onClick={() => setPlateMode('separate')}>Separate</button>
              <button type="button" className={plateMode === 'solo' ? 'tab-btn active' : 'tab-btn'} onClick={() => setPlateMode('solo')}>Solo</button>
            </div>
            <PlateSeparationCanvas
              state={plateState}
              width={620}
              height={360}
              seed={String(plateSeed)}
              showLegend
              plateMode={plateMode}
            />
          </div>
        ) : null}

        {activeTab === 'parameters' ? (
          <div className="tab-content-block">
            <h2>Parameter Snapshot</h2>
            <div className="button-row">
              <button
                type="button"
                className="manifest-btn"
                onClick={() => copyDoc('Parameter Snapshot', JSON.stringify(parameterSnapshot, null, 2))}
              >
                Copy snapshot
              </button>
              <button
                type="button"
                className="manifest-btn"
                onClick={() => exportTextFile('hypnagnosis-parameter-snapshot.json', JSON.stringify(parameterSnapshot, null, 2))}
              >
                Export .json
              </button>
              <button
                type="button"
                className="manifest-btn"
                onClick={() => exportChainManifest(chainResult || { nodes: [], edges: [] }, { seed: state?.seed })}
                disabled={!chainResult?.nodes?.length}
              >
                Export chain manifest
              </button>
              <button
                type="button"
                className="manifest-btn"
                onClick={() => onUseBestChainState?.()}
                disabled={!chainResult?.bestNodeId}
              >
                Use Best as Current State
              </button>
            </div>
            <pre>{JSON.stringify({ parameterSnapshot, chainSummary: chainResult ? { bestNodeId: chainResult.bestNodeId, nodes: chainResult.nodes.length, edges: chainResult.edges.length } : null }, null, 2)}</pre>
          </div>
        ) : null}
      </div>

      <div className="output-tabs output-tabs-bottom">
        {Object.entries(OUTPUT_TABS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {copyStatus ? <p className="copy-status">{copyStatus}</p> : null}
    </section>
  );
}
