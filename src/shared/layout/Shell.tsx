import { useOracleStore } from '@/core/state/store';
import { PromptManagerPanel } from '@/features/manager/PromptManagerPanel';

export function Shell() {
  const batchId = useOracleStore((s) => s.batchId);
  const seedString = useOracleStore((s) => s.seedString);
  const newRun = useOracleStore((s) => s.newRun);

  return (
    <div className="shell">
      <header>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1>HYPNAGNOSIS ORACLE</h1>
            <p>Manager-first prompt system (blocks · templates · history · live · frames).</p>
            <p style={{ marginTop: 6, opacity: 0.8 }}>
              batch-id: <strong>{batchId}</strong> · seed: <strong>{seedString}</strong>
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                const ok = confirm('Start a new run? This will reset all settings to defaults.');
                if (ok) newRun();
              }}
            >
              New Run
            </button>
          </div>
        </div>
      </header>

      <div className="layout layout--single">
        <main className="center" aria-label="Primary work area">
          <PromptManagerPanel />
        </main>
      </div>
    </div>
  );
}
