import { useEffect, useMemo, useState } from 'react';
import { Panel } from '@/shared/layout/Panel';
import { useOracleStore } from '@/core/state/store';
import type {
  AnimationKeyframe,
  ModuleKey,
  PromptBlock,
  PromptBlockKind,
  PromptEntity,
  PromptSnapshot,
  TemplateEntity,
} from '@/core/schema/schemaV2';
import { compileManagedPrompt, lintManagedPrompt } from '@/core/engine/compileManagedPrompt';
import { buildFrameSeries, exportFramePromptSheet, exportTimelineJson } from '@/core/engine/animation/animationEngine';
import { downloadJson, downloadText } from '@/shared/utils/download';

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

function OutputDock({
  title,
  mode,
  onMode,
  compiled,
  onCopy,
  onDownloadTxt,
  onDownloadJson,
  variations,
  variationCount,
  onVariationCount,
  showVariations,
  onToggleVariations,
  onCopyAllVariations,
}: {
  title: string;
  mode: 'MINIMAL' | 'BALANCED' | 'MAX_CONTROL';
  onMode: (m: 'MINIMAL' | 'BALANCED' | 'MAX_CONTROL') => void;
  compiled: string;
  onCopy: () => void;
  onDownloadTxt: () => void;
  onDownloadJson: () => void;
  variations: string[];
  variationCount: number;
  onVariationCount: (n: number) => void;
  showVariations: boolean;
  onToggleVariations: () => void;
  onCopyAllVariations: () => void;
}) {
  return (
    <aside
      style={{
        position: 'sticky',
        top: 12,
        alignSelf: 'start',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 12,
        padding: 12,
        background: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontWeight: 900, letterSpacing: 0.6 }}>PROMPT FRAME</div>
        <div style={{ opacity: 0.75, fontSize: 12, textAlign: 'right' }}>{title}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
        {(['MINIMAL', 'BALANCED', 'MAX_CONTROL'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMode(m)}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
            }}
            title={m}
          >
            {m.replace('_', ' ')}
          </button>
        ))}

        <button
          type="button"
          onClick={onCopy}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.16)',
            cursor: 'pointer',
            fontWeight: 900,
          }}
        >
          Copy
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
        <button type="button" onClick={onDownloadTxt} style={{ fontSize: 12 }}>
          Download .txt
        </button>
        <button type="button" onClick={onDownloadJson} style={{ fontSize: 12 }}>
          Download .json
        </button>

        <button
          type="button"
          onClick={onToggleVariations}
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.18)',
            background: showVariations ? 'rgba(255,255,255,0.10)' : 'transparent',
          }}
          title="Expand variations"
        >
          {showVariations ? 'Variations ▾' : 'Variations ▸'}
        </button>
      </div>

      <textarea
        readOnly
        value={compiled}
        style={{
          width: '100%',
          height: showVariations ? 320 : 520,
          marginTop: 10,
          borderRadius: 10,
          padding: 10,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(0,0,0,0.45)',
          color: 'inherit',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 12,
          lineHeight: 1.35,
          resize: 'vertical',
          whiteSpace: 'pre',
        }}
      />

      {showVariations && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 12 }}>Variations</strong>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 10 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>count</span>
              <input
                type="number"
                min={2}
                max={24}
                value={variationCount}
                onChange={(e) => onVariationCount(Number(e.target.value))}
                style={{ width: 70 }}
              />
            </label>

            <button type="button" onClick={onCopyAllVariations} style={{ marginLeft: 'auto', fontSize: 12 }}>
              Copy all
            </button>
          </div>

          <div style={{ maxHeight: 260, overflow: 'auto', display: 'grid', gap: 10 }}>
            {variations.map((v, idx) => (
              <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 12 }}>Variant {idx + 1}</strong>
                  <button type="button" onClick={() => navigator.clipboard.writeText(v)} style={{ fontSize: 12 }}>
                    Copy
                  </button>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 8 }}>{v}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}



