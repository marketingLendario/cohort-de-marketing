/**
 * Canary / health-check payload (AC4 — PRD Story 1.1 AC1).
 *
 * Fonte única do status de saúde da app, consumida tanto pela rota
 * `/healthz` (resposta JSON) quanto pela Home (exibição visual). Mantém
 * a paridade CLI-First: o mesmo contrato de status em ambas as superfícies.
 */
export interface CanaryStatus {
  status: 'ok'
  app: string
  boundary: 'ONLINE'
  version: string
}

export const APP_NAME = 'academia-lendaria-ads-studio' as const

export function getCanaryStatus(): CanaryStatus {
  return {
    status: 'ok',
    app: APP_NAME,
    boundary: 'ONLINE',
    version: '0.0.0',
  }
}
