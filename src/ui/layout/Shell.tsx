import { useOracleStore } from '../../state/store';
import { Tabs } from './Tabs';
import { ModulesPanel } from '../panels/ModulesPanel';
import { LivePromptPanel } from '../panels/LivePromptPanel';
import { FrameSeriesPanel } from '../panels/FrameSeriesPanel';
import { PresetsPanel } from '../panels/PresetsPanel';
import { PromptManagerPanel } from '../panels/PromptManagerPanel';
import { Wizard, wizardSteps } from '../wizard/Wizard';

export function Shell() {
  const tab = useOracleStore((s) => s.tab);
  const step = useOracleStore((s) => s.currentStep);
  const setStep = useOracleStore((s) => s.setStep);
  const batchId = useOracleStore((s) => s.batchId);
  const seedString = useOracleStore((s) => s.seedString);
  const newRun = useOracleStore((s) => s.newRun);

  return (
    <div className="shell">
      <header>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1>HYPNAGNOSIS ORACLE V3</h1>
            <p>Wizard-first + Prompt Manager (blocks/templates/history/variations).</p>
            <p style={{ marginTop: 6, opacity: 0.8 }}>batch-id: <strong>{batchId}</strong> · seed: <strong>{seedString}</strong></p>
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
      <Tabs />
      <div className="layout">
        <aside className="left" aria-label="Wizard step navigation and modules">
          <ModulesPanel />
          {tab === 'wizard' && (
            <nav className="step-list">
              <h3>WIZARD STEPS</h3>
              {wizardSteps.map((s, i) => (
                <button key={s.name} className={i === step ? 'step active' : 'step'} onClick={() => setStep(i)}>
                  {i + 1}. {s.name.toUpperCase()}
                </button>
              ))}
            </nav>
          )}
        </aside>
        <main className="center" aria-label="Primary work area">
          {tab === 'wizard' && <Wizard />}
          {tab === 'manager' && <PromptManagerPanel />}
          {tab === 'live' && <LivePromptPanel />}
          {tab === 'frames' && <FrameSeriesPanel />}
          {tab === 'presets' && <PresetsPanel />}
        </main>
        <aside className="right" aria-label="Live compiled prompt preview">
          <LivePromptPanel />
        </aside>
      </div>
    </div>
  );
}
