# Hypnagnosis Oracle v2

Schema V2 is now the **single source of truth** for the web app.

## Architecture

- `src/schema/schemaV2.ts`: canonical Schema V2 types and module map.
- `src/schema/defaults.ts`: `defaultSchemaV2()` baseline document.
- `src/schema/validate.ts`: lightweight runtime validation (ranges, enums, palette plate limits/hex).
- `src/state/store.ts`: Zustand store holding `schema: SchemaV2` and actions:
  - `set(path, value)`
  - `merge(partial)`
  - `toggleModule(moduleKey)`
  - `resetToDefaults()`
  - `importSchema(json)`
- `src/ui/*`: brutalist shell with module disable toggles in Modules panel and Wizard step headers.

## State management choice

Zustand is used for this phase because it keeps Schema V2 orchestration small and direct while preserving strict TypeScript control over the schema document.

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Test

```bash
npm run test
```

Included tests cover module toggle defaults, preserve-state behavior, and validator range checks.
