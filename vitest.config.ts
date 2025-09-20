import { defineConfig } from 'vitest/config'
import path from 'path'

const defaultExcludes = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/cypress/**',
  '**/.{idea,git,cache,output,temp}/**',
]

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: false,
    exclude: [...defaultExcludes, '__tests__/i18n-redirect-root.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
