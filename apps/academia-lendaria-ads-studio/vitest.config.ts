import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Dois ambientes: server (node — orchestration/jobs) e src (jsdom — React).
// Vitest 4 usa `projects` para múltiplos ambientes no mesmo run.
const alias = { '@': path.resolve(__dirname, './src') }

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'server',
          // `shared/**` is environment-agnostic (no DOM, no `node:*`) and was
          // never picked up by either project's glob before STORY-12.W4.1 —
          // `shared/campaign-readiness.test.ts` (STORY-12.W1.1) silently never
          // ran. Fixed here rather than left silently broken (see Dev Notes,
          // STORY-12.W4.1): the `node` environment already suits pure modules.
          include: ['server/**/*.test.ts', 'shared/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'client',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
})
