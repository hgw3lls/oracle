import { defaultSchemaV2, type SchemaV2, type AnimationTimelinePoint } from './hypnagnosisSchemaV2';

type UnknownRecord = Record<string, unknown>;

const asObject = (value: unknown): UnknownRecord => (typeof value === 'object' && value !== null ? value as UnknownRecord : {});
const asString = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);
const asBoolean = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
const asNumber = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
const asStringArray = (value: unknown, fallback: string[]) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback);


const asKeyframes = (value: unknown): SchemaV2['animation']['keyframes'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asObject(item))
    .map((item) => ({
      t: asNumber(item.t, 0),
      state: typeof item.state === 'string' ? item.state : undefined,
      curves: asObject(item.curves) as Record<string, number | string>,
    }))
    .filter((item) => item.t >= 0 && item.t <= 1);
};
const asTimeline = (value: unknown): AnimationTimelinePoint[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asObject(item))
    .map((item) => ({
      at: asNumber(item.at, 0),
      overrides: asObject(item.overrides) as Partial<SchemaV2>,
    }))
    .filter((item) => item.at >= 0 && item.at <= 1);
};

export const migrateToV2 = (input: unknown): SchemaV2 => {
  const source = asObject(input);
  const autoEvolve = asObject(source.autoEvolve);
  const humanizerRange = asObject(source.humanizerRange);
  const humanizer = asObject(source.humanizer);
  const triptych = asObject(source.triptych);
  const constraints = asObject(source.constraints ?? source.CONSTRAINTS);
  const animation = asObject(source.animation ?? source.ANIMATION);
  const panels = Array.isArray(triptych.panels) ? triptych.panels.map(asObject) : [];

  const panel1 = panels[0] || {};
  const panel2 = panels[1] || {};
  const panel3 = panels[2] || {};

  return {
    ...defaultSchemaV2,
    ...source,
    schemaVersion: 2,
    mode: asString(source.mode, defaultSchemaV2.mode) as SchemaV2['mode'],
    subject: asString(source.subject, defaultSchemaV2.subject),
    notes: asString(source.notes, defaultSchemaV2.notes),
    styleTokens: asStringArray(source.styleTokens, defaultSchemaV2.styleTokens),
    hallucination: asNumber(source.hallucination, defaultSchemaV2.hallucination),
    evolveEnabled: asBoolean(source.evolveEnabled ?? autoEvolve.enabled, defaultSchemaV2.evolveEnabled),
    evolveSteps: asNumber(source.evolveSteps ?? autoEvolve.steps, defaultSchemaV2.evolveSteps),
    evolvePathPreset: asString(source.evolvePathPreset ?? source.flow, defaultSchemaV2.evolvePathPreset),
    startH: asNumber(source.startH ?? source.startHallucination ?? source['start-h'], defaultSchemaV2.startH),
    endH: asNumber(source.endH ?? source.endHallucination ?? source['end-h'], defaultSchemaV2.endH),
    curve: asString(source.curve ?? autoEvolve.curve, defaultSchemaV2.curve) as SchemaV2['curve'],
    mutateEnabled: asBoolean(source.mutateEnabled, defaultSchemaV2.mutateEnabled),
    mutateStrength: asNumber(source.mutateStrength ?? source['mutation-strength'], defaultSchemaV2.mutateStrength),
    mutateScope: asString(source.mutateScope, defaultSchemaV2.mutateScope),
    mutateMode: asString(source.mutateMode, defaultSchemaV2.mutateMode),
    mutateAnchor: asString(source.mutateAnchor, defaultSchemaV2.mutateAnchor),
    lockCore: asBoolean(source.lockCore, defaultSchemaV2.lockCore),
    lockTexture: asBoolean(source.lockTexture, defaultSchemaV2.lockTexture),
    lockPalette: asBoolean(source.lockPalette, defaultSchemaV2.lockPalette),
    lockGesture: asBoolean(source.lockGesture, defaultSchemaV2.lockGesture),
    seed: asString(source.seed, defaultSchemaV2.seed),
    batchCount: asNumber(source.batchCount, defaultSchemaV2.batchCount),
    batchPrefix: asString(source.batchPrefix, defaultSchemaV2.batchPrefix),
    triptychAuto: asBoolean(source.triptychAuto, defaultSchemaV2.triptychAuto),
    triptychPanel1Name: asString(source.triptychPanel1Name ?? panel1.panelName, defaultSchemaV2.triptychPanel1Name),
    triptychPanel1State: asString(source.triptychPanel1State ?? panel1.stateName, defaultSchemaV2.triptychPanel1State),
    triptychPanel1Path: asString(source.triptychPanel1Path ?? panel1.pathPreset, defaultSchemaV2.triptychPanel1Path),
    triptychPanel1Steps: asNumber(source.triptychPanel1Steps ?? panel1.steps, defaultSchemaV2.triptychPanel1Steps),
    triptychPanel2Name: asString(source.triptychPanel2Name ?? panel2.panelName, defaultSchemaV2.triptychPanel2Name),
    triptychPanel2State: asString(source.triptychPanel2State ?? panel2.stateName, defaultSchemaV2.triptychPanel2State),
    triptychPanel2Path: asString(source.triptychPanel2Path ?? panel2.pathPreset, defaultSchemaV2.triptychPanel2Path),
    triptychPanel2Steps: asNumber(source.triptychPanel2Steps ?? panel2.steps, defaultSchemaV2.triptychPanel2Steps),
    triptychPanel3Name: asString(source.triptychPanel3Name ?? panel3.panelName, defaultSchemaV2.triptychPanel3Name),
    triptychPanel3State: asString(source.triptychPanel3State ?? panel3.stateName, defaultSchemaV2.triptychPanel3State),
    triptychPanel3Path: asString(source.triptychPanel3Path ?? panel3.pathPreset, defaultSchemaV2.triptychPanel3Path),
    triptychPanel3Steps: asNumber(source.triptychPanel3Steps ?? panel3.steps, defaultSchemaV2.triptychPanel3Steps),
    humanizerLevel: asNumber(source.humanizerLevel ?? humanizer['level(0-100)'], defaultSchemaV2.humanizerLevel),
    autoCopyCompiledPrompt: asBoolean(source.autoCopyCompiledPrompt, defaultSchemaV2.autoCopyCompiledPrompt),
    humanizerMin: asNumber(source.humanizerMin ?? humanizerRange.min, defaultSchemaV2.humanizerMin),
    humanizerMax: asNumber(source.humanizerMax ?? humanizerRange.max, defaultSchemaV2.humanizerMax),
    humanizerQualities: {
      ...defaultSchemaV2.humanizerQualities,
      ...asObject(source.humanizerQualities),
    },
    constraints: {
      forbid: asStringArray(constraints.forbid, defaultSchemaV2.constraints.forbid),
      require: asStringArray(constraints.require, defaultSchemaV2.constraints.require),
    },
    animation: {
      enabled: asBoolean(animation.enabled, defaultSchemaV2.animation.enabled),
      frames: asNumber(animation.frames, defaultSchemaV2.animation.frames),
      curve: asString(animation.curve, defaultSchemaV2.animation.curve) as SchemaV2['animation']['curve'],
      timeline: asTimeline(animation.timeline),
      keyframes: asKeyframes(animation.keyframes),
    },
  };
};
