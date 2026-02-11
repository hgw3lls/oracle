export default function AutoEvolvePreview({ series, activeState, setActiveState }) {
  if (!series.length) return null;

  return (
    <article className="preview-wrap">
      <h3>Auto-Evolve Preview</h3>
      <div className="preview-grid">
        {series.map((state, idx) => (
          <button
            key={`preview-${state.batchId}-${idx}`}
            type="button"
            className={idx === activeState ? 'preview-card active' : 'preview-card'}
            onClick={() => setActiveState(idx)}
          >
            <strong>Step {idx + 1}</strong>
            <span>{state.stateName} • H {state.hallucination}</span>
            <span>Diff: {state.diffSummary || 'seeded baseline'}</span>
            <span>Texture: g{state.grain} / lw{state.lineWobble} / e{state.erasure} / a{state.annotation}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
