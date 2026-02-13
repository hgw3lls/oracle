import type React from 'react';
import { useOracleStore } from '../../state/store';
import type { ModuleKey } from '../../schema/schemaV2';
import { IntentStep } from './steps/IntentStep';
import { StateStep } from './steps/StateStep';
import { HallucinationStep } from './steps/HallucinationStep';
import { InfluenceStep } from './steps/InfluenceStep';
import { PaletteStep } from './steps/PaletteStep';
import { AnimationStep } from './steps/AnimationStep';
import { ReviewExportStep } from './steps/ReviewExportStep';

const steps: { name: string; moduleKey: ModuleKey; node: React.ReactNode }[] = [
  { name: 'Intent', moduleKey: 'INPUT', node: <IntentStep /> },
  { name: 'State', moduleKey: 'STATE_MAP', node: <StateStep /> },
  { name: 'Hallucination', moduleKey: 'HALLUCINATION', node: <HallucinationStep /> },
  { name: 'Influence', moduleKey: 'INFLUENCE_ENGINE', node: <InfluenceStep /> },
  { name: 'Palette', moduleKey: 'PALETTE', node: <PaletteStep /> },
  { name: 'Animation', moduleKey: 'ANIMATION', node: <AnimationStep /> },
  { name: 'Review / Export', moduleKey: 'PROMPT_GENOME', node: <ReviewExportStep /> },
];

export function Wizard() {
  const currentStep = useOracleStore((s) => s.currentStep);
  const setStep = useOracleStore((s) => s.setStep);
  const modules = useOracleStore((s) => s.schema.MODULES);
  const toggleModule = useOracleStore((s) => s.toggleModule);
  const step = steps[currentStep];
  const disabled = !modules[step.moduleKey];

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>{step.name}</h3>
        <div className="step-actions">
          <button
            type="button"
            onClick={() => setStep(Math.min(currentStep + 1, steps.length - 1))}
            aria-label="Skip step"
          >
            SKIP STEP
          </button>
          <label className="inline-toggle">
            <input type="checkbox" checked={!disabled} onChange={() => toggleModule(step.moduleKey)} />
            MODULE ENABLED
          </label>
        </div>
      </div>
      <fieldset disabled={disabled} className={disabled ? 'step-disabled' : ''}>
        {step.node}
      </fieldset>
    </div>
  );
}

export { steps as wizardSteps };
