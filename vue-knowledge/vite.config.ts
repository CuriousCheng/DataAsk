import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/knowledge/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@dataask/shared-ui': fileURLToPath(new URL('../shared-ui/src/index.ts', import.meta.url)),
    },
  },
})
