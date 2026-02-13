import { Panel } from '../layout/Panel';
import { useOracleStore } from '../../state/store';
import { compilePromptV2 } from '../../engine/compilePromptV2';

export function LivePromptPanel() {
  const prompt = useOracleStore((s) => s.prompt);
  const schema = useOracleStore((s) => s.schema);
  const debugSections = compilePromptV2(schema).debugSections;

  return (
    <Panel>
      <h3>Compiled Prompt</h3>
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
