import { useOracleStore } from '../../../state/store';

export function InfluenceStep() {
  const schema = useOracleStore((s) => s.schema);
  const setValue = useOracleStore((s) => s.set);
  const w = schema.INFLUENCE_ENGINE.weights;

  return (
    <div>
      <label>inkSpray</label>
      <input type="number" value={w.inkSpray} onChange={(e) => setValue('INFLUENCE_ENGINE.weights.inkSpray', Number(e.target.value))} />
      <label>meatBrush</label>
      <input type="number" value={w.meatBrush} onChange={(e) => setValue('INFLUENCE_ENGINE.weights.meatBrush', Number(e.target.value))} />
      <label>collageBreak</label>
      <input type="number" value={w.collageBreak} onChange={(e) => setValue('INFLUENCE_ENGINE.weights.collageBreak', Number(e.target.value))} />
      <label>networkMap</label>
      <input type="number" value={w.networkMap} onChange={(e) => setValue('INFLUENCE_ENGINE.weights.networkMap', Number(e.target.value))} />
      <label>occultDiagram</label>
      <input type="number" value={w.occultDiagram} onChange={(e) => setValue('INFLUENCE_ENGINE.weights.occultDiagram', Number(e.target.value))} />
      <label>graphicNovel</label>
      <input type="number" value={w.graphicNovel} onChange={(e) => setValue('INFLUENCE_ENGINE.weights.graphicNovel', Number(e.target.value))} />
      <label>printMaterial</label>
      <input type="number" value={w.printMaterial} onChange={(e) => setValue('INFLUENCE_ENGINE.weights.printMaterial', Number(e.target.value))} />
      <label>handDrawn</label>
      <input type="number" value={w.handDrawn} onChange={(e) => setValue('INFLUENCE_ENGINE.weights.handDrawn', Number(e.target.value))} />
    </div>
  );
}
