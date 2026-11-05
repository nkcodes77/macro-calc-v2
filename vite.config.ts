/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app from /<repo-name>/. Override with BASE_PATH if the repo is renamed.
const base = process.env.BASE_PATH ?? '/macro-calc-v2/'
const version = process.env.npm_package_version ?? '0.0.0'
const commit = (process.env.GITHUB_SHA ?? 'local').slice(0, 7)

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __COMMIT__: JSON.stringify(commit),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-180.png'],
      manifest: {
        name: 'Macro Calc',
        short_name: 'Macro Calc',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#F5F6F2',
        theme_color: '#F5F6F2',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      exclude: ['src/core/**/*.test.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
})
