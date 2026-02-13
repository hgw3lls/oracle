import { useOracleStore } from '../../state/store';
import { Tabs } from './Tabs';
import { ModulesPanel } from '../panels/ModulesPanel';
import { LivePromptPanel } from '../panels/LivePromptPanel';
import { FrameSeriesPanel } from '../panels/FrameSeriesPanel';
import { PresetsPanel } from '../panels/PresetsPanel';
import { Wizard, wizardSteps } from '../wizard/Wizard';

export function Shell() {
  const tab = useOracleStore((s) => s.tab);
  const step = useOracleStore((s) => s.currentStep);
  const setStep = useOracleStore((s) => s.setStep);

  return (
    <div className="shell">
      <header>
        <h1>HYPNAGNOSIS ORACLE V2</h1>
        <p>Wizard-first prompt architecture with module-level control.</p>
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
