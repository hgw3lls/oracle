export const MODULE_KEYS = [
  'INPUT',
  'STATE_MAP',
  'HALLUCINATION',
  'HYPNA_MATRIX',
  'PROMPT_GENOME',
  'VISUAL_GRAMMAR',
  'INFLUENCE_ENGINE',
  'PALETTE',
  'CONSTRAINTS',
  'ANIMATION',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];
export type ModulesBlock = Record<ModuleKey, boolean>;

export type IgnoreRules = {
  hard_disable: true;
  preserve_state: true;
};

export type InputBlock = {
  subject: string;
  medium: string;
  notes: string;
};

export type StateMapBlock = {
  primary_state: string;
  secondary_state: string;
  intensity: number;
};

export type HallucinationBlock = {
  profile: string;
  drift: number;
};

export type HypnaMatrixBlock = {
  axis_x: string;
  axis_y: string;
  depth: number;
};

export type PromptGenomeBlock = {
  prefix: string;
  structure: string;
  perception: string;
  style_tokens: string[];
  suffix: string;
  seed: number;
};

export type VisualGrammarBlock = {
  framing: 'portrait' | 'landscape' | 'square';
  lens: 'wide' | 'normal' | 'tele';
  detail: number;
};

export type InfluenceEngineBlock = {
  weights: {
    inkSpray: number;
    meatBrush: number;
    collageBreak: number;
    networkMap: number;
    occultDiagram: number;
    graphicNovel: number;
    printMaterial: number;
    handDrawn: number;
  };
  behavior: {
    density: number;
    turbulence: number;
  };
};

export type PaletteMode = 'RISO_PLATES' | 'DESCRIPTIVE' | 'IMAGE_EXTRACT' | 'COLOR_WHEEL';
export type Harmony = 'complementary' | 'analogous' | 'triadic' | 'split_complementary' | 'tetradic' | 'monochrome';
export type PlateRole = 'keyline' | 'shadow' | 'midtone' | 'highlight' | 'accent';

export type PaletteSwatch = {
  hex: string;
  weight: number;
};

export type RisoPlate = {
  hex: string;
  role: PlateRole;
  opacity: number;
  misregistration: number;
};

export type PaletteBlock = {
  mode: PaletteMode;
  lock_palette: boolean;
  riso_plates: RisoPlate[];
  descriptive: string;
  descriptive_keywords: string[];
  image_extract: {
    enabled: boolean;
    max_colors: number;
    method: 'kmeans' | 'median_cut';
    extracted: PaletteSwatch[];
  };
  color_wheel: {
    base_hex: string;
    scheme: Harmony;
    count: number;
    rotate_deg: number;
    generated: PaletteSwatch[];
  };
};

export type ConstraintsBlock = {
  max_tokens: number;
  avoid: string;
  safety_level: number;
};

export type AnimationCurveValue = number | string;
export type AnimationKeyframe = {
  t: number;
  curves: Record<string, AnimationCurveValue>;
  state?: string;
};

export type AnimationBlock = {
  preset: 'static' | 'pulse' | 'drift';
  speed: number;
  frame_count: number;
  fps: number;
  duration: number;
  export_mode: 'keyframes_only' | 'all_frames' | 'every_n';
  every_n: number;
  keyframes: AnimationKeyframe[];
};

export type PromptCompileMode = 'MINIMAL' | 'BALANCED' | 'MAX_CONTROL';

export type PromptBlockKind =
  | 'CORE'
  | 'STYLE_PACKS'
  | 'PALETTE_PACK'
  | 'CONSTRAINTS'
  | 'PROCESS'
  | 'OUTPUT_SPEC'
  | 'NEGATIVES';

export type PromptBlock = {
  id: string;
  kind: PromptBlockKind;
  enabled: boolean;
  content: string;
};

export type PromptEntity = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  blocks: PromptBlock[];
  created_at: number;
  updated_at: number;
};

export type PromptSnapshot = {
  id: string;
  prompt_id: string;
  name: string;
  compiled: string;
  created_at: number;
  // A lightweight record of what was compiled (for diff / recall)
  blocks: PromptBlock[];
  warnings: string[];
};

export type StylePack = {
  id: string;
  name: string;
  tags: string[];
  snippet: string;
  created_at: number;
  updated_at?: number;
};

export type TemplateEntity = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  blocks: PromptBlock[];
  created_at: number;
  updated_at?: number;
};

export type PromptManagerBlock = {
  enabled: boolean;
  active_prompt_id: string;
  compile_mode: PromptCompileMode;
  prompts: PromptEntity[];
  templates: TemplateEntity[];
  style_packs: StylePack[];
  history: PromptSnapshot[];
};

export type SchemaV3 = {
  version: 3;
  MODULES: ModulesBlock;
  IGNORE_RULES: IgnoreRules;
  INPUT: InputBlock;
  STATE_MAP: StateMapBlock;
  HALLUCINATION: HallucinationBlock;
  HYPNA_MATRIX: HypnaMatrixBlock;
  PROMPT_GENOME: PromptGenomeBlock;
  VISUAL_GRAMMAR: VisualGrammarBlock;
  INFLUENCE_ENGINE: InfluenceEngineBlock;
  PALETTE: PaletteBlock;
  CONSTRAINTS: ConstraintsBlock;
  ANIMATION: AnimationBlock;
  PROMPT_MANAGER: PromptManagerBlock;
};

// Back-compat alias (most of the app can treat SchemaV3 as the schema type)
export type SchemaV2 = SchemaV3;
