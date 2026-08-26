import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Everything is inlined into one self-contained dist/index.html. The bundle is
// emitted as an IIFE rather than an ES module so the artefact runs from file://
// and can be smoke-tested in jsdom, which does not execute module scripts.
export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
