import { useState } from 'react';
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

  const copyDoc = async (docType, content) => {
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
      {triptychMode ? (
        <>
          <h2>Triptych Compiled Prompts</h2>
          <div className="triptych-prompts">
            {triptychStates.map((item, idx) => (
              <article key={`trip-${idx}`} className="triptych-column">
                <h3>{item.stateName}</h3>
                <pre>{item.prompt}</pre>
              </article>
            ))}
          </div>
          <button type="button" className="manifest-btn" onClick={() => exportManifest(manifest)}>Export manifest</button>
        </>
      ) : (
        <>
          <h2>Compiled Prompt</h2>
          <pre>{state?.prompt}</pre>
        </>
      )}

      <h2>Batch Export (selected snapshots)</h2>
      <button
        type="button"
        className="manifest-btn"
        onClick={() => exportBatchSnapshots({ selectedStates, seed: state?.seed || manifest?.seed || 'n/a' })}
        disabled={!selectedStates.length}
      >
        Export selected snapshots .json
      </button>

      <div className="export-actions">
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

      {copyStatus ? <p className="copy-status">{copyStatus}</p> : null}

      <h2>Manifest Snapshot</h2>
      <pre>{JSON.stringify(manifest, null, 2)}</pre>
    </section>
  );
}
