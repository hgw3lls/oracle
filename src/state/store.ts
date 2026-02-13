import { create } from 'zustand';
import type { ModuleKey, SchemaV2 } from '../schema/schemaV2';
import { defaultSchemaV2 } from '../schema/defaults';
import { compilePromptV2 } from '../engine/compilePromptV2';
import { deepMerge } from '../utils/deepMerge';
import { pathSet } from '../utils/path';
import { migrateToV2 } from '../schema/migrate';

type Tab = 'wizard' | 'live' | 'frames' | 'presets';

type OracleState = {
  tab: Tab;
  currentStep: number;
  schema: SchemaV2;
  prompt: string;
  batchId: string;
  seedString: string;
  setTab: (tab: Tab) => void;
  setStep: (step: number) => void;
  set: (path: string, value: unknown) => void;
  merge: (partial: Partial<SchemaV2>) => void;
  toggleModule: (key: ModuleKey) => void;
  resetToDefaults: () => void;
  newRun: () => void;
  importSchema: (json: unknown) => void;
  recompile: () => void;
};

const initial = defaultSchemaV2();

function makeRunId() {
  return `run-${Date.now().toString(36)}`;
}

function makeSeedString(batchId: string) {
  return `oracle-v2-seed::${batchId}`;
}

function makeSeedNumber() {
  return Math.floor(Math.random() * 1_000_000);
}

export const useOracleStore = create<OracleState>((set) => ({
  tab: 'wizard',
  currentStep: 0,
  schema: initial,
  prompt: compilePromptV2(initial).compiledPrompt,
  batchId: 'run-001',
  seedString: 'oracle-v2-seed::run-001',
  setTab: (tab) => set({ tab }),
  setStep: (currentStep) => set({ currentStep }),
  set: (path, value) =>
    set((state) => {
      const schema = pathSet(state.schema as Record<string, unknown>, path, value) as SchemaV2;
      return { schema, prompt: compilePromptV2(schema).compiledPrompt };
    }),
  merge: (partial) =>
    set((state) => {
      const schema = deepMerge(state.schema as Record<string, unknown>, partial as Record<string, unknown>) as SchemaV2;
      return { schema, prompt: compilePromptV2(schema).compiledPrompt };
    }),
  toggleModule: (key) =>
    set((state) => {
      const schema = {
        ...state.schema,
        MODULES: { ...state.schema.MODULES, [key]: !state.schema.MODULES[key] },
      };
      return { schema, prompt: compilePromptV2(schema).compiledPrompt };
    }),
  resetToDefaults: () => {
    const schema = defaultSchemaV2();
    set({ schema, prompt: compilePromptV2(schema).compiledPrompt });
  },
  newRun: () => {
    const batchId = makeRunId();
    const seedString = makeSeedString(batchId);
    const schema = defaultSchemaV2();
    schema.PROMPT_GENOME.seed = makeSeedNumber();
    set({ batchId, seedString, schema, prompt: compilePromptV2(schema).compiledPrompt, currentStep: 0, tab: 'wizard' });
  },
  importSchema: (json) => {
    const schema = migrateToV2(json);
    set({ schema, prompt: compilePromptV2(schema).compiledPrompt });
  },
  recompile: () => set((state) => ({ prompt: compilePromptV2(state.schema).compiledPrompt })),
}));

export type { OracleState, Tab };
