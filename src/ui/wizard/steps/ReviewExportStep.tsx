import { useOracleStore } from '../../../state/store';

export function ReviewExportStep() {
  const resetToDefaults = useOracleStore((s) => s.resetToDefaults);
  return <button onClick={resetToDefaults}>Reset to defaults</button>;
}
