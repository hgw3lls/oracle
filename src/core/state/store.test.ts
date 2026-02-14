import { describe, expect, it } from 'vitest';
import { useOracleStore } from './store';

describe('store module toggles', () => {
  it('defaults modules enabled except ANIMATION', () => {
    useOracleStore.getState().resetToDefaults();
    const schema = useOracleStore.getState().schema;
    expect(schema.MODULES.INPUT).toBe(true);
    expect(schema.MODULES.ANIMATION).toBe(false);
  });

  it('toggle module preserves state values', () => {
    useOracleStore.getState().resetToDefaults();
    const store = useOracleStore.getState();
    store.set('ANIMATION.speed', 77);
    store.toggleModule('ANIMATION');
    store.toggleModule('ANIMATION');
    expect(useOracleStore.getState().schema.ANIMATION.speed).toBe(77);
  });
});
