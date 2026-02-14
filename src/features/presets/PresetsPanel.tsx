import { Panel } from '@/shared/layout/Panel';
import { useOracleStore } from '@/core/state/store';
import { INFLUENCE_PRESETS, isWeightsWithinBounds } from '@/core/engine/influences';

const presetKeys = ['BRUS_LOMBARDI', 'BACON_COLLAPSE', 'BASQUIAT_OCCULT', 'PRINT_PURITY'] as const;

export function PresetsPanel() {
  const merge = useOracleStore((s) => s.merge);

  return (
    <Panel>
      <h3>Influence Presets</h3>
      {presetKeys.map((key) => (
        <button
          key={key}
          onClick={() => {
            const preset = INFLUENCE_PRESETS[key];
            const weights = preset.INFLUENCE_ENGINE?.weights;
            if (weights && isWeightsWithinBounds(weights)) {
              merge(preset);
            }
          }}
        >
          Apply {key}
        </button>
      ))}
      <p>Preset apply is non-destructive (deep merge).</p>
    </Panel>
  );
}
