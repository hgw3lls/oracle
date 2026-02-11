import { useMemo, useState } from 'react';
import AutoEvolvePreview from './AutoEvolvePreview';
import ChainGraphView from './ChainGraphView';

export default function StateBrowserPanel({
  series,
  activeState,
  setActiveState,
  selectedIndexes = [],
  setSelectedIndexes,
  animation,
  onSelectAnimationFrame,
  animationFrames = [],
  chainResult = null,
  selectedChainNodeId = null,
  onSelectChainNode,
  selectionMode = 'manual',
}) {
  const [browserMode, setBrowserMode] = useState('list');
  const state = series[Math.min(activeState, series.length - 1)] ?? series[0];
  if (!state) return null;

  const toggleSelected = (idx, checked) => {
    if (!setSelectedIndexes) return;
    if (checked) setSelectedIndexes(Array.from(new Set([...selectedIndexes, idx])).sort((a, b) => a - b));
    else setSelectedIndexes(selectedIndexes.filter((item) => item !== idx));
  };

  const graphMode = useMemo(() => {
    if (selectionMode === 'chain' && chainResult?.nodes?.length) return 'chain';
    return 'evolution';
  }, [chainResult, selectionMode]);

  const onGraphSelect = (id) => {
    if (graphMode === 'chain') {
      onSelectChainNode?.(id);
      return;
    }

    const idx = animationFrames.findIndex((frame) => frame.id === id);
    if (idx >= 0) {
      onSelectAnimationFrame?.(idx);
      setActiveState(Math.max(0, Math.min(series.length - 1, idx)));
    }
  };

  return (
    <section className="panel states">
      <h2>States</h2>
      <div className="button-row">
        <button type="button" className={browserMode === 'list' ? 'tab-btn active' : 'tab-btn'} onClick={() => setBrowserMode('list')}>List</button>
        <button type="button" className={browserMode === 'graph' ? 'tab-btn active' : 'tab-btn'} onClick={() => setBrowserMode('graph')}>Graph</button>
      </div>

      {browserMode === 'graph' ? (
        <ChainGraphView
          mode={graphMode}
          frames={animationFrames.map((frame, idx) => ({ ...frame, id: frame.id || `frame-${idx}`, meta: { ...(frame.meta || {}), score: frame.meta?.score ?? null } }))}
          chainResult={chainResult}
          selectedId={graphMode === 'chain' ? selectedChainNodeId : animationFrames[animation?.index || 0]?.id}
          onSelect={onGraphSelect}
        />
      ) : (
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
      )}

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
