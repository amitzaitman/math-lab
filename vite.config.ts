import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/math-lab/',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.svg'],
    manifest: {
      name: 'מעבדת החשבון', short_name: 'Math Lab', lang: 'he', dir: 'rtl',
      start_url: '.', scope: '.', display: 'standalone',
      theme_color: '#174c45', background_color: '#f8f6ef',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
  })],
  test: { include: ['src/**/*.test.ts'] },
});
