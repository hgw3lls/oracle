import type { CSSProperties } from 'react';
import { Panel } from '@/shared/layout/Panel';
import { useOracleStore } from '@/core/state/store';
import { compilePromptV2 } from '@/core/engine/compilePromptV2';
import { downloadJson, downloadText } from '@/shared/utils/download';
import { buildEnabledOnlySchema } from '@/core/state/exports';

const mixerDeckStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
  marginBottom: 14,
};

const channelStripStyle: CSSProperties = {
  border: '2px solid #fff',
  borderRadius: 0,
  background: '#111',
  boxShadow: '4px 4px 0 #fff',
  padding: 12,
  display: 'grid',
  gap: 10,
  minHeight: 220,
};

const stripHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  borderBottom: '1px solid rgba(255,255,255,0.45)',
  paddingBottom: 6,
  fontSize: 12,
  letterSpacing: 0.8,
};

const ledStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: '#37ff7e',
  boxShadow: '0 0 10px #37ff7e',
};

const channelButtonStyle: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '8px 10px',
  border: '2px solid #fff',
  borderRadius: 0,
  background: '#000',
  color: '#fff',
  fontWeight: 800,
  letterSpacing: 0.3,
};

const faderTrackStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.35)',
  padding: '8px 10px',
  display: 'grid',
  gap: 4,
};

const promptDisplayStyle: CSSProperties = {
  border: '2px solid #fff',
  borderRadius: 0,
  background: '#000',
  padding: 12,
  margin: 0,
  whiteSpace: 'pre-wrap',
};

export function LivePromptPanel() {
  const prompt = useOracleStore((s) => s.prompt);
  const schema = useOracleStore((s) => s.schema);
  const warnings = useOracleStore((s) => s.warnings);
  const importSchema = useOracleStore((s) => s.importSchema);
  const debugSections = schema.PROMPT_MANAGER?.enabled ? [] : compilePromptV2(schema).debugSections;

  return (
    <Panel>
      <h3 style={{ marginBottom: 6 }}>PROMPT MIXER</h3>
      <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85, fontSize: 12 }}>
        Brutalist channel-strip layout: copy/paste your image prompt fast, then route exports from dedicated strips.
      </p>

      <div style={mixerDeckStyle}>
        <section style={channelStripStyle} aria-label="Prompt channel strip">
          <header style={stripHeaderStyle}>
            <strong>CH 01 · PROMPT BUS</strong>
            <span style={ledStyle} aria-hidden="true" />
          </header>

          <button type="button" style={channelButtonStyle} onClick={() => navigator.clipboard.writeText(prompt)}>
            COPY IMAGE PROMPT
          </button>

          <button type="button" style={channelButtonStyle} onClick={() => downloadText('compiled_prompt.txt', prompt)}>
            EXPORT COMPILED PROMPT (.TXT)
          </button>

          <div style={faderTrackStyle}>
            <strong style={{ fontSize: 12 }}>OUTPUT NOTE</strong>
            <span style={{ fontSize: 12, opacity: 0.85 }}>
              Paste directly into ChatGPT or your preferred image generator prompt box.
            </span>
          </div>
        </section>

        <section style={channelStripStyle} aria-label="Schema channel strip">
          <header style={stripHeaderStyle}>
            <strong>CH 02 · SCHEMA BUS</strong>
            <span style={ledStyle} aria-hidden="true" />
          </header>

          <button type="button" style={channelButtonStyle} onClick={() => downloadJson('schema.json', schema)}>
            EXPORT SCHEMA JSON
          </button>

          <button
            type="button"
            style={channelButtonStyle}
            onClick={() => downloadJson('schema_enabled_only.json', buildEnabledOnlySchema(schema))}
          >
            EXPORT ENABLED-ONLY JSON
          </button>

          <label style={faderTrackStyle}>
            <strong style={{ fontSize: 12 }}>IMPORT SCHEMA JSON</strong>
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

      <pre style={promptDisplayStyle}>{prompt}</pre>

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
          <li key={d.title}>
            <strong>{d.title}:</strong> {d.text}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
