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
      <header><h1>Hypnagnosis Oracle v2</h1></header>
      <Tabs />
      <div className="layout">
        <aside className="left">
          <ModulesPanel />
          {tab === 'wizard' && (
            <nav className="step-list">
              {wizardSteps.map((s, i) => (
                <button key={s.name} className={i === step ? 'step active' : 'step'} onClick={() => setStep(i)}>{s.name}</button>
              ))}
            </nav>
          )}
        </aside>
        <main className="center">
          {tab === 'wizard' && <Wizard />}
          {tab === 'live' && <LivePromptPanel />}
          {tab === 'frames' && <FrameSeriesPanel />}
          {tab === 'presets' && <PresetsPanel />}
        </main>
        <aside className="right">
          <LivePromptPanel />
          <div className="panel"><h3>Debug</h3><p>Schema, timeline, and palette engines are scaffolded stubs.</p></div>
        </aside>
      </div>
    </div>
  );
}
