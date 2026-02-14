import { useMemo, useState } from 'react';
import { Panel } from '@/shared/layout/Panel';
import { useOracleStore } from '@/core/state/store';
import { buildFrameSeries, exportFramePromptSheet, exportTimelineJson } from '@/core/engine/animation/animationEngine';


export function FrameSeriesPanel() {
  const schema = useOracleStore((s) => s.schema);
  const series = useMemo(() => buildFrameSeries(schema), [schema]);
  const [scrubIndex, setScrubIndex] = useState(0);

  if (series.status === 'animation_disabled') {
    return (
      <Panel>
        <h3>Frame Series</h3>
        <p>Animation module is disabled.</p>
      </Panel>
    );
  }

  const current = series.frames[Math.min(scrubIndex, Math.max(0, series.frames.length - 1))];

  return (
    <Panel>
      <h3>Frame Series</h3>
      <label>Scrubber</label>
      <input
        type="range"
        min={0}
        max={Math.max(0, series.frames.length - 1)}
        value={Math.min(scrubIndex, Math.max(0, series.frames.length - 1))}
        onChange={(e) => setScrubIndex(Number(e.target.value))}
      />
      {current && <p>Frame {current.frameIndex} @ t={current.t.toFixed(3)}</p>}

      <button type="button" onClick={() => downloadText('timeline.json', exportTimelineJson(series))}>Export timeline JSON</button>
      <button type="button" onClick={() => downloadText('frame_prompts.txt', exportFramePromptSheet(series))}>Export frame prompt sheet (.txt)</button>

      <details>
        <summary>Frame prompts ({series.frames.length})</summary>
        <ul>
          {series.frames.map((frame) => (
            <li key={`${frame.frameIndex}-${frame.t}`}>
              <strong>Frame {frame.frameIndex}</strong>
              <pre>{frame.compiledPrompt}</pre>
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}
