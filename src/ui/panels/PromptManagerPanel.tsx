import { useMemo, useState } from 'react';
import { Panel } from '../layout/Panel';
import { useOracleStore } from '../../state/store';
import type { PromptBlock, PromptBlockKind, PromptEntity, PromptSnapshot, TemplateEntity } from '../../schema/schemaV2';
import { compileManagedPrompt, lintManagedPrompt } from '../../engine/compileManagedPrompt';

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(36)}`;
}

const KIND_LABELS: Record<PromptBlockKind, string> = {
  CORE: 'Core',
  STYLE_PACKS: 'Style packs',
  PALETTE_PACK: 'Palette',
  CONSTRAINTS: 'Constraints',
  PROCESS: 'Process',
  OUTPUT_SPEC: 'Output spec',
  NEGATIVES: 'Negatives',
};

function makeBlankBlock(kind: PromptBlockKind): PromptBlock {
  return { id: uid('blk'), kind, enabled: true, content: '' };
}

function generateVariations(base: string, n = 6): string[] {
  const swaps: Array<[RegExp, string[]]> = [
    [/less symmetrical/gi, ['asymmetrical', 'off-balance', 'irregular']],
    [/more diagrammatic/gi, ['strongly diagrammatic', 'schematic', 'technical diagram']],
    [/avoid cheerful palette/gi, ['avoid bright cheerful palette', 'keep palette severe', 'no playful colors']],
    [/parallax drift/gi, ['parallax drift', 'depth shear', 'perceptual parallax']],
    [/film-grain/gi, ['film-grain', 'paper grain', 'print noise']],
  ];

  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let s = base;
    for (const [re, opts] of swaps) {
      if (re.test(s)) {
        const pick = opts[i % opts.length];
        s = s.replace(re, pick);
      }
    }
    out.push(s);
  }
  return out;
}

export function PromptManagerPanel() {
  const schema = useOracleStore((s) => s.schema);
  const set = useOracleStore((s) => s.set);
  const merge = useOracleStore((s) => s.merge);
  const warnings = useOracleStore((s) => s.warnings);

  const pm = schema.PROMPT_MANAGER;
  const active = pm.prompts.find((p) => p.id === pm.active_prompt_id) ?? pm.prompts[0];

  const [variationCount, setVariationCount] = useState(6);

  const compiledManaged = useMemo(() => compileManagedPrompt(schema), [schema]);
  const localLint = useMemo(() => lintManagedPrompt(schema, active?.blocks ?? []), [schema, active?.blocks]);

  const templates = pm.templates;

  const updateActive = (next: PromptEntity) => {
    const idx = pm.prompts.findIndex((p) => p.id === next.id);
    if (idx < 0) return;
    const prompts = [...pm.prompts];
    prompts[idx] = next;
    merge({ PROMPT_MANAGER: { ...pm, prompts } } as any);
  };

  const createPrompt = () => {
    const now = Date.now();
    const p: PromptEntity = {
      id: uid('prompt'),
      name: `Prompt ${pm.prompts.length + 1}`,
      description: '',
      tags: [],
      created_at: now,
      updated_at: now,
      blocks: [makeBlankBlock('CORE'), makeBlankBlock('PROCESS'), makeBlankBlock('NEGATIVES')],
    };
    merge({ PROMPT_MANAGER: { ...pm, prompts: [p, ...pm.prompts], active_prompt_id: p.id } } as any);
  };

  const applyTemplate = (tpl: TemplateEntity) => {
    if (!active) return;
    updateActive({
      ...active,
      name: active.name,
      updated_at: Date.now(),
      blocks: tpl.blocks.map((b) => ({ ...b, id: uid('blk') })),
    });
  };

  const snapshot = () => {
    if (!active) return;
    const now = Date.now();
    const snap: PromptSnapshot = {
      id: uid('snap'),
      prompt_id: active.id,
      name: `${active.name} @ ${new Date(now).toLocaleString()}`,
      compiled: compiledManaged.compiled,
      created_at: now,
      blocks: active.blocks,
      warnings: compiledManaged.warnings,
    };
    merge({ PROMPT_MANAGER: { ...pm, history: [snap, ...pm.history].slice(0, 200) } } as any);
    alert('Saved snapshot to History.');
  };

  const variations = useMemo(() => generateVariations(compiledManaged.compiled, variationCount), [compiledManaged.compiled, variationCount]);

  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3>Prompt Manager</h3>
          <p style={{ opacity: 0.8, marginTop: 6 }}>Block-based prompts · templates · snapshots · variations</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={createPrompt}>New Prompt</button>
          <button type="button" onClick={snapshot}>Save Snapshot</button>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span>Compile mode</span>
            <select value={pm.compile_mode} onChange={(e) => set('PROMPT_MANAGER.compile_mode', e.target.value)}>
              <option value="MINIMAL">MINIMAL</option>
              <option value="BALANCED">BALANCED</option>
              <option value="MAX_CONTROL">MAX_CONTROL</option>
            </select>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={pm.enabled}
              onChange={(e) => set('PROMPT_MANAGER.enabled', e.target.checked)}
            />
            <span>Use manager as compiled prompt</span>
          </label>
        </div>
      </div>

      <hr />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <div>
          <h4>Prompts</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <select
              value={pm.active_prompt_id}
              onChange={(e) => set('PROMPT_MANAGER.active_prompt_id', e.target.value)}
              style={{ width: '100%' }}
            >
              {pm.prompts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {active && (
            <>
              <label>
                <span>Name</span>
                <input
                  value={active.name}
                  onChange={(e) => updateActive({ ...active, name: e.target.value, updated_at: Date.now() })}
                  style={{ width: '100%' }}
                />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  value={active.description}
                  onChange={(e) => updateActive({ ...active, description: e.target.value, updated_at: Date.now() })}
                  style={{ width: '100%', minHeight: 70 }}
                />
              </label>
            </>
          )}

          <h4 style={{ marginTop: 12 }}>Templates</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {templates.map((t) => (
              <button key={t.id} type="button" onClick={() => applyTemplate(t)} title={t.description}>
                Apply: {t.name}
              </button>
            ))}
          </div>

          <h4 style={{ marginTop: 12 }}>History</h4>
          <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid rgba(255,255,255,0.15)', padding: 8 }}>
            {pm.history.length === 0 && <p style={{ opacity: 0.75 }}>No snapshots yet.</p>}
            {pm.history.slice(0, 25).map((h) => (
              <div key={h.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ fontSize: 12 }}>{h.name}</strong>
                  <button type="button" onClick={() => navigator.clipboard.writeText(h.compiled)}>Copy</button>
                </div>
                {h.warnings?.length > 0 && (
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    ⚠ {h.warnings.slice(0, 2).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4>Blocks</h4>
          {active?.blocks.map((b, i) => (
            <div key={b.id} style={{ border: '1px solid rgba(255,255,255,0.12)', padding: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={b.enabled}
                      onChange={(e) => {
                        const blocks = [...active.blocks];
                        blocks[i] = { ...b, enabled: e.target.checked };
                        updateActive({ ...active, blocks, updated_at: Date.now() });
                      }}
                    />
                    <strong>{KIND_LABELS[b.kind]}</strong>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <select
                    value={b.kind}
                    onChange={(e) => {
                      const blocks = [...active.blocks];
                      blocks[i] = { ...b, kind: e.target.value as PromptBlockKind };
                      updateActive({ ...active, blocks, updated_at: Date.now() });
                    }}
                  >
                    {Object.keys(KIND_LABELS).map((k) => (
                      <option key={k} value={k}>{KIND_LABELS[k as PromptBlockKind]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const blocks = [...active.blocks];
                      if (i > 0) {
                        [blocks[i - 1], blocks[i]] = [blocks[i], blocks[i - 1]];
                        updateActive({ ...active, blocks, updated_at: Date.now() });
                      }
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blocks = [...active.blocks];
                      if (i < blocks.length - 1) {
                        [blocks[i + 1], blocks[i]] = [blocks[i], blocks[i + 1]];
                        updateActive({ ...active, blocks, updated_at: Date.now() });
                      }
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blocks = active.blocks.filter((x) => x.id !== b.id);
                      updateActive({ ...active, blocks, updated_at: Date.now() });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <textarea
                value={b.content}
                onChange={(e) => {
                  const blocks = [...active.blocks];
                  blocks[i] = { ...b, content: e.target.value };
                  updateActive({ ...active, blocks, updated_at: Date.now() });
                }}
                placeholder="Write block content…"
                style={{ width: '100%', minHeight: 90, marginTop: 8 }}
              />
            </div>
          ))}

          {active && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => updateActive({ ...active, blocks: [...active.blocks, makeBlankBlock('CORE')], updated_at: Date.now() })}>+ Block</button>
              <button
                type="button"
                onClick={() => {
                  const pasted = prompt('Paste plain text to turn into a CORE block:');
                  if (!pasted) return;
                  updateActive({ ...active, blocks: [{ ...makeBlankBlock('CORE'), content: pasted }, ...active.blocks], updated_at: Date.now() });
                }}
              >
                Paste to CORE
              </button>
            </div>
          )}

          <hr />

          <h4>Lint</h4>
          {(warnings.length > 0 || localLint.length > 0) ? (
            <ul>
              {[...new Set([...warnings, ...localLint])].slice(0, 10).map((w) => (
                <li key={w}>⚠ {w}</li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.75 }}>No warnings.</p>
          )}

          <h4>Variations</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span>count</span>
              <input type="number" min={2} max={12} value={variationCount} onChange={(e) => setVariationCount(Number(e.target.value))} style={{ width: 80 }} />
            </label>
            <button type="button" onClick={() => navigator.clipboard.writeText(variations.join('\n\n---\n\n'))}>Copy all</button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {variations.map((v, idx) => (
              <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.12)', padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <strong>Variant {idx + 1}</strong>
                  <button type="button" onClick={() => navigator.clipboard.writeText(v)}>Copy</button>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{v}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
