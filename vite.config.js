import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages repo site base (https://<user>.github.io/oracle/)
  base: '/oracle/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
