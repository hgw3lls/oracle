# Oracle

Oracle now runs as a React + Vite web app that refactors the original Python/Tkinter prompt builder into a browser-based experience.

## What changed

- The old Python app remains in the repo for reference (`hypna_prompt_gui_v3.py`).
- The web app now includes:
  - Prompt input controls (mode, subject, notes, style tokens)
  - Auto-evolve state generation controls
  - Humanizer controls
  - State browser and compiled prompt output panel

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```
