import { useEffect } from 'react';
import { Shell } from '../ui/layout/Shell';
import { useOracleStore } from '../state/store';
import { loadState, saveState } from '../state/persistence';

export default function App() {
  const schema = useOracleStore((s) => s.schema);
  const importSchema = useOracleStore((s) => s.importSchema);

  useEffect(() => {
    const loaded = loadState();
    if (loaded) importSchema(loaded);
  }, [importSchema]);

  useEffect(() => {
    saveState(schema);
  }, [schema]);

  return <Shell />;
}
