# Hypnagnosis Oracle v2

Schema V2 is the **single source of truth** for the web app.

## Wizard-first UX

The default interface is the **Wizard**:
- left column: step list + global module toggles,
- center column: current step content,
- right column: live compiled prompt preview.

Tabs for **Live / Frames / Presets** remain available for focused workflows.

## Schema v2 overview

Primary schema blocks in `src/schema/schemaV2.ts`:
- `MODULES` + `IGNORE_RULES`
- `INPUT`
- `STATE_MAP`
- `HALLUCINATION`
- `HYPNA_MATRIX`
- `PROMPT_GENOME`
- `VISUAL_GRAMMAR`
- `INFLUENCE_ENGINE`
- `PALETTE`
- `CONSTRAINTS`
- `ANIMATION`

`defaultSchemaV2()` in `src/schema/defaults.ts` provides the canonical initial document.

## How module toggles work

- Every subsystem can be enabled/disabled from **ModulesPanel** or per-step in the Wizard header.
- Disabled modules are omitted from `compilePromptV2` output and from downstream derived logic.
- `IGNORE_RULES.hard_disable=true` means disabled modules do not influence prompt generation or animation interpolation.
- **Minimal Mode** button in ModulesPanel disables everything except `INPUT`, `PROMPT_GENOME`, and `CONSTRAINTS` (with optional `PALETTE`).

## How to export prompt sheets

1. Go to the **Frames** tab.
2. Configure animation in the **Animation** wizard step (fps/duration/export mode/keyframes).
3. In **Frame Series** panel:
   - click **Export timeline JSON** for full frame metadata,
   - click **Export frame prompt sheet (.txt)** for plain-text prompt sheets.

## Architecture

- `src/schema/*`: schema, defaults, validation, migration.
- `src/state/*`: Zustand store + persistence.
- `src/engine/*`: compile, influences, constraints, animation, palette.
- `src/ui/*`: shell, panels, wizard and steps.
- `src/styles/*`: brutalist tokens and base styles.

## State management choice

Zustand keeps Schema V2 orchestration compact and type-safe while avoiding Redux boilerplate.

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
## Project structure (refactor)

- `src/app/` – app entry + root component
- `src/core/` – state, schema, prompt engines (pure logic)
- `src/features/` – user-facing screens/panels (Wizard, Manager, Live, etc.)
- `src/shared/` – reusable UI/layout, styles, and utilities
- `src/test/` – test setup

### Path aliases

Use `@/` for imports from `src/` (configured in `tsconfig.json` + `vite.config.js`).

Example:

```ts
import { useOracleStore } from '@/core/state/store';
import { Shell } from '@/shared/layout/Shell';
```
