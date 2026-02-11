import { useMemo, useState } from 'react';
import { copyTextToClipboard, exportTextFile } from '../export/systemFile';

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
  bootloader: 'Bootloader + Exports',
};

export default function OutputPanel({
  state,
  systemDocument,
  bootloaderDocument,
  manifest,
  triptychMode = false,
  triptychStates = [],
  selectedStates = [],
}) {
  const [copyStatus, setCopyStatus] = useState('');
  const [activeTab, setActiveTab] = useState('prompt');

  const parameterSnapshot = useMemo(() => {
    if (!state) {
      return {
        currentState: null,
        manifestSummary: {
          seed: manifest?.seed ?? 'n/a',
          mode: manifest?.mode ?? 'n/a',
          batchCount: manifest?.batches?.length ?? 0,
        },
      };
    }

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
      manifestSummary: {
        seed: manifest?.seed ?? state.seed,
        mode: manifest?.mode ?? state.mode,
        batchCount: manifest?.batches?.length ?? 0,
      },
    };
  }, [state, manifest]);

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
      <h2>Output Workspace</h2>
      <div className="output-tabs" role="tablist" aria-label="Output sections">
        {Object.entries(OUTPUT_TABS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            className={activeTab === key ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

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
              </div>
              <div className="triptych-prompts">
                {triptychStates.map((item, idx) => (
                  <article key={`trip-${idx}`} className="triptych-column">
                    <div className="triptych-header">
                      <h3>{item.stateName}</h3>
                      <button type="button" className="manifest-btn inline-copy" onClick={() => copyDoc(`${item.stateName} prompt`, item.prompt)}>Copy</button>
                    </div>
                    <pre className="compact-pre">{item.prompt}</pre>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>Compiled Prompt</h2>
              <div className="button-row stack-mobile">
                <button type="button" className="manifest-btn" onClick={() => copyDoc('Compiled Prompt', state?.prompt)} disabled={!state?.prompt}>Copy prompt</button>
              </div>
              <pre className="compact-pre">{state?.prompt}</pre>
            </>
          )}
        </div>
      ) : null}

      {activeTab === 'parameters' ? (
        <div className="tab-content-block">
          <h2>Parameters Snapshot</h2>
          <div className="button-row stack-mobile">
            <button type="button" className="manifest-btn" onClick={() => copyDoc('Parameters JSON', JSON.stringify(parameterSnapshot, null, 2))}>Copy parameters JSON</button>
          </div>
          <pre className="compact-pre">{JSON.stringify(parameterSnapshot, null, 2)}</pre>
        </div>
      ) : null}

      {activeTab === 'bootloader' ? (
        <div className="tab-content-block">
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

          <div className="export-actions">
            <h2>System File (paste anytime)</h2>
            <div className="button-row">
              <button type="button" className="manifest-btn" onClick={() => exportTextFile('hypnagnosis-system-file.txt', systemDocument)}>Export .txt</button>
              <button type="button" className="manifest-btn" onClick={() => copyDoc('System File', systemDocument)}>Copy to clipboard</button>
            </div>
            <pre className="compact-pre">{systemDocument}</pre>

            <h2>Bootloader (run this)</h2>
            <div className="button-row">
              <button type="button" className="manifest-btn" onClick={() => exportTextFile('hypnagnosis-bootloader.txt', bootloaderDocument)}>Export .txt</button>
              <button type="button" className="manifest-btn" onClick={() => copyDoc('Bootloader', bootloaderDocument)}>Copy to clipboard</button>
            </div>
            <pre className="compact-pre">{bootloaderDocument}</pre>
          </div>
        </div>
      ) : null}

      {copyStatus ? <p className="copy-status">{copyStatus}</p> : null}
    </section>
  );
}
