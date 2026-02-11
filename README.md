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


## Deploy to GitHub Pages

This repo is configured for **GitHub Pages (GitHub Actions source)** with a Vite base path of:

```txt
/oracle/
```

That base is required for project pages hosted at:

```txt
https://<your-user-or-org>.github.io/oracle/
```

### Workflow

Deployment workflow file:

- `.github/workflows/deploy.yml`

It runs on pushes to `main` and uses official GitHub Pages actions:

1. `actions/configure-pages`
2. build (`npm install && npm run build`)
3. `actions/upload-pages-artifact` (from `dist/`)
4. `actions/deploy-pages`

### Required repository setting

In GitHub UI:

- **Settings → Pages → Source: GitHub Actions**

Without this setting, the workflow can run but Pages will not publish from Actions.
