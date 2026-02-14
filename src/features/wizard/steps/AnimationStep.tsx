import { useOracleStore } from '@/core/state/store';
import { ALLOWED_CURVE_PATHS } from '@/core/engine/animation/timeline';

export function AnimationStep() {
  const schema = useOracleStore((s) => s.schema);
  const setValue = useOracleStore((s) => s.set);

  const addKeyframe = () => {
    const next = [...schema.ANIMATION.keyframes, { t: 0.5, curves: { 'HALLUCINATION.drift': 50 }, state: 'new' }];
    setValue('ANIMATION.keyframes', next);
  };

  const addCurve = (keyframeIndex: number, path: string) => {
    const current = schema.ANIMATION.keyframes[keyframeIndex]?.curves?.[path];
    if (current !== undefined) return;
    const value = path.includes('mode') ? 'DESCRIPTIVE' : 50;
    setValue(`ANIMATION.keyframes.${keyframeIndex}.curves.${path}`, value);
  };

  return (
    <div>
      <label>Preset</label>
      <select value={schema.ANIMATION.preset} onChange={(e) => setValue('ANIMATION.preset', e.target.value)}>
        <option value="static">static</option>
        <option value="pulse">pulse</option>
        <option value="drift">drift</option>
      </select>

      <label>fps</label>
      <input type="number" min={1} max={120} value={schema.ANIMATION.fps} onChange={(e) => setValue('ANIMATION.fps', Number(e.target.value))} />

      <label>duration (seconds)</label>
      <input type="number" min={1} max={60} value={schema.ANIMATION.duration} onChange={(e) => setValue('ANIMATION.duration', Number(e.target.value))} />

      <label>export mode</label>
      <select value={schema.ANIMATION.export_mode} onChange={(e) => setValue('ANIMATION.export_mode', e.target.value)}>
        <option value="keyframes_only">keyframes_only</option>
        <option value="all_frames">all_frames</option>
        <option value="every_n">every_n</option>
      </select>

      {schema.ANIMATION.export_mode === 'every_n' && (
        <>
          <label>every_n</label>
          <input type="number" min={1} max={60} value={schema.ANIMATION.every_n} onChange={(e) => setValue('ANIMATION.every_n', Number(e.target.value))} />
        </>
      )}

      <h4>Keyframes</h4>
      <button type="button" onClick={addKeyframe}>Add keyframe</button>

      {schema.ANIMATION.keyframes.map((kf, i) => (
        <div key={`${kf.t}-${i}`} className="panel">
          <label>t: {kf.t.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.01} value={kf.t} onChange={(e) => setValue(`ANIMATION.keyframes.${i}.t`, Number(e.target.value))} />
          <input value={kf.state ?? ''} onChange={(e) => setValue(`ANIMATION.keyframes.${i}.state`, e.target.value)} placeholder="state" />
          <button type="button" onClick={() => setValue('ANIMATION.keyframes', schema.ANIMATION.keyframes.filter((_, idx) => idx !== i))}>Remove keyframe</button>

          <h5>Curves</h5>
          {Object.entries(kf.curves).map(([path, value]) => (
            <label key={path}>
              {path}
              <input
                value={String(value)}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed = Number(raw);
                  setValue(`ANIMATION.keyframes.${i}.curves.${path}`, Number.isNaN(parsed) ? raw : parsed);
                }}
              />
            </label>
          ))}

          <label>Add curve path</label>
          <select onChange={(e) => e.target.value && addCurve(i, e.target.value)} defaultValue="">
            <option value="" disabled>pick path</option>
            {ALLOWED_CURVE_PATHS.map((path) => <option key={path} value={path}>{path}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
