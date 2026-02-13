import { describe, expect, it } from 'vitest';
import { INFLUENCE_PRESETS, isWeightsWithinBounds, renderInfluenceBehaviors } from './influences';
import { defaultSchemaV2 } from '../schema/defaults';
import { useOracleStore } from '../state/store';

describe('influence/material behaviors', () => {
  it('preset weights stay within bounds', () => {
    for (const preset of Object.values(INFLUENCE_PRESETS)) {
      expect(isWeightsWithinBounds(preset.INFLUENCE_ENGINE!.weights)).toBe(true);
    }
  });

  it('preset merge does not wipe unrelated schema sections', () => {
    useOracleStore.getState().resetToDefaults();
    const before = defaultSchemaV2();
    useOracleStore.getState().merge(INFLUENCE_PRESETS.BRUS_LOMBARDI);
    const after = useOracleStore.getState().schema;

    expect(after.INPUT.subject).toBe(before.INPUT.subject);
    expect(after.PALETTE.descriptive).toBe(before.PALETTE.descriptive);
    expect(after.CONSTRAINTS.max_tokens).toBe(before.CONSTRAINTS.max_tokens);
  });

  it('rendered behavior lines include physical actions', () => {
    const lines = renderInfluenceBehaviors(defaultSchemaV2().INFLUENCE_ENGINE.weights);
    const output = lines.join(' ').toLowerCase();
    expect(output).toMatch(/spray|smear|arc|node|overprint/);
  });
});
