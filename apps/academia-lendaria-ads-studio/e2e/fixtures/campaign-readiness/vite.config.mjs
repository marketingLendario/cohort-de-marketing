import { defineConfig, mergeConfig } from 'vite';
import baseConfig from '../../../vite.config.ts';

// Mesma estrutura de `e2e/fixtures/traffic-pilot/vite.config.mjs`
// (STORY-8.W3.1) — proxy de `/api` para o BFF real do piloto, injetando o
// token do local skill runner no header exigido por `server/app.ts`.
export default defineConfig(async (configEnv) => {
  const inherited = typeof baseConfig === 'function' ? await baseConfig(configEnv) : baseConfig;
  const localRunnerToken = process.env.LOCAL_SKILL_RUNNER_TOKEN;

  return mergeConfig(inherited, {
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3303',
          changeOrigin: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (localRunnerToken) proxyReq.setHeader('x-local-runner-token', localRunnerToken);
            });
          },
        },
      },
    },
  });
});
