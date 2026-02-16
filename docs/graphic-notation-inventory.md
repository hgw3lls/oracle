# Graphic Notation Inventory (pre-refactor)

## 1) Existing mode switch + UI section

- App-level mode switch lives in `src/app/App.tsx`.
  - `BuilderMode` is `'oracle' | 'graphicNotation'`.
  - Mode is persisted in localStorage key `app:mode`.
  - `GraphicNotationApp` is mounted only when mode is `graphicNotation`.
- Graphic notation UI is implemented in `src/graphic-notation/GraphicNotationApp.jsx`.
  - Form fields: score metadata/specification (`title`, `ensemble`, `visualIntent`, `durationSec`, `density`, `palette`, `gestures`, `constraints`).
  - Modules editor: enable/disable, strength, targets, tokens, rules.
  - Presets panel uses shared `PresetManager` with storage key `graphic:preset_packs`.
  - Outputs: master prompt, image prompt frame, variant matrix, plate prompts, derived JSON.

## 2) State, compiler, presets, and crash origins

### App state storage

- Graphic mode uses React local component state (`useState`) in `GraphicNotationApp.jsx`:
  - `form` (full spec + modules), persisted to localStorage `graphic:mode_state`.
  - `newModule` draft state for custom module creation.
  - `outputs` snapshot from builders (`masterPrompt`, `imagePromptFrame`, `platePrompts`, `variantMatrix`, etc.).
- Oracle mode has separate state in `App.tsx` and the newer wizard system also has a Zustand store (`src/core/state/store.ts`), but graphic mode does **not** use that store.

### Prompt compilation path today

- Compiler helpers are in `src/graphic-notation/promptBuilders.js`:
  - `deriveSpec(input)` normalizes score spec from form.
  - `normalizeModule(moduleInput)` + `collectEnabledModules(modulesInput)` normalize/filter enabled modules.
  - `buildMasterPrompt(spec, modules)` builds top-level graphic prompt.
  - `buildImagePromptFrame(spec, modules)` builds the image-generation frame.
  - `buildPlatePrompts(spec, modules)` generates per-gesture “plates”.
  - `buildVariantMatrix(spec, modules)` generates per-gesture variants.
- `GraphicNotationApp.jsx` computes outputs both:
  - eagerly in memos (`useMemo`), and
  - on explicit Generate via `buildGraphicOutputs(form)`.

### Preset/template status (musical_graphic / plate orchestration / modules)

- There is no hardcoded `musical_graphic` or `graphic_score` preset pack in source.
- Built-in module template exists as `builtInModules` in `GraphicNotationApp.jsx` and is embedded into `defaultState.modules`.
- Plate orchestration is implicit and generated from gesture list in `buildPlatePrompts` (one plate per gesture, duration sliced evenly).
- Saved templates are user-defined only, persisted via localStorage (`graphic:preset_packs`) through shared `PresetManager` + `presetPacks` utilities.

### Known crash / undefined-state risks and origin points

- `loadGraphicModeState()` only shallow-validates `modules` (`Array.isArray(parsed.modules)`), but does not sanitize items.
- Render loop directly dereferences raw module entries:
  - `(form.modules || []).map((module) => ...)` then `module.id`, `module.name`, `module.enabled`, etc.
  - If any module entry is `undefined`/non-object (e.g., stale or malformed localStorage/preset payload), this can throw during render.
- `updateModule(module.id, ...)` assumes a valid `module.id`; malformed entries can also create inconsistent updates.
- Prompt builders are more defensive (`normalizeModule`), but UI editing path is less defensive than compilation path.

## 3) Data shape for modules

Normalized module shape used by prompt builders:

```ts
{
  id: string,
  name: string,
  enabled: boolean,
  builtIn: boolean,
  strength: number, // clamped 0..100
  targets: Array<'hypna'|'structure'|'variation'|'impossible'|'humanizer'>,
  tokens: string[],
  rules: string[]
}
```

Notes:
- `name` is required for inclusion (missing name => dropped by `normalizeModule`).
- `enabled` controls whether module participates in generated prompts.
- Custom module form initially stores `tokens`/`rules` as multiline strings, then converts to arrays on add.

## 4) What is missing (gap check)

- Multi-page support:
  - No page model (`pageCount`, page metadata, per-page mappings, page-level layout constraints).
  - Current plate generation is gesture-driven and linear, not true paginated score planning.
- Performer mapping:
  - No structured performer/instrument map (roles, lanes, cue assignment).
  - Only free-text `ensemble` and gesture text.
- Live variants:
  - Variants are static text outputs; no runtime/live branching state, seed strategy, or performance-time mutation controls.
- Tests:
  - Only lightweight tests for prompt builders (`src/graphic-notation/promptBuilders.test.ts`).
  - Missing component tests for `GraphicNotationApp` (state loading, malformed module resilience, add/delete module flows, preset load edge-cases, generate button behavior).
  - Missing integration tests for localStorage migration/sanitization for graphic mode.
