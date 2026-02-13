import { Panel } from '../layout/Panel';
import { useOracleStore } from '../../state/store';

export function ModulesPanel() {
  const modules = useOracleStore((s) => s.schema.MODULES);
  const toggle = useOracleStore((s) => s.toggleModule);

  return (
    <Panel>
      <h3>Modules</h3>
      {Object.entries(modules).map(([k, v]) => (
        <label key={k} className="module-row">
          <input type="checkbox" checked={!v} onChange={() => toggle(k as keyof typeof modules)} /> Disable module: {k}
        </label>
      ))}
    </Panel>
  );
}
