import { useOracleStore } from '@/core/state/store';

export function StateStep() {
  const schema = useOracleStore((s) => s.schema);
  const setValue = useOracleStore((s) => s.set);

  return (
    <div>
      <input value={schema.STATE_MAP.primary_state} onChange={(e) => setValue('STATE_MAP.primary_state', e.target.value)} />
      <input value={schema.STATE_MAP.secondary_state} onChange={(e) => setValue('STATE_MAP.secondary_state', e.target.value)} />
      <input type="number" value={schema.STATE_MAP.intensity} onChange={(e) => setValue('STATE_MAP.intensity', Number(e.target.value))} />
    </div>
  );
}
