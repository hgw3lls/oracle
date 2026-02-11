# Oracle

This project is now a React + Vite web app with a brutalist style and a GitHub Actions workflow for automatic GitHub Pages deployment.

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

## GitHub Pages deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes the `dist/` artifact to GitHub Pages.
