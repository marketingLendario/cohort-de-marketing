/**
 * BFF/worker entrypoint — `CMD ["node", "dist/server/start.js"]` in the worker
 * image (deploy-topology §1.5). Port 3002 (distinct from squad-engine:3001 on
 * the same VPS).
 *
 * STORY-AL-ADS-1.3 (AC8, AC9).
 */
import { buildApp } from './app.js'

const PORT = Number(process.env.PORT) || 3002
const HOST = process.env.HOST || '0.0.0.0'

async function start(): Promise<void> {
  const app = await buildApp()
  try {
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`ads-studio BFF/worker listening on ${HOST}:${PORT}`)
    app.log.info(`tRPC endpoint: http://${HOST}:${PORT}/trpc`)
  } catch (err) {
    app.log.error(err, 'Failed to start ads-studio BFF/worker')
    process.exit(1)
  }
}

void start()
