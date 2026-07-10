import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'
import type { ClientRequest } from 'node:http'

// Espelha apps/web (stack canônica REUSE — arch §2.3): React 19 + Vite +
// TanStack Router + Tailwind v4. Alias absoluto @/ → ./src (NFR14).
export default defineConfig(({ mode }) => {
  // Carrega TODAS as variáveis (prefixo vazio), inclusive as NÃO prefixadas com
  // VITE_. O token do runner local NÃO é VITE_*, logo NUNCA entra em
  // `import.meta.env` nem no bundle do cliente (AC3/NFR10). Ele é lido apenas
  // aqui, no contexto Node do config, para ser injetado server-side no proxy.
  const env = loadEnv(mode, process.cwd(), '')
  const localRunnerToken = env.LOCAL_SKILL_RUNNER_TOKEN ?? process.env.LOCAL_SKILL_RUNNER_TOKEN
  const localBffUrl = env.LOCAL_BFF_URL ?? process.env.LOCAL_BFF_URL ?? 'http://127.0.0.1:3002'

  return {
    plugins: [TanStackRouterVite({ autoCodeSplitting: true }), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: localBffUrl,
          changeOrigin: false,
          // Injeta o segredo local no lado servidor do dev server (AC3). O
          // browser nunca vê nem envia o token; o header é acrescentado aqui.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq: ClientRequest) => {
              if (localRunnerToken) {
                proxyReq.setHeader('x-local-runner-token', localRunnerToken)
              }
            })
          },
        },
      },
    },
  }
})
