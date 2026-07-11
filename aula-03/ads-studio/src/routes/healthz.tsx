import { createFileRoute } from '@tanstack/react-router'
import { getCanaryStatus } from '@/lib/canary'

/**
 * Rota de canary / health-check (AC4).
 *
 * Renderiza o payload de status como JSON legível. Em uma SPA Vite a
 * resposta é HTML, então expomos o status estruturado em <pre> para
 * inspeção humana e máquina (smoke test: GET /healthz → status "ok").
 */
function HealthCheck() {
  const payload = getCanaryStatus()
  return (
    <main style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '1rem' }}>health-check</h1>
      <pre data-testid="canary-status">{JSON.stringify(payload, null, 2)}</pre>
    </main>
  )
}

export const Route = createFileRoute('/healthz')({
  component: HealthCheck,
})