function ModulesInline() {
  const modules = useOracleStore((s) => s.schema.MODULES);
  const toggle = useOracleStore((s) => s.toggleModule);
  const merge = useOracleStore((s) => s.merge);

  const MODULE_META: Array<{ key: ModuleKey; label: string; desc: string }> = [
    { key: 'INPUT', label: 'Input', desc: 'Core subject + intent fields.' },
    { key: 'PROMPT_GENOME', label: 'Genome', desc: 'Structured prompt “spine” + weights.' },
    { key: 'PALETTE', label: 'Palette', desc: 'Extract/lock plates and palette rules.' },
    { key: 'CONSTRAINTS', label: 'Constraints', desc: 'Hard limits: tokens, avoid list, safety.' },
    { key: 'HALLUCINATION', label: 'Perception', desc: 'Drift, parallax, peripheral noise.' },
    { key: 'HYPNA_MATRIX', label: 'Hypna‑Matrix', desc: 'Memory/symbol depth + state parameters.' },
    { key: 'VISUAL_GRAMMAR', label: 'Visual grammar', desc: 'Diagram/print grammar helpers.' },
    { key: 'INFLUENCE_ENGINE', label: 'Influences', desc: 'Named influences & style vectors.' },
    { key: 'STATE_MAP', label: 'State map', desc: 'State routing / phase labels.' },
    { key: 'ANIMATION', label: 'Animation', desc: 'Keyframes → frame prompts.' },
  ];

  const enableMinimalMode = (keepPalette = true) => {
    merge({
      MODULES: {
        INPUT: true,
        STATE_MAP: false,
        HALLUCINATION: false,
        HYPNA_MATRIX: false,
        PROMPT_GENOME: true,
        VISUAL_GRAMMAR: false,
        INFLUENCE_ENGINE: false,
        PALETTE: keepPalette,
        CONSTRAINTS: true,
        ANIMATION: false,
      },
    } as any);
  };

  const Pill = ({ active, children, title, onClick }: { active: boolean; children: any; title?: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'flex-start',
        textAlign: 'left',
        padding: 10,
        borderRadius: 10,
        border: `1px solid ${active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
        background: active ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.0)',
        cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', padding: 12, borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <strong>Modules</strong>
          <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4 }}>
            Turn features on/off. The compiler only includes enabled modules.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => enableMinimalMode(true)}>Minimal + palette</button>
          <button type="button" onClick={() => enableMinimalMode(false)}>Minimal</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
        {MODULE_META.map((m) => (
          <Pill
            key={m.key}
            active={Boolean((modules as any)[m.key])}
            title={m.desc}
            onClick={() => toggle(m.key)}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: Boolean((modules as any)[m.key]) ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
                }}
              />
              <strong style={{ fontSize: 12 }}>{m.label}</strong>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.25 }}>{m.desc}</div>
          </Pill>
        ))}
      </div>
    </div>
  );
}

function TemplateEditor({
  template,
  onChange,
  onDelete,
}: {
  template: TemplateEntity;
  onChange: (next: TemplateEntity) => void;
  onDelete: () => void;
}) {
  const [newBlockKind, setNewBlockKind] = useState<PromptBlockKind>('CORE');

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <strong>Edit Template</strong>
        <button type="button" onClick={onDelete}>Delete template</button>
      </div>

      <label>
        <span>Name</span>
        <input
          value={template.name}
          onChange={(e) => onChange({ ...template, name: e.target.value, updated_at: Date.now() })}
          style={{ width: '100%' }}
        />
      </label>

      <label>
        <span>Description</span>
        <textarea
          value={template.description}
          onChange={(e) => onChange({ ...template, description: e.target.value, updated_at: Date.now() })}
          style={{ width: '100%', minHeight: 70 }}
        />
      </label>

      <label>
        <span>Tags (comma separated)</span>
        <input
          value={template.tags.join(', ')}
          onChange={(e) =>
            onChange({
              ...template,
              tags: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              updated_at: Date.now(),
            })
          }
          style={{ width: '100%' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
        <select value={newBlockKind} onChange={(e) => setNewBlockKind(e.target.value as PromptBlockKind)}>
          {Object.keys(KIND_LABELS).map((k) => (
            <option key={k} value={k}>{KIND_LABELS[k as PromptBlockKind]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onChange({
            ...template,
            updated_at: Date.now(),
            blocks: [...template.blocks, makeBlankBlock(newBlockKind)],
          })}
        >
          + Add block
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        {template.blocks.map((b, i) => (
          <div key={b.id} style={{ border: '1px solid rgba(255,255,255,0.10)', padding: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={b.enabled}
                  onChange={(e) => {
                    const blocks = [...template.blocks];
                    blocks[i] = { ...b, enabled: e.target.checked };
                    onChange({ ...template, blocks, updated_at: Date.now() });
                  }}
                />
                <strong style={{ fontSize: 12 }}>{KIND_LABELS[b.kind]}</strong>
              </label>

              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={b.kind}
                  onChange={(e) => {
                    const blocks = [...template.blocks];
                    blocks[i] = { ...b, kind: e.target.value as PromptBlockKind };
                    onChange({ ...template, blocks, updated_at: Date.now() });
                  }}
                >
                  {Object.keys(KIND_LABELS).map((k) => (
                    <option key={k} value={k}>{KIND_LABELS[k as PromptBlockKind]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const blocks = [...template.blocks];
                    if (i > 0) {
                      [blocks[i - 1], blocks[i]] = [blocks[i], blocks[i - 1]];
                      onChange({ ...template, blocks, updated_at: Date.now() });
                    }
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blocks = [...template.blocks];
                    if (i < blocks.length - 1) {
                      [blocks[i + 1], blocks[i]] = [blocks[i], blocks[i + 1]];
                      onChange({ ...template, blocks, updated_at: Date.now() });
                    }
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blocks = template.blocks.filter((x) => x.id !== b.id);
                    onChange({ ...template, blocks, updated_at: Date.now() });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <textarea
              value={b.content}
              onChange={(e) => {
                const blocks = [...template.blocks];
                blocks[i] = { ...b, content: e.target.value };
                onChange({ ...template, blocks, updated_at: Date.now() });
              }}
              placeholder="Template block content…"
              style={{ width: '100%', minHeight: 90, marginTop: 8 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PromptManagerPanel() {
  const schema = useOracleStore((s) => s.schema);
  const set = useOracleStore((s) => s.set);
  const merge = useOracleStore((s) => s.merge);
  const warnings = useOracleStore((s) => s.warnings);

  const pm = schema.PROMPT_MANAGER;
  const active = pm.prompts.find((p) => p.id === pm.active_prompt_id) ?? pm.prompts[0];
  const compiledManaged = useMemo(() => compileManagedPrompt(schema), [schema]);
  const localLint = useMemo(() => lintManagedPrompt(schema, active?.blocks ?? []), [schema, active?.blocks]);

  const [view, setView] = useState<'builder' | 'templates' | 'animation'>('builder');
  const [variationCount, setVariationCount] = useState(6);
  const [showVariations, setShowVariations] = useState(false);
  const [templateId, setTemplateId] = useState<string>(pm.templates[0]?.id ?? '');
  const [blendTemplateIds, setBlendTemplateIds] = useState<string[]>([]);
  const [newBlockKind, setNewBlockKind] = useState<PromptBlockKind>('CORE');

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

  
  const createBlendedBlocks = (tpls: TemplateEntity[]): PromptBlock[] => {
    const order: PromptBlockKind[] = ['CORE', 'STYLE_PACKS', 'PALETTE_PACK', 'CONSTRAINTS', 'PROCESS', 'OUTPUT_SPEC', 'NEGATIVES'];
    const out: PromptBlock[] = [];
    for (const kind of order) {
      const parts: string[] = [];
      for (const tpl of tpls) {
        const blocks = tpl.blocks.filter((b) => b.kind === kind && b.enabled && b.content.trim().length > 0);
        for (const b of blocks) {
          parts.push(`〔${tpl.name}〕\n${b.content.trim()}`);
        }
      }
      if (parts.length) out.push({ id: uid('blk'), kind, enabled: true, content: parts.join('\n\n') });
    }
    return out.length ? out : [makeBlankBlock('CORE')];
  };

  const applyTemplatesToActive = (tpls: TemplateEntity[], mode: 'replace' | 'append' = 'replace') => {
    if (!active) return;
    const blended = createBlendedBlocks(tpls);
    const nextBlocks = mode === 'append' ? [...active.blocks, ...blended] : blended;
    updateActive({ ...active, updated_at: Date.now(), blocks: nextBlocks });
  };

  const templates = pm.templates;
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? templates[0];

  const updateTemplate = (next: TemplateEntity) => {
    const idx = templates.findIndex((t) => t.id === next.id);
    if (idx < 0) return;
    const nextTemplates = [...templates];
    nextTemplates[idx] = next;
    merge({ PROMPT_MANAGER: { ...pm, templates: nextTemplates } } as any);
  };

  const createTemplateFromActive = () => {
    if (!active) return;
    const now = Date.now();
    const tpl: TemplateEntity = {
      id: uid('tpl'),
      name: `Template ${templates.length + 1}`,
      description: `From: ${active.name}`,
      tags: [],
      created_at: now,
      updated_at: now,
      blocks: active.blocks.map((b) => ({ ...b, id: uid('blk') })),
    };
    merge({ PROMPT_MANAGER: { ...pm, templates: [tpl, ...templates] } } as any);
    setTemplateId(tpl.id);
    setView('templates');
  };

  const deleteTemplate = (id: string) => {
    const ok = confirm('Delete this template?');
    if (!ok) return;
    const nextTemplates = templates.filter((t) => t.id !== id);
    merge({ PROMPT_MANAGER: { ...pm, templates: nextTemplates } } as any);
    setTemplateId(nextTemplates[0]?.id ?? '');
  };

  const animation = schema.ANIMATION;
  const series = useMemo(() => buildFrameSeries(schema), [schema]);
  const [scrubIndex, setScrubIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);


  const setAnimKeyframes = (keyframes: AnimationKeyframe[]) => {
    merge({ ANIMATION: { ...animation, keyframes } } as any);
  };

  const addKeyframe = () => {
    const next: AnimationKeyframe = { t: Math.min(1, Math.max(0, (animation.keyframes.at(-1)?.t ?? 0) + 0.25)), curves: {} };
    setAnimKeyframes([...animation.keyframes, next].sort((a, b) => a.t - b.t));
  };

  const deleteKeyframe = (idx: number) => {
    const next = animation.keyframes.filter((_, i) => i !== idx);
    setAnimKeyframes(next.length ? next : [{ t: 0, curves: {} }]);
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (series.status !== 'ok' || series.frames.length === 0) return;

    const intervalMs = Math.max(30, Math.round(1000 / Math.max(1, animation.fps || 12)));
    const id = window.setInterval(() => {
      setScrubIndex((prev) => {
        const next = prev + 1;
        if (next >= series.frames.length) return 0;
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [isPlaying, series.status, series.frames.length, animation.fps]);

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');
    const onChange = () => setIsNarrow(!!mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const dockTitle = useMemo(() => {
    if (view === 'animation' && series.status === 'ok' && series.frames.length) {
      const f = series.frames[Math.max(0, Math.min(scrubIndex, series.frames.length - 1))];
      return `${active?.name ?? 'Active'} · frame ${scrubIndex + 1}/${series.frames.length} · t=${f.t.toFixed(3)}`;
    }
    return active?.name ?? 'Active prompt';
  }, [view, series.status, series.frames, scrubIndex, active?.name]);

  const dockCompiled = useMemo(() => {
    if (view === 'animation' && series.status === 'ok' && series.frames.length) {
      return series.frames[Math.max(0, Math.min(scrubIndex, series.frames.length - 1))]?.compiledPrompt ?? compiledManaged.compiled;
    }
    return compiledManaged.compiled;
  }, [view, series.status, series.frames, scrubIndex, compiledManaged.compiled]);
  const variations = useMemo(() => generateVariations(dockCompiled, variationCount), [dockCompiled, variationCount]);



  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3>Prompt Manager</h3>
          <p style={{ opacity: 0.8, marginTop: 6 }}>Blocks · templates · animation</p>
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
            <span>Use manager for compiled prompt</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button type="button" className={view === 'builder' ? 'step active' : 'step'} onClick={() => setView('builder')}>Builder</button>
        <button type="button" className={view === 'templates' ? 'step active' : 'step'} onClick={() => setView('templates')}>Templates</button>
        <button type="button" className={view === 'animation' ? 'step active' : 'step'} onClick={() => setView('animation')}>Animation</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <ModulesInline />
      </div>

      <hr />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : 'minmax(300px, 360px) 1fr minmax(360px, 520px)',
          gap: 12,
          alignItems: 'start',
        }}
      >
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => {
                const picked = templates.filter((t) => blendTemplateIds.includes(t.id));
                if (picked.length) applyTemplatesToActive(picked, 'replace');
              }}
              disabled={blendTemplateIds.length === 0}
              title="Replace active blocks with the blended template blocks"
            >
              Apply selected
            </button>
            <button
              type="button"
              onClick={() => {
                const picked = templates.filter((t) => blendTemplateIds.includes(t.id));
                if (picked.length) applyTemplatesToActive(picked, 'append');
              }}
              disabled={blendTemplateIds.length === 0}
              title="Append blended template blocks to the end of your current blocks"
            >
              Append selected
            </button>
            <button type="button" onClick={() => setBlendTemplateIds([])} disabled={blendTemplateIds.length === 0}>
              Clear
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {templates.map((t) => {
              const activeSel = blendTemplateIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setBlendTemplateIds((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]));
                  }}
                  title={t.description}
                  style={{
                    padding: 10,
                    textAlign: 'left',
                    borderRadius: 10,
                    border: `1px solid ${activeSel ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
                    background: activeSel ? 'rgba(255,255,255,0.06)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <strong style={{ fontSize: 12 }}>{t.name}</strong>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{activeSel ? '✓' : ''}</span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4, lineHeight: 1.2 }}>
                    {t.tags?.slice(0, 4).join(' · ')}
                  </div>
                </button>
              );
            })}
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
          {view === 'builder' && (
            <>
              <h4>Blocks</h4>

              {active?.blocks.map((b, i) => (
                <div key={b.id} style={{ border: '1px solid rgba(255,255,255,0.12)', padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={b.enabled}
                        onChange={(e) => {
                          const blocks = [...(active?.blocks ?? [])];
                          blocks[i] = { ...b, enabled: e.target.checked };
                          updateActive({ ...(active as PromptEntity), blocks, updated_at: Date.now() });
                        }}
                      />
                      <strong>{KIND_LABELS[b.kind]}</strong>
                    </label>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <select
                        value={b.kind}
                        onChange={(e) => {
                          const blocks = [...(active?.blocks ?? [])];
                          blocks[i] = { ...b, kind: e.target.value as PromptBlockKind };
                          updateActive({ ...(active as PromptEntity), blocks, updated_at: Date.now() });
                        }}
                      >
                        {Object.keys(KIND_LABELS).map((k) => (
                          <option key={k} value={k}>{KIND_LABELS[k as PromptBlockKind]}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const blocks = [...(active?.blocks ?? [])];
                          if (i > 0) {
                            [blocks[i - 1], blocks[i]] = [blocks[i], blocks[i - 1]];
                            updateActive({ ...(active as PromptEntity), blocks, updated_at: Date.now() });
                          }
                        }}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const blocks = [...(active?.blocks ?? [])];
                          if (i < blocks.length - 1) {
                            [blocks[i + 1], blocks[i]] = [blocks[i], blocks[i + 1]];
                            updateActive({ ...(active as PromptEntity), blocks, updated_at: Date.now() });
                          }
                        }}
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const blocks = (active?.blocks ?? []).filter((x) => x.id !== b.id);
                          updateActive({ ...(active as PromptEntity), blocks, updated_at: Date.now() });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={b.content}
                    onChange={(e) => {
                      const blocks = [...(active?.blocks ?? [])];
                      blocks[i] = { ...b, content: e.target.value };
                      updateActive({ ...(active as PromptEntity), blocks, updated_at: Date.now() });
                    }}
                    placeholder="Write block content…"
                    style={{ width: '100%', minHeight: 90, marginTop: 8 }}
                  />
                </div>
              ))}

              {active && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={newBlockKind} onChange={(e) => setNewBlockKind(e.target.value as PromptBlockKind)}>
                    {Object.keys(KIND_LABELS).map((k) => (
                      <option key={k} value={k}>{KIND_LABELS[k as PromptBlockKind]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => updateActive({ ...active, blocks: [...active.blocks, makeBlankBlock(newBlockKind)], updated_at: Date.now() })}
                  >
                    + Add block
                  </button>

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
            </>
          )}

          {view === 'templates' && (
            <>
              <h4>Templates</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <button type="button" onClick={createTemplateFromActive}>New template from active prompt</button>
                <button type="button" onClick={() => downloadJson('templates.json', pm.templates)}>Export templates</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12 }}>
                <div style={{ border: '1px solid rgba(255,255,255,0.12)', padding: 10 }}>
                  <strong>Template list</strong>
                  <div style={{ marginTop: 10 }}>
                    <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={{ width: '100%' }}>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    {templates.slice(0, 20).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={t.id === templateId ? 'step active' : 'step'}
                        onClick={() => setTemplateId(t.id)}
                        style={{ justifyContent: 'flex-start' }}
                        title={t.description}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTemplate ? (
                  <TemplateEditor
                    template={selectedTemplate}
                    onChange={updateTemplate}
                    onDelete={() => deleteTemplate(selectedTemplate.id)}
                  />
                ) : (
                  <p style={{ opacity: 0.75 }}>No templates found.</p>
                )}
              </div>
            </>
          )}

          {view === 'animation' && (
            <>
              <h4>Animation mode</h4>
              <p style={{ opacity: 0.75, marginTop: 6 }}>
                This generates frame-by-frame prompts by animating allowed schema paths over time (keyframes → curves → frames).
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={schema.MODULES.ANIMATION}
                    onChange={() => useOracleStore.getState().toggleModule('ANIMATION')}
                  />
                  <span>Enable ANIMATION module</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>preset</span>
                  <select value={animation.preset} onChange={(e) => set('ANIMATION.preset', e.target.value)}>
                    <option value="static">static</option>
                    <option value="pulse">pulse</option>
                    <option value="drift">drift</option>
                  </select>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>speed</span>
                  <input type="number" value={animation.speed} onChange={(e) => set('ANIMATION.speed', Number(e.target.value))} style={{ width: 90 }} />
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>frames</span>
                  <input type="number" value={animation.frame_count} onChange={(e) => set('ANIMATION.frame_count', Number(e.target.value))} style={{ width: 90 }} />
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>fps</span>
                  <input type="number" value={animation.fps} onChange={(e) => set('ANIMATION.fps', Number(e.target.value))} style={{ width: 90 }} />
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>duration</span>
                  <input type="number" step="0.25" value={animation.duration} onChange={(e) => set('ANIMATION.duration', Number(e.target.value))} style={{ width: 90 }} />
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>export</span>
                  <select value={animation.export_mode} onChange={(e) => set('ANIMATION.export_mode', e.target.value)}>
                    <option value="keyframes_only">keyframes_only</option>
                    <option value="all_frames">all_frames</option>
                    <option value="every_n">every_n</option>
                  </select>
                </label>

                {animation.export_mode === 'every_n' && (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span>every_n</span>
                    <input type="number" min={1} value={animation.every_n} onChange={(e) => set('ANIMATION.every_n', Number(e.target.value))} style={{ width: 90 }} />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <button type="button" onClick={() => downloadJson('timeline.json', exportTimelineJson(series))}>Export timeline.json</button>
                <button type="button" onClick={() => downloadText('frame_prompts.txt', exportFramePromptSheet(series))}>Export prompt sheet</button>
              </div>

              <h4 style={{ marginTop: 14 }}>Keyframes</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
                <button type="button" onClick={addKeyframe}>+ Add keyframe</button>
                <span style={{ opacity: 0.75, fontSize: 12 }}>
                  Curves are a JSON object mapping schema paths to values (e.g. <code>{'{"HALLUCINATION.drift": 45}'}</code>).
                </span>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {animation.keyframes.map((kf, idx) => (
                  <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.12)', padding: 10 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span>t</span>
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step="0.01"
                            value={kf.t}
                            onChange={(e) => {
                              const t = Number(e.target.value);
                              const next = [...animation.keyframes];
                              next[idx] = { ...kf, t };
                              setAnimKeyframes(next.sort((a, b) => a.t - b.t));
                            }}
                            style={{ width: 90 }}
                          />
                        </label>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span>state</span>
                          <input
                            value={kf.state ?? ''}
                            onChange={(e) => {
                              const next = [...animation.keyframes];
                              next[idx] = { ...kf, state: e.target.value || undefined };
                              setAnimKeyframes(next);
                            }}
                            style={{ width: 220 }}
                            placeholder="optional label"
                          />
                        </label>
                      </div>

                      <button type="button" onClick={() => deleteKeyframe(idx)}>Delete</button>
                    </div>

                    <label style={{ marginTop: 8 }}>
                      <span>curves (JSON)</span>
                      <textarea
                        value={JSON.stringify(kf.curves, null, 2)}
                        onChange={(e) => {
                          const next = [...animation.keyframes];
                          // keep as text until parse succeeds
                          try {
                            const obj = JSON.parse(e.target.value || '{}');
                            next[idx] = { ...kf, curves: obj };
                            setAnimKeyframes(next);
                          } catch {
                            // ignore parse errors while typing
                          }
                        }}
                        style={{ width: '100%', minHeight: 110 }}
                      />
                    </label>
                  </div>
                ))}
              </div>

              
              <h4 style={{ marginTop: 14 }}>Preview frames</h4>
              {series.status === 'animation_disabled' ? (
                <p style={{ opacity: 0.75 }}>Turn on the <strong>Animation</strong> module (above) to generate frames.</p>
              ) : series.frames.length === 0 ? (
                <p style={{ opacity: 0.75 }}>No frames generated (check export mode / keyframes).</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" onClick={() => setScrubIndex(0)} title="First frame">⟲</button>
                    <button
                      type="button"
                      onClick={() => setScrubIndex((v) => Math.max(0, v - 1))}
                      title="Previous frame"
                    >
                      ←
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPlaying((v) => !v)}
                      title="Play/Pause"
                      style={{ minWidth: 90 }}
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setScrubIndex((v) => Math.min(series.frames.length - 1, v + 1))}
                      title="Next frame"
                    >
                      →
                    </button>
                    <button type="button" onClick={() => setScrubIndex(series.frames.length - 1)} title="Last frame">⟳</button>

                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 6 }}>
                      <span style={{ opacity: 0.8 }}>frame</span>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, series.frames.length - 1)}
                        value={scrubIndex}
                        onChange={(e) => setScrubIndex(Number(e.target.value))}
                        style={{ width: 260 }}
                      />
                      <span style={{ width: 120, display: 'inline-block' }}>
                        {scrubIndex + 1} / {series.frames.length}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(series.frames[scrubIndex]?.compiledPrompt ?? '')}
                    >
                      Copy frame prompt
                    </button>
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                    t={series.frames[scrubIndex]?.t.toFixed(3)} · fps={animation.fps} · export={animation.export_mode}
                  </div>

                  <pre style={{ whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.12)', padding: 10, marginTop: 10 }}>
                    {series.frames[scrubIndex]?.compiledPrompt}
                  </pre>
                </>
              )}
            </>
          )}
        </div>

        <div>
          <OutputDock
            title={dockTitle}
            mode={pm.compile_mode as any}
            onMode={(m) => set('PROMPT_MANAGER.compile_mode', m)}
            compiled={dockCompiled}
            onCopy={() => navigator.clipboard.writeText(dockCompiled)}
            onDownloadTxt={() => downloadText('prompt.txt', dockCompiled)}
            onDownloadJson={() => {
              if (view === 'animation' && series.status === 'ok' && series.frames.length) {
                const f = series.frames[Math.max(0, Math.min(scrubIndex, series.frames.length - 1))];
                downloadJson('frame_prompt.json', f);
              } else {
                downloadJson('prompt_compiled.json', compiledManaged);
              }
            }}
            variations={variations}
            variationCount={variationCount}
            onVariationCount={(n) => setVariationCount(Number.isFinite(n) ? n : 6)}
            showVariations={showVariations}
            onToggleVariations={() => setShowVariations((v) => !v)}
            onCopyAllVariations={() => navigator.clipboard.writeText(variations.join('\n\n---\n\n'))}
          />
        </div>
      </div>
    </Panel>
  );
}
