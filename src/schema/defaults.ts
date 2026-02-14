import type { SchemaV2 } from './schemaV2';

export const defaultSchemaV2 = (): SchemaV2 => ({
  version: 3,
  MODULES: {
    INPUT: true,
    STATE_MAP: true,
    HALLUCINATION: true,
    HYPNA_MATRIX: true,
    PROMPT_GENOME: true,
    VISUAL_GRAMMAR: true,
    INFLUENCE_ENGINE: true,
    PALETTE: true,
    CONSTRAINTS: true,
    ANIMATION: false,
  },
  IGNORE_RULES: {
    hard_disable: true,
    preserve_state: true,
  },
  INPUT: {
    subject: 'Monumental surreal portrait',
    medium: 'analog photo',
    notes: 'stillness, concrete, breath',
  },
  STATE_MAP: {
    primary_state: 'ritual calm',
    secondary_state: 'anticipation',
    intensity: 70,
  },
  HALLUCINATION: {
    profile: 'light geometry drift',
    drift: 45,
  },
  HYPNA_MATRIX: {
    axis_x: 'memory',
    axis_y: 'symbol',
    depth: 65,
  },
  PROMPT_GENOME: {
    prefix: 'HYPNAGNOSIS ORACLE V3',
    structure: 'single subject, 3-part spatial read, one focal rupture',
    perception: 'parallax drift, peripheral noise, tactile depth cues',
    style_tokens: ['brutalist', 'high-contrast', 'film-grain'],
    suffix: 'avoid cheerful palette',
    seed: 42,
  },
  VISUAL_GRAMMAR: {
    framing: 'portrait',
    lens: 'normal',
    detail: 75,
  },
  INFLUENCE_ENGINE: {
    weights: {
      inkSpray: 55,
      meatBrush: 38,
      collageBreak: 52,
      networkMap: 60,
      occultDiagram: 44,
      graphicNovel: 50,
      printMaterial: 66,
      handDrawn: 58,
    },
    behavior: {
      density: 70,
      turbulence: 48,
    },
  },
  PALETTE: {
    mode: 'DESCRIPTIVE',
    lock_palette: false,
    riso_plates: [
      { hex: '#1f1f1f', role: 'keyline', opacity: 100, misregistration: 2 },
      { hex: '#f3f3ef', role: 'highlight', opacity: 82, misregistration: 1 },
    ],
    descriptive: 'graphite, bone white, silver',
    descriptive_keywords: ['graphite', 'bone', 'silver'],
    image_extract: {
      enabled: false,
      max_colors: 4,
      method: 'kmeans',
      extracted: [],
    },
    color_wheel: {
      base_hex: '#6a5cff',
      scheme: 'triadic',
      count: 4,
      rotate_deg: 0,
      generated: [],
    },
  },
  CONSTRAINTS: {
    max_tokens: 220,
    avoid: 'oversaturated colors, cartoon style',
    safety_level: 80,
  },
  ANIMATION: {
    preset: 'pulse',
    speed: 40,
    frame_count: 12,
    fps: 12,
    duration: 2,
    export_mode: 'all_frames',
    every_n: 2,
    keyframes: [
      { t: 0, curves: { 'HALLUCINATION.drift': 20, 'PALETTE.color_wheel.rotate_deg': 0 }, state: 'cold-open' },
      { t: 1, curves: { 'HALLUCINATION.drift': 70, 'PALETTE.color_wheel.rotate_deg': 180 }, state: 'crescendo' },
    ],
  },
  PROMPT_MANAGER: {
    enabled: true,
    active_prompt_id: 'prompt-001',
    compile_mode: 'BALANCED',
    style_packs: [
      { id: 'sp-newriso', name: 'Newriso', tags: ['riso', 'limited-palette', 'misregistration'], snippet: 'Style tokens: Newriso; limited palette, flat ink fields, visible overprint overlaps, slight misregistration, no gradients.', created_at: Date.now() },
      { id: 'sp-blkout', name: 'blkout-style', tags: ['erasure', 'blackout', 'found-text'], snippet: 'Found page substrate, heavy blackout/redaction, gestural marks, selective word isolation, high-contrast monochrome with occasional limited color fields.', created_at: Date.now() },
    ],
    templates: [
      {
        id: 'tpl-portrait-diagram',
        name: 'Portrait Occult Diagram',
        description: 'Portrait frame, diagrammatic, asymmetrical, riso plates.',
        tags: ['portrait', 'diagram', 'riso'],
        created_at: Date.now(),
        blocks: [
          { id: 'b-core', kind: 'CORE', enabled: true, content: 'Perception physics: astral projection weird totem of unreal figures; parallax drift, peripheral noise, tactile depth cues; matrix(memory/symbol) depth=65.' },
          { id: 'b-process', kind: 'PROCESS', enabled: true, content: 'Actions: trace hesitant hand-drawn contours and corrections; graft torn collage seams and fracture edges; overprint riso/gelli/screen textures with plate drift.' },
          { id: 'b-output', kind: 'OUTPUT_SPEC', enabled: true, content: 'Diagram: portrait frame, normal lens; clean white ground; colors only in the lines; more diagrammatic, less symmetrical.' },
          { id: 'b-neg', kind: 'NEGATIVES', enabled: true, content: 'Constraints: limited palette, flat ink fields, visible overprint overlaps, slight misregistration, no gradients; avoid cheerful palette.' },
        ],
      },
    ],
    prompts: [
      {
        id: 'prompt-001',
        name: 'Active Prompt',
        description: 'Block-based prompt (editable).',
        tags: ['active'],
        created_at: Date.now(),
        updated_at: Date.now(),
        blocks: [
          { id: 'p-core', kind: 'CORE', enabled: true, content: 'Subject / intent: Monumental surreal portrait; hypnagogic hallucination physics; drift=45; matrix(memory/symbol) depth=65.' },
          { id: 'p-style', kind: 'STYLE_PACKS', enabled: true, content: 'Style tokens: brutalist, high-contrast, film-grain. (Optionally apply a style pack.)' },
          { id: 'p-palette', kind: 'PALETTE_PACK', enabled: true, content: 'Palette: use extracted or locked plates if set; otherwise descriptive graphite/bone white/silver.' },
          { id: 'p-process', kind: 'PROCESS', enabled: true, content: 'Process: hesitant hand-drawn contours + corrections; torn collage seams; plate drift overprint.' },
          { id: 'p-constraints', kind: 'CONSTRAINTS', enabled: true, content: 'Constraints: limited palette, flat ink fields, visible overprint overlaps, slight misregistration, no gradients.' },
          { id: 'p-neg', kind: 'NEGATIVES', enabled: true, content: 'Avoid: cheerful palette, oversaturated colors, cartoon style.' },
        ],
      },
    ],
    history: [],
  },
});
