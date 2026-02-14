import { create } from 'zustand';
import type { ModuleKey, SchemaV3 } from '@/core/schema/schemaV2';
import { defaultSchemaV2 } from '@/core/schema/defaults';
import { compilePromptV3 } from '@/core/engine/compilePromptV3';
import { deepMerge } from '@/shared/utils/deepMerge';
import { pathSet } from '@/shared/utils/path';
import { migrateToV2 } from '@/core/schema/migrate';

type OracleState = {  currentStep: number;
  schema: SchemaV3;
  prompt: string;
  warnings: string[];
  batchId: string;
  seedString: string;  setStep: (step: number) => void;
  set: (path: string, value: unknown) => void;
  merge: (partial: Partial<SchemaV3>) => void;
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

export const useOracleStore = create<OracleState>((set) => ({  currentStep: 0,
  schema: initial,
  prompt: compilePromptV3(initial).compiledPrompt,
  warnings: compilePromptV3(initial).warnings,
  batchId: 'run-001',
  seedString: 'oracle-v2-seed::run-001',  setStep: (currentStep) => set({ currentStep }),
  set: (path, value) =>
    set((state) => {
      const schema = pathSet(state.schema as Record<string, unknown>, path, value) as SchemaV3;
      const compiled = compilePromptV3(schema);
      return { schema, prompt: compiled.compiledPrompt, warnings: compiled.warnings };
    }),
  merge: (partial) =>
    set((state) => {
      const schema = deepMerge(state.schema as Record<string, unknown>, partial as Record<string, unknown>) as SchemaV3;
      const compiled = compilePromptV3(schema);
      return { schema, prompt: compiled.compiledPrompt, warnings: compiled.warnings };
    }),
  toggleModule: (key) =>
    set((state) => {
      const schema = {
        ...state.schema,
        MODULES: { ...state.schema.MODULES, [key]: !state.schema.MODULES[key] },
      };
      const compiled = compilePromptV3(schema);
      return { schema, prompt: compiled.compiledPrompt, warnings: compiled.warnings };
    }),
  resetToDefaults: () => {
    const schema = defaultSchemaV2();
    const compiled = compilePromptV3(schema);
    set({ schema, prompt: compiled.compiledPrompt, warnings: compiled.warnings });
  },
  newRun: () => {
    const batchId = makeRunId();
    const seedString = makeSeedString(batchId);
    const schema = defaultSchemaV2();
    schema.PROMPT_GENOME.seed = makeSeedNumber();
    const compiled = compilePromptV3(schema);
    set({ batchId, seedString, schema, prompt: compiled.compiledPrompt, warnings: compiled.warnings, currentStep: 0, tab: 'wizard' });
  },
  importSchema: (json) => {
    const schema = migrateToV2(json);
    const compiled = compilePromptV3(schema);
    set({ schema, prompt: compiled.compiledPrompt, warnings: compiled.warnings });
  },
  recompile: () =>
    set((state) => {
      const compiled = compilePromptV3(state.schema);
      return { prompt: compiled.compiledPrompt, warnings: compiled.warnings };
    }),
}));

export type { OracleState, Tab };
