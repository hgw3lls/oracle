import { type SchemaV2, type EvolutionCurve } from '../schema/hypnagnosisSchemaV2';
import { migrateToV2 } from '../schema/migrateToV2';
import { STYLE_TOKENS } from '../models/schema';

type DebugSection = { title: string; text: string };

type CompilePromptV2Result = {
  compiledPrompt: string;
  debugSections: DebugSection[];
};

export type CompiledFrameV2 = {
  frameIndex: number;
  t: number;
  compiledPrompt: string;
  frameState: SchemaV2;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const hashSeed = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const jitterFromSeed = (seed: string, key: string, amplitude = 0.08) => {
  const h = hashSeed(`${seed}::${key}`);
  const u = ((h % 100000) / 100000) * 2 - 1;
  return u * amplitude;
};

const curveT = (t: number, curve: EvolutionCurve) => {
  const x = clamp01(t);
  if (curve === 'linear') return x;
  if (curve === 'exp') return x * x;
  return x * x * (3 - 2 * x);
};

const influenceBehaviors = (schema: SchemaV2) => {
  const mapped = schema.styleTokens.map((token) => STYLE_TOKENS[token] || token).join('; ');
  const behaviors = [
    schema.hallucination > 70 ? 'spray turbulence in peripheral textures' : 'controlled edge stability',
    schema.mutateEnabled ? `smear-and-redraw passes at strength ${schema.mutateStrength}` : 'minimal smear passes',
    schema.lockTexture ? 'collage texture held constant across iterations' : 'collage texture allowed to drift',
    schema.lockPalette ? 'network-map color graph fixed to anchor nodes' : 'network-map color graph can reroute',
    schema.styleTokens.includes('STYLE.OCCULT') ? 'occult geometry motifs threaded through symbols and spacing' : 'symbolic geometry kept sparse',
    schema.mode === 'PRINT' ? 'print material logic: registration drift, plate pressure, ink bleed boundaries' : 'print material logic used as subtle substrate',
  ];

  return {
    mapped,
    behaviors,
  };
};

const constraintsFooter = (schema: SchemaV2) => {
  const forbid = schema.constraints.forbid.length ? `FORBID: ${schema.constraints.forbid.join('; ')}` : null;
  const require = schema.constraints.require.length ? `REQUIRE: ${schema.constraints.require.join('; ')}` : null;
  if (!forbid && !require) return '';
  return ['CONSTRAINTS FOOTER', require, forbid].filter(Boolean).join('\n');
};

const paletteFooter = (schema: SchemaV2) => [
  'PALETTE FOOTER',
  schema.lockPalette ? 'palette-lock=enabled' : 'palette-lock=disabled',
  `style-token-count=${schema.styleTokens.length}`,
].join('\n');

const appendIfEnabled = (
  enabled: boolean,
  lines: Array<string | null>,
  line: string | null,
) => {
  if (enabled) {
    lines.push(line);
  }
};

export const compilePromptV2 = (schemaInput: SchemaV2, frameOverrides: Partial<SchemaV2> = {}): CompilePromptV2Result => {
  const schema = migrateToV2({ ...schemaInput, ...frameOverrides });
  const influence = influenceBehaviors(schema);

  const seedJitter = jitterFromSeed(schema.seed, `${schema.subject}:${schema.hallucination}`);
  const hallucinationBias = Math.round((schema.hallucination + seedJitter * 100) * 10) / 10;

  const modules = schema.MODULES;
  const sections: DebugSection[] = [];

  if (modules.INPUT) {
    sections.push({
      title: 'INPUT',
      text: [
        `mode=${schema.mode}`,
        `subject=${schema.subject || '(empty subject)'}`,
        `seed=${schema.seed}`,
        `hallucination=${hallucinationBias}`,
      ].join('\n'),
    });
  }

  if (modules.INFLUENCE_ENGINE) {
    sections.push({
      title: 'INFLUENCE TRANSLATION',
      text: [
        `token-influences=${influence.mapped || 'none'}`,
        ...influence.behaviors.map((b, i) => `behavior-${i + 1}=${b}`),
      ].join('\n'),
    });
  }

  if (modules.HYPNA_MATRIX) {
    sections.push({
      title: 'EVOLUTION',
      text: [
        `enabled=${schema.evolveEnabled}`,
        `steps=${schema.evolveSteps}`,
        `curve=${schema.curve}`,
        `range=${schema.startH}->${schema.endH}`,
      ].join('\n'),
    });
  }

  if (modules.PROMPT_GENOME) {
    sections.push({
      title: 'HUMANIZER',
      text: `level=${schema.humanizerLevel}\nrange=${schema.humanizerMin}-${schema.humanizerMax}`,
    });
  }

  const footer = modules.CONSTRAINTS ? constraintsFooter(schema) : '';
  const palette = modules.PALETTE ? paletteFooter(schema) : '';
  const compiledLines: Array<string | null> = [
    'HYPNAGNOSIS PROMPT V2',
    modules.INPUT ? `Subject: ${schema.subject || 'Unnamed subject'}` : null,
  ];

  appendIfEnabled(
    modules.INFLUENCE_ENGINE,
    compiledLines,
    `Render intent: ${influence.behaviors.join('; ')}.`,
  );

  appendIfEnabled(
    modules.HYPNA_MATRIX,
    compiledLines,
    `Evolution path: ${schema.evolvePathPreset}, curve=${schema.curve}, hallucination-range=${schema.startH}-${schema.endH}.`,
  );

  appendIfEnabled(
    modules.PROMPT_GENOME,
    compiledLines,
    `Humanization: level ${schema.humanizerLevel}, min/max ${schema.humanizerMin}/${schema.humanizerMax}.`,
  );

  compiledLines.push(schema.notes ? `Notes: ${schema.notes}` : null);
  compiledLines.push(palette || null);
  compiledLines.push(footer || null);

  const moduleNames = Object.keys(modules) as Array<keyof SchemaV2['MODULES']>;
  const includedModules = moduleNames.filter((name) => modules[name]);
  const skippedModules = moduleNames.filter((name) => !modules[name]);

  const debugSections: DebugSection[] = [
    {
      title: 'MODULES',
      text: [
        `included=${includedModules.join(', ') || '(none)'}`,
        `skipped=${skippedModules.join(', ') || '(none)'}`,
      ].join('\n'),
    },
    ...sections,
  ];

  if (palette) {
    debugSections.push({ title: 'PALETTE FOOTER', text: palette });
  }
  if (footer) {
    debugSections.push({ title: 'CONSTRAINTS FOOTER', text: footer });
  }

  return {
    compiledPrompt: compiledLines.filter(Boolean).join('\n'),
    debugSections,
  };
};

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const interpolateBetween = (a: number, b: number, t: number, curve: EvolutionCurve) => a + (b - a) * curveT(t, curve);

const interpolateTimeline = (schema: SchemaV2, t: number) => {
  const points = [...schema.animation.timeline]
    .map((p) => ({ ...p, at: clamp01(p.at) }))
    .sort((x, y) => x.at - y.at);
  if (!points.length) return {} as Partial<SchemaV2>;

  const keys = Array.from(new Set(points.flatMap((p) => Object.keys(p.overrides))));
  const overrides: Partial<SchemaV2> = {};

  keys.forEach((key) => {
    const snapshots = points
      .filter((p) => (p.overrides as Record<string, unknown>)[key] !== undefined)
      .map((p) => ({ at: p.at, value: (p.overrides as Record<string, unknown>)[key] }));

    if (!snapshots.length) return;

    const prev = [...snapshots].reverse().find((s) => s.at <= t) || snapshots[0];
    const next = snapshots.find((s) => s.at >= t) || snapshots[snapshots.length - 1];

    if (isNumber(prev.value) && isNumber(next.value)) {
      const span = Math.max(1e-9, next.at - prev.at);
      const localT = clamp01((t - prev.at) / span);
      (overrides as Record<string, unknown>)[key] = interpolateBetween(prev.value, next.value, localT, schema.animation.curve);
    } else {
      (overrides as Record<string, unknown>)[key] = t < next.at ? prev.value : next.value;
    }
  });

  return overrides;
};

export const compileFrameSeries = (schemaInput: SchemaV2): CompiledFrameV2[] => {
  const schema = migrateToV2(schemaInput);
  const frameCount = schema.animation.enabled ? Math.max(1, Math.floor(schema.animation.frames)) : 1;

  return Array.from({ length: frameCount }, (_, frameIndex) => {
    const t = frameCount <= 1 ? 0 : frameIndex / (frameCount - 1);
    const timelineOverrides = interpolateTimeline(schema, t);
    const ramp = interpolateBetween(schema.startH, schema.endH, t, schema.curve);
    const frameOverrides: Partial<SchemaV2> = {
      ...timelineOverrides,
      hallucination: isNumber((timelineOverrides as Record<string, unknown>).hallucination)
        ? Number((timelineOverrides as Record<string, unknown>).hallucination)
        : ramp,
    };

    const frameState = migrateToV2({ ...schema, ...frameOverrides });
    const { compiledPrompt } = compilePromptV2(frameState);

    return {
      frameIndex,
      t,
      compiledPrompt,
      frameState,
    };
  });
};
