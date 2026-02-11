import { HUMANIZER_QUALITIES } from '../models/schema';

export const DEFAULT_FORM = {
  mode: 'FULL',
  subject: '',
  notes: '',
  styleTokens: ['STYLE.HYPNAGOGIC', 'STYLE.OCCULT'],
  hallucination: 72,
  evolveEnabled: true,
  evolveSteps: 6,
  evolvePathPreset: 'drift',
  startH: 52,
  endH: 92,
  curve: 's-curve',
  mutateEnabled: true,
  mutateStrength: 45,
  mutateScope: 'total',
  mutateMode: 'recursive',
  mutateAnchor: 'gesture+material',
  lockCore: false,
  lockTexture: false,
  lockPalette: false,
  lockGesture: false,
  seed: 'oracle-v2-seed',
  batchCount: 1,
  batchPrefix: 'run',
  triptychAuto: false,
  triptychPanel1Name: 'STATE 1',
  triptychPanel1State: 'ANCHOR',
  triptychPanel1Path: 'collapse',
  triptychPanel1Steps: 5,
  triptychPanel2Name: 'STATE 2',
  triptychPanel2State: 'POROUS',
  triptychPanel2Path: 'drift',
  triptychPanel2Steps: 5,
  triptychPanel3Name: 'STATE 3',
  triptychPanel3State: 'WATCHER',
  triptychPanel3Path: 'fracture',
  triptychPanel3Steps: 5,
  humanizerLevel: 60,
  autoCopyCompiledPrompt: false,
  humanizerMin: 35,
  humanizerMax: 88,
  humanizerQualities: Object.fromEntries(HUMANIZER_QUALITIES.map(([key]) => [key, false])),
};

export const serializePreset = (form) => JSON.stringify(form, null, 2);

export const parsePreset = (text) => {
  const data = JSON.parse(text);
  return {
    ...DEFAULT_FORM,
    ...data,
    humanizerQualities: {
      ...DEFAULT_FORM.humanizerQualities,
      ...(data.humanizerQualities || {}),
    },
  };
};
