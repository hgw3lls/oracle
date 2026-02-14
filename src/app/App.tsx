import { useEffect } from 'react';
import { Shell } from '@/shared/layout/Shell';
import { useOracleStore } from '@/core/state/store';
import { clearState, loadState, saveState, STORAGE_VERSION, type StoredStateV1 } from '@/core/state/persistence';
import { migrateToV2 } from '@/core/schema/migrate';
import { isSchemaV2 } from '@/core/schema/validate';

export default function App() {
  const schema = useOracleStore((s) => s.schema);
  const importSchema = useOracleStore((s) => s.importSchema);
  const resetToDefaults = useOracleStore((s) => s.resetToDefaults);

  useEffect(() => {
    const loaded = loadState();
    if (!loaded) return;

    // Accept either the new wrapped payload or legacy raw-schema storage.
    const maybeWrapped = loaded as Partial<StoredStateV1>;
    const storageVersion = typeof maybeWrapped.storageVersion === 'number' ? maybeWrapped.storageVersion : null;
    const payload = storageVersion ? maybeWrapped.schema : loaded;

    try {
      const migrated = migrateToV2(payload);

      if (!isSchemaV2(migrated)) {
        clearState();
        resetToDefaults();
        return;
      }

      importSchema(migrated);

      // If wrapper is missing or outdated, re-save immediately with current stamp.
      if (storageVersion === null || storageVersion !== STORAGE_VERSION) {
        saveState(migrated);
      }
    } catch {
      clearState();
      resetToDefaults();
    }
  }, [importSchema, resetToDefaults]);

  useEffect(() => {
    saveState(schema);
  }, [schema]);

  return <Shell />;
}
