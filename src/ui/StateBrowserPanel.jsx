import AutoEvolvePreview from './AutoEvolvePreview';

export default function StateBrowserPanel({ series, activeState, setActiveState, selectedIndexes = [], setSelectedIndexes }) {
  const state = series[Math.min(activeState, series.length - 1)] ?? series[0];
  if (!state) return null;

  const toggleSelected = (idx, checked) => {
    if (!setSelectedIndexes) return;
    if (checked) setSelectedIndexes(Array.from(new Set([...selectedIndexes, idx])).sort((a, b) => a - b));
    else setSelectedIndexes(selectedIndexes.filter((item) => item !== idx));
  };

  return (
    <section className="panel states">
      <h2>States</h2>
      <div className="states-grid">
        {series.map((item, idx) => (
          <div key={`${item.batchId}-${item.stateName}-${idx}`} className="state-row">
            <input type="checkbox" checked={selectedIndexes.includes(idx)} onChange={(e) => toggleSelected(idx, e.target.checked)} />
            <button
              type="button"
              className={idx === activeState ? 'state-chip active' : 'state-chip'}
              onClick={() => setActiveState(idx)}
            >
              {idx + 1}. {item.stateName} ({item.hallucination}) {item.triptychSegment ? `• T${item.triptychSegment}` : ''}
            </button>
          </div>
        ))}
      </div>

      <article className="state-summary">
        <h3>Current state</h3>
        <ul>
          <li>Batch: {state.batchId}</li>
          <li>Seed: {state.seed}</li>
          <li>Flow: {state.flow}</li>
          <li>Temporal: {state.temporal}</li>
          <li>Material: {state.material}</li>
          <li>Space: {state.space}</li>
          <li>Symbol: {state.symbol}</li>
          <li>Agency: {state.agency}</li>
          <li>Saturation: {state.saturation}</li>
          <li>Motion: {state.motion}</li>
          <li>Diff: {state.diffSummary}</li>
          <li>Texture: grain {state.grain}, line-wobble {state.lineWobble}, erasure {state.erasure}, annotation {state.annotation}</li>
          <li>Palette/Gesture: {state.paletteValue} / {state.gestureValue}</li>
          <li>Mutation: {state.mutationNote}</li>
          {state.linkedFrom ? <li>Linked from: {state.linkedFrom}</li> : null}
        </ul>
      </article>

      <AutoEvolvePreview series={series} activeState={activeState} setActiveState={setActiveState} />
    </section>
  );
}
