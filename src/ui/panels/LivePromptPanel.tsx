import { Panel } from '../layout/Panel';
import { useOracleStore } from '../../state/store';
import { compilePromptV2 } from '../../engine/compilePromptV2';
import { downloadJson, downloadText } from '../../utils/download';
import { buildEnabledOnlySchema } from '../../state/exports';

export function LivePromptPanel() {
  const prompt = useOracleStore((s) => s.prompt);
  const schema = useOracleStore((s) => s.schema);
  const importSchema = useOracleStore((s) => s.importSchema);
  const debugSections = compilePromptV2(schema).debugSections;

  return (
    <Panel>
      <h3>Compiled Prompt</h3>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button type="button" onClick={() => downloadText('compiled_prompt.txt', prompt)}>Export compiled prompt (.txt)</button>
        <button type="button" onClick={() => downloadJson('schema.json', schema)}>Export schema JSON</button>
        <button type="button" onClick={() => downloadJson('schema_enabled_only.json', buildEnabledOnlySchema(schema))}>Export enabled-only schema JSON</button>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span>Import schema JSON</span>
          <input
            type="file"
            accept="application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                importSchema(JSON.parse(text));
              } catch {
                alert('Could not import JSON file.');
              } finally {
                e.target.value = '';
              }
            }}
          />
        </label>
      </div>

      <pre>{prompt}</pre>
      <h4>Debug Sections</h4>
      <ul>
        {debugSections.map((d) => (
          <li key={d.title}><strong>{d.title}:</strong> {d.text}</li>
        ))}
      </ul>
    </Panel>
  );
}
