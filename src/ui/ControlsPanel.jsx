import { CURVE_OPTIONS, EVOLVE_PATH_PRESETS, HUMANIZER_QUALITIES, MODES, STYLE_TOKENS } from '../models/schema';

export default function ControlsPanel({
  form,
  patch,
  toggleStyleToken,
  view,
  onImportPreset,
  onSavePreset,
  presetError,
  hhText,
  onHHTextChange,
  onParseApplyHH,
  onLoadExampleHH,
  onClearHH,
  hhErrors = [],
  chainConfig,
  onPatchChainConfig,
  onRunChain,
}) {
  return (
    <aside className="panel controls">
      <h2>Input</h2>

      <fieldset>
        <legend>Presets</legend>
        <div className="button-row">
          <label className="manifest-btn file-btn">
            Import preset JSON
            <input type="file" accept="application/json" onChange={onImportPreset} style={{ display: 'none' }} />
          </label>
          <button type="button" className="manifest-btn" onClick={onSavePreset}>Save preset JSON</button>
        </div>
        {presetError ? <p className="copy-status">{presetError}</p> : null}
      </fieldset>


      <details>
        <summary><strong>HH Editor</strong></summary>
        <fieldset>
          <legend>HH Macro</legend>
          <label>
            HH blocks
            <textarea
              value={hhText}
              onChange={(e) => onHHTextChange(e.target.value)}
              rows={10}
              placeholder={"HANDRAW-HUMAN\nsubject: Ash-fall cathedrals\nHYPNA-MATRIX\ntemporal: 66"}
            />
          </label>
          <div className="button-row">
            <button type="button" className="manifest-btn" onClick={onParseApplyHH}>Parse + Apply</button>
            <button type="button" className="manifest-btn" onClick={onLoadExampleHH}>Load Example HH</button>
            <button type="button" className="manifest-btn" onClick={onClearHH}>Clear</button>
          </div>
          {hhErrors.length ? (
            <p className="copy-status">{hhErrors.join('\n')}</p>
          ) : null}
        </fieldset>
      </details>

      <label>
        Mode
        <select value={form.mode} onChange={(e) => patch('mode', e.target.value)}>
          {MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
        </select>
      </label>

      <label>
        Subject
        <input value={form.subject} onChange={(e) => patch('subject', e.target.value)} placeholder="Ash-fall cathedrals" />
      </label>

      <label>
        Notes
        <textarea value={form.notes} onChange={(e) => patch('notes', e.target.value)} rows={3} />
      </label>

      <fieldset>
        <legend>Style Tokens</legend>
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
      </fieldset>


      <fieldset>
        <legend>Chain</legend>
        <div className="split">
          <label>
            Generations
            <input type="number" min="1" max="20" value={chainConfig.generations} onChange={(e) => onPatchChainConfig('generations', Number(e.target.value))} />
          </label>
          <label>
            Agents / Gen
            <input type="number" min="1" max="30" value={chainConfig.agentsPerGen} onChange={(e) => onPatchChainConfig('agentsPerGen', Number(e.target.value))} />
          </label>
        </div>
        <div className="split">
          <label>
            Keep Top
            <input type="number" min="1" max="30" value={chainConfig.keepTop} onChange={(e) => onPatchChainConfig('keepTop', Number(e.target.value))} />
          </label>
          <label>
            Intensity
            <input type="number" min="0" max="25" value={chainConfig.intensity} onChange={(e) => onPatchChainConfig('intensity', Number(e.target.value))} />
          </label>
        </div>
        <label>
          Chain Seed
          <input value={chainConfig.seed} onChange={(e) => onPatchChainConfig('seed', e.target.value)} />
        </label>
        <button type="button" className="manifest-btn" onClick={onRunChain}>Run Chain</button>
      </fieldset>

      <fieldset>
        <legend>Auto-Evolve v2</legend>
        <label className="check-row">
          <input type="checkbox" checked={form.evolveEnabled} onChange={(e) => patch('evolveEnabled', e.target.checked)} />
          Enabled
        </label>
        <label>
          Steps
          <input type="number" min="1" max="20" value={form.evolveSteps} onChange={(e) => patch('evolveSteps', Number(e.target.value))} />
        </label>
        <label>
          Path preset
          <select value={form.evolvePathPreset} onChange={(e) => patch('evolvePathPreset', e.target.value)}>
            {EVOLVE_PATH_PRESETS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
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
          Curve
          <select value={form.curve} onChange={(e) => patch('curve', e.target.value)}>
            {CURVE_OPTIONS.map((curve) => <option key={curve} value={curve}>{curve}</option>)}
          </select>
        </label>
        <label>
          Seed
          <input value={form.seed} onChange={(e) => patch('seed', e.target.value)} />
        </label>
      </fieldset>

      {view === 'triptych' ? (
        <fieldset>
          <legend>Triptych Recipe</legend>
          <label>Panel 1 Name<input value={form.triptychPanel1Name} onChange={(e) => patch('triptychPanel1Name', e.target.value)} /></label>
          <label>Panel 1 State<input value={form.triptychPanel1State} onChange={(e) => patch('triptychPanel1State', e.target.value)} /></label>
          <div className="split">
            <label>Panel 1 Path<select value={form.triptychPanel1Path} onChange={(e) => patch('triptychPanel1Path', e.target.value)}>{EVOLVE_PATH_PRESETS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Panel 1 Steps<input type="number" min="1" max="20" value={form.triptychPanel1Steps} onChange={(e) => patch('triptychPanel1Steps', Number(e.target.value))} /></label>
          </div>

          <label>Panel 2 Name<input value={form.triptychPanel2Name} onChange={(e) => patch('triptychPanel2Name', e.target.value)} /></label>
          <label>Panel 2 State<input value={form.triptychPanel2State} onChange={(e) => patch('triptychPanel2State', e.target.value)} /></label>
          <div className="split">
            <label>Panel 2 Path<select value={form.triptychPanel2Path} onChange={(e) => patch('triptychPanel2Path', e.target.value)}>{EVOLVE_PATH_PRESETS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Panel 2 Steps<input type="number" min="1" max="20" value={form.triptychPanel2Steps} onChange={(e) => patch('triptychPanel2Steps', Number(e.target.value))} /></label>
          </div>

          <label>Panel 3 Name<input value={form.triptychPanel3Name} onChange={(e) => patch('triptychPanel3Name', e.target.value)} /></label>
          <label>Panel 3 State<input value={form.triptychPanel3State} onChange={(e) => patch('triptychPanel3State', e.target.value)} /></label>
          <div className="split">
            <label>Panel 3 Path<select value={form.triptychPanel3Path} onChange={(e) => patch('triptychPanel3Path', e.target.value)}>{EVOLVE_PATH_PRESETS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Panel 3 Steps<input type="number" min="1" max="20" value={form.triptychPanel3Steps} onChange={(e) => patch('triptychPanel3Steps', Number(e.target.value))} /></label>
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend>Locks + Humanizer Range</legend>
        <label className="check-row"><input type="checkbox" checked={form.lockCore} onChange={(e) => patch('lockCore', e.target.checked)} />Lock core matrix</label>
        <label className="check-row"><input type="checkbox" checked={form.lockTexture} onChange={(e) => patch('lockTexture', e.target.checked)} />Lock texture metrics</label>
        <label className="check-row"><input type="checkbox" checked={form.lockPalette} onChange={(e) => patch('lockPalette', e.target.checked)} />Lock palette</label>
        <label className="check-row"><input type="checkbox" checked={form.lockGesture} onChange={(e) => patch('lockGesture', e.target.checked)} />Lock gesture</label>
        <div className="split">
          <label>
            Humanizer min
            <input type="number" min="0" max="100" value={form.humanizerMin} onChange={(e) => patch('humanizerMin', Number(e.target.value))} />
          </label>
          <label>
            Humanizer max
            <input type="number" min="0" max="100" value={form.humanizerMax} onChange={(e) => patch('humanizerMax', Number(e.target.value))} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Humanizer</legend>
        <label className="check-row">
          <input type="checkbox" checked={Boolean(form.autoCopyCompiledPrompt)} onChange={(e) => patch('autoCopyCompiledPrompt', e.target.checked)} />
          Clipboard auto-copy on new prompt
        </label>
        <label>
          Level: <strong>{form.humanizerLevel}</strong>
          <input type="range" min="0" max="100" value={form.humanizerLevel} onChange={(e) => patch('humanizerLevel', Number(e.target.value))} />
        </label>
        {HUMANIZER_QUALITIES.map(([key, label]) => (
          <label key={key} className="check-row">
            <input
              type="checkbox"
              checked={Boolean(form.humanizerQualities[key])}
              onChange={(e) => patch('humanizerQualities', { ...form.humanizerQualities, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </fieldset>
    </aside>
  );
}
