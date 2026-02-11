import { useEffect, useMemo, useRef, useState } from 'react';
import { autoColorMap, renderPlatePreview } from './canvas/plateRenderer';

export default function PlateSeparationCanvas({
  state,
  width = 620,
  height = 360,
  seed = 'oracle-plates',
  showLegend = true,
  plateMode = 'composite',
}) {
  const canvasRef = useRef(null);
  const [soloPlate, setSoloPlate] = useState('cyan');

  const plates = useMemo(
    () => autoColorMap(state?.hallucination ?? 50, state?.saturation || 'balanced'),
    [state],
  );

  useEffect(() => {
    if (!plates.some((plate) => plate.key === soloPlate)) {
      setSoloPlate(plates[0]?.key || 'cyan');
    }
  }, [plates, soloPlate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderPlatePreview({
      ctx,
      width,
      height,
      seed,
      state,
      showLegend,
      plateMode,
      soloPlate,
    });
  }, [state, width, height, seed, showLegend, plateMode, soloPlate]);

  if (!state) {
    return <p className="copy-status">No state selected for plate visualization.</p>;
  }

  return (
    <div className="plate-canvas-wrap">
      {plateMode === 'solo' ? (
        <label>
          Solo plate
          <select value={soloPlate} onChange={(e) => setSoloPlate(e.target.value)}>
            {plates.map((plate) => <option key={plate.key} value={plate.key}>{plate.label}</option>)}
          </select>
        </label>
      ) : null}
      <canvas ref={canvasRef} width={width} height={height} className="plate-canvas" />
    </div>
  );
}
