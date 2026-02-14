import { useOracleStore } from '@/core/state/store';

export function IntentStep() {
  const schema = useOracleStore((s) => s.schema);
  const setValue = useOracleStore((s) => s.set);

  return (
    <div>
      <label>Subject</label>
      <textarea value={schema.INPUT.subject} onChange={(e) => setValue('INPUT.subject', e.target.value)} />
      <label>Medium</label>
      <input value={schema.INPUT.medium} onChange={(e) => setValue('INPUT.medium', e.target.value)} />
      <label>Notes</label>
      <textarea value={schema.INPUT.notes} onChange={(e) => setValue('INPUT.notes', e.target.value)} />
    </div>
  );
}
