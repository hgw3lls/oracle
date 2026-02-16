import { useState } from 'react';
import { deletePresetPack, loadPresetPacks, savePresetPack } from '../utils/presetPacks';

export default function PresetManager({ title, storageKey, getCurrentParams, onLoadPreset }) {
  const [presetName, setPresetName] = useState('');
  const [packs, setPacks] = useState(() => loadPresetPacks(storageKey));

  const savePreset = () => {
    const next = savePresetPack(storageKey, presetName, getCurrentParams?.() ?? {});
    setPacks(next);
    setPresetName('');
  };

  const loadPreset = (preset) => {
    if (!preset) return;
    onLoadPreset?.(preset.params ?? {});
  };

  const removePreset = (presetId) => {
    const next = deletePresetPack(storageKey, presetId);
    setPacks(next);
  };

  return (
    <div className="preset-manager">
      <h3>{title}</h3>
      <div className="preset-manager-row">
        <input
          value={presetName}
          onChange={(event) => setPresetName(event.target.value)}
          placeholder="Preset name"
          aria-label={`${title} preset name`}
        />
        <button type="button" onClick={savePreset} disabled={!presetName.trim()}>
          Save Preset
        </button>
      </div>
      <ul className="preset-list">
        {packs.map((preset) => (
          <li key={preset.id}>
            <span>{preset.name}</span>
            <div className="preset-actions">
              <button type="button" onClick={() => loadPreset(preset)}>Load</button>
              <button type="button" onClick={() => removePreset(preset.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {!packs.length ? <p className="preset-empty">No presets saved.</p> : null}
    </div>
  );
}
