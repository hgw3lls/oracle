import { Panel } from '../layout/Panel';
import { useOracleStore } from '../../state/store';

export function ModulesPanel() {
  const modules = useOracleStore((s) => s.schema.MODULES);
  const toggle = useOracleStore((s) => s.toggleModule);
  const merge = useOracleStore((s) => s.merge);

  const enableMinimalMode = (keepPalette = true) => {
    merge({
      MODULES: {
        INPUT: true,
        STATE_MAP: false,
        HALLUCINATION: false,
        HYPNA_MATRIX: false,
        PROMPT_GENOME: true,
        VISUAL_GRAMMAR: false,
        INFLUENCE_ENGINE: false,
        PALETTE: keepPalette,
        CONSTRAINTS: true,
        ANIMATION: false,
      },
    });
  };

  return (
    <Panel>
      <h3>MODULE TOGGLES</h3>
      {Object.entries(modules).map(([k, v]) => (
        <label key={k} className="module-row">
          <input type="checkbox" checked={v} onChange={() => toggle(k as keyof typeof modules)} /> {k}
        </label>
      ))}
      <div className="module-actions">
        <button type="button" onClick={() => enableMinimalMode(true)}>MINIMAL MODE (WITH PALETTE)</button>
        <button type="button" onClick={() => enableMinimalMode(false)}>MINIMAL MODE (NO PALETTE)</button>
      </div>
    </Panel>
  );
}
