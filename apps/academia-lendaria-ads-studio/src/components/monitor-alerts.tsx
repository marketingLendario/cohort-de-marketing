/**
 * Faixa de alertas do monitor na Home (AC3 — STORY-AL-ADS-1.4).
 *
 * Zona onde o monitor (passo 8) escala campanhas para revisão humana (ex.:
 * "CPA 2× acima do alvo — kill sugerido"). O monitor NÃO existe na fundação:
 * esta faixa é um placeholder honesto e fica oculta enquanto não há alertas
 * (brief Tela 0, estado "vazio": faixa de alertas vazia oculta).
 *
 * VÍNCULO: o conteúdo real (cards de alerta com HealthBadge + CTA "Revisar") é
 * fechado na Story 5.2 AC4 (cards do monitor na Home). Não inventamos alertas
 * nem dados de trigger aqui — só a estrutura vazia (Art. IV).
 */
export interface MonitorAlertsProps {
  /**
   * Lista de alertas escalados pelo monitor. Vazia na fundação (sem monitor).
   * A forma concreta do alerta é definida na Story 5.2; tipamos como `unknown[]`
   * para não especular o schema antes da hora.
   */
  alerts?: unknown[];
}

export function MonitorAlerts({ alerts = [] }: MonitorAlertsProps) {
  // Estado vazio: faixa oculta (brief Tela 0). Sem monitor, nada a mostrar.
  if (alerts.length === 0) {
    return null;
  }

  // Render real dos cards de alerta: Story 5.2. Por ora, nunca alcançado.
  return null;
}
