import type { SchemaV2 } from './schemaV2';

export const defaultSchemaV2 = (): SchemaV2 => ({
  version: 2,
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
    prefix: 'HYPNAGNOSIS ORACLE V2',
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
});
