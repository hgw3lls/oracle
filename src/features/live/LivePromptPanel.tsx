import type { CSSProperties } from 'react';
import { Panel } from '@/shared/layout/Panel';
import { useOracleStore } from '@/core/state/store';
import { compilePromptV2 } from '@/core/engine/compilePromptV2';
import { downloadJson, downloadText } from '@/shared/utils/download';
import { buildEnabledOnlySchema } from '@/core/state/exports';

const sectionCardStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 10,
  padding: 12,
  display: 'grid',
  gap: 10,
};

const actionsRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const buttonStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
};

export function LivePromptPanel() {
  const prompt = useOracleStore((s) => s.prompt);
  const schema = useOracleStore((s) => s.schema);
  const warnings = useOracleStore((s) => s.warnings);
  const importSchema = useOracleStore((s) => s.importSchema);
  const debugSections = schema.PROMPT_MANAGER?.enabled ? [] : compilePromptV2(schema).debugSections;

  return (
    <Panel>
      <h3>Compiled Prompt</h3>

      <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
        <section style={sectionCardStyle} aria-label="Prompt actions">
          <strong style={{ fontSize: 13, letterSpacing: 0.3 }}>Prompt actions</strong>
          <div style={actionsRowStyle}>
            <button type="button" style={buttonStyle} onClick={() => navigator.clipboard.writeText(prompt)}>
              Copy image prompt
            </button>
            <button type="button" style={buttonStyle} onClick={() => downloadText('compiled_prompt.txt', prompt)}>
              Export compiled prompt (.txt)
            </button>
          </div>
          <p style={{ margin: 0, opacity: 0.82, fontSize: 12 }}>
            Copy and paste this prompt directly into ChatGPT or your preferred image generator.
          </p>
        </section>

        <section style={sectionCardStyle} aria-label="Schema actions">
          <strong style={{ fontSize: 13, letterSpacing: 0.3 }}>Schema actions</strong>
          <div style={actionsRowStyle}>
            <button type="button" style={buttonStyle} onClick={() => downloadJson('schema.json', schema)}>
              Export schema JSON
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => downloadJson('schema_enabled_only.json', buildEnabledOnlySchema(schema))}
            >
              Export enabled-only schema JSON
            </button>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Import schema JSON</span>
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
        </section>
      </div>

      <pre>{prompt}</pre>

      {warnings.length > 0 && (
        <>
          <h4>Warnings</h4>
          <ul>
            {warnings.slice(0, 10).map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        </>
      )}

      <h4>Debug Sections</h4>
      <ul>
        {debugSections.map((d) => (
          <li key={d.title}><strong>{d.title}:</strong> {d.text}</li>
        ))}
      </ul>
    </Panel>
  );
}
