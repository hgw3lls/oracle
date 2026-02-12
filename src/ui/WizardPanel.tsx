import { useEffect, useMemo, useState } from 'react';
import { CURVE_OPTIONS, STYLE_TOKENS } from '../models/schema';
import { compilePromptV2 } from '../engine/compilePromptV2';
import { buildFrameSeries, exportFramePromptSheet, exportTimelineJSON } from '../engine/animationEngine';
import { exportTextFile } from '../export/systemFile';
import { INFLUENCE_PRESETS, applyInfluencePreset, randomizeInfluenceWithinBounds } from '../presets/influencePresets';
import type { SchemaV2 } from '../schema/hypnagnosisSchemaV2';

type WizardPanelProps = {
  form: SchemaV2;
  patch: (key: keyof SchemaV2, value: unknown) => void;
  applyForm: (next: SchemaV2) => void;
  toggleStyleToken: (token: string, checked: boolean) => void;
};

const STEPS = [
  'Intent',
  'State Map',
  'Hallucination Physics',
  'Influence & Materials',
  'Animation',
  'Review & Export',
] as const;

export default function WizardPanel({ form, patch, applyForm, toggleStyleToken }: WizardPanelProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [keyframeText, setKeyframeText] = useState('[]');
  const [animationError, setAnimationError] = useState('');

  useEffect(() => {
    setKeyframeText(JSON.stringify(form.animation.keyframes || [], null, 2));
  }, [form.animation.keyframes]);

  const compiled = useMemo(() => compilePromptV2(form), [form]);
  const frames = useMemo(() => buildFrameSeries(form, compilePromptV2), [form]);

  const onApplyKeyframes = () => {
    try {
      const parsed = JSON.parse(keyframeText);
      if (!Array.isArray(parsed)) {
        setAnimationError('Keyframes JSON must be an array.');
        return;
      }
      patch('animation', {
        ...form.animation,
        keyframes: parsed,
      });
      setAnimationError('');
    } catch (error) {
      setAnimationError(`Unable to parse keyframes JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const onExportTimeline = () => {
    exportTextFile('hypnagnosis-timeline.json', exportTimelineJSON(form));
  };

  const onExportFrameSheet = () => {
    exportTextFile('hypnagnosis-frame-prompt-sheet.txt', exportFramePromptSheet(frames));
  };

  const applySchema = (next: SchemaV2) => {
    applyForm(next);
  };

  const step = STEPS[stepIndex];

  return (
    <section className="panel wizard-panel">
      <h2>Wizard</h2>

      <div className="wizard-layout">
        <aside className="wizard-sidebar">
          {STEPS.map((label, idx) => (
            <button
              key={label}
              type="button"
              className={idx === stepIndex ? 'state-chip active' : 'state-chip'}
              onClick={() => setStepIndex(idx)}
            >
              {idx + 1}. {label}
            </button>
          ))}
        </aside>

        <div className="wizard-step-content">
          <h3>{step}</h3>

          {step === 'Intent' ? (
            <fieldset>
              <legend>Intent</legend>
              <label>
                Subject
                <input value={form.subject} onChange={(e) => patch('subject', e.target.value)} />
              </label>
              <label>
                Notes
                <textarea rows={4} value={form.notes} onChange={(e) => patch('notes', e.target.value)} />
              </label>
              <label>
                Mode
                <select value={form.mode} onChange={(e) => patch('mode', e.target.value)}>
                  <option value="FULL">FULL</option>
                  <option value="STYLE">STYLE</option>
                  <option value="GESTURE">GESTURE</option>
                  <option value="PRINT">PRINT</option>
                  <option value="LIVE">LIVE</option>
                </select>
              </label>
            </fieldset>
          ) : null}

          {step === 'State Map' ? (
            <fieldset>
              <legend>State Map</legend>
              <label>
                State Name
                <input value={form.triptychPanel1State} onChange={(e) => patch('triptychPanel1State', e.target.value)} />
              </label>
              <label>
                Path Preset
                <input value={form.evolvePathPreset} onChange={(e) => patch('evolvePathPreset', e.target.value)} />
              </label>
              <label>
                Seed
                <input value={form.seed} onChange={(e) => patch('seed', e.target.value)} />
              </label>
            </fieldset>
          ) : null}

          {step === 'Hallucination Physics' ? (
            <fieldset>
              <legend>Hallucination Physics</legend>
              <div className="split">
                <label>
                  Start H
                  <input type="number" min="0" max="100" value={form.startH} onChange={(e) => patch('startH', Number(e.target.value))} />
                </label>
                <label>
                  End H
                  <input type="number" min="0" max="100" value={form.endH} onChange={(e) => patch('endH', Number(e.target.value))} />
                </label>
              </div>
              <label>
                Base Hallucination
                <input type="number" min="0" max="100" value={form.hallucination} onChange={(e) => patch('hallucination', Number(e.target.value))} />
              </label>
              <label>
                Curve
                <select value={form.curve} onChange={(e) => patch('curve', e.target.value)}>
                  {CURVE_OPTIONS.map((curve) => <option key={curve} value={curve}>{curve}</option>)}
                </select>
              </label>
            </fieldset>
          ) : null}

          {step === 'Influence & Materials' ? (
            <fieldset>
              <legend>Influence & Materials</legend>
              <div className="button-row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                {INFLUENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="manifest-btn wizard-mini-btn"
                    onClick={() => applySchema(applyInfluencePreset(form, preset))}
                  >
                    {preset.name}
                  </button>
                ))}
                <button
                  type="button"
                  className="manifest-btn wizard-mini-btn"
                  onClick={() => applySchema(randomizeInfluenceWithinBounds(form))}
                >
                  Randomize within bounds
                </button>
              </div>
              <label>
                Influence Weights (derived)
                <input
                  readOnly
                  value={`spray≈${form.hallucination} smear≈${form.mutateStrength} collage≈${form.humanizerLevel} network-map≈${form.humanizerMax} occult≈${Math.round((form.hallucination + form.mutateStrength) / 2)} print≈${form.humanizerMin}`}
                />
              </label>
              {Object.keys(STYLE_TOKENS).map((token) => (
                <label key={token} className="check-row">
                  <input
                    type="checkbox"
                    checked={form.styleTokens.includes(token)}
                    onChange={(e) => toggleStyleToken(token, e.target.checked)}
                  />
                  {token}
                </label>
              ))}
              <label>
                Mutation Strength
                <input type="number" min="0" max="100" value={form.mutateStrength} onChange={(e) => patch('mutateStrength', Number(e.target.value))} />
              </label>
              <label>
                Humanizer Level
                <input type="number" min="0" max="100" value={form.humanizerLevel} onChange={(e) => patch('humanizerLevel', Number(e.target.value))} />
              </label>
            </fieldset>
          ) : null}

          {step === 'Animation' ? (
            <fieldset>
              <legend>Animation</legend>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.animation.enabled}
                  onChange={(e) => patch('animation', { ...form.animation, enabled: e.target.checked })}
                />
                Enable animation
              </label>
              <label>
                Frame Count
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={form.animation.frames}
                  onChange={(e) => patch('animation', { ...form.animation, frames: Number(e.target.value) })}
                />
              </label>
              <label>
                Animation Curve
                <select
                  value={form.animation.curve}
                  onChange={(e) => patch('animation', { ...form.animation, curve: e.target.value })}
                >
                  {CURVE_OPTIONS.map((curve) => <option key={curve} value={curve}>{curve}</option>)}
                </select>
              </label>
              <label>
                Keyframes JSON
                <textarea rows={10} value={keyframeText} onChange={(e) => setKeyframeText(e.target.value)} />
              </label>
              <div className="button-row">
                <button type="button" className="manifest-btn wizard-mini-btn" onClick={onApplyKeyframes}>Apply Keyframes</button>
              </div>
              {animationError ? <p className="copy-status">{animationError}</p> : null}
            </fieldset>
          ) : null}

          {step === 'Review & Export' ? (
            <fieldset>
              <legend>Review</legend>
              <p><strong>Compiled prompt (single):</strong></p>
              <pre>{compiled.compiledPrompt}</pre>
              <h4>Debug Sections</h4>
              <pre>{compiled.debugSections.map((section) => `${section.title}\n${section.text}`).join('\n\n')}</pre>

              {form.animation.enabled ? (
                <>
                  <p><strong>Animation frames:</strong> {frames.length}</p>
                  <div className="button-row">
                    <button type="button" className="manifest-btn wizard-mini-btn" onClick={onExportFrameSheet}>Export frame prompt sheet</button>
                    <button type="button" className="manifest-btn wizard-mini-btn" onClick={onExportTimeline}>Export timeline JSON</button>
                  </div>
                </>
              ) : null}
            </fieldset>
          ) : null}

          <div className="button-row wizard-nav">
            <button type="button" className="tab-btn" onClick={() => setStepIndex((n) => Math.max(0, n - 1))} disabled={stepIndex === 0}>Back</button>
            <button type="button" className="tab-btn" onClick={() => setStepIndex((n) => Math.min(STEPS.length - 1, n + 1))} disabled={stepIndex === STEPS.length - 1}>Next</button>
          </div>
        </div>
      </div>
    </section>
  );
}
