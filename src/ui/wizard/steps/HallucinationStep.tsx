import { useOracleStore } from '../../../state/store';

export function HallucinationStep() {
  const schema = useOracleStore((s) => s.schema);
  const setValue = useOracleStore((s) => s.set);

  return (
    <div>
      <textarea value={schema.HALLUCINATION.profile} onChange={(e) => setValue('HALLUCINATION.profile', e.target.value)} />
      <input type="number" value={schema.HALLUCINATION.drift} onChange={(e) => setValue('HALLUCINATION.drift', Number(e.target.value))} />
    </div>
  );
}
