import { Icon } from '@/lib/lendaria-ds';
import { DEMO_AUTH_ENABLED, TRAFFIC_SIMULATION_ENABLED } from '@/lib/demo-mode';

/** Makes synthetic traffic numbers impossible to confuse with live account data. */
export function TrafficSimulationBanner() {
  if (!DEMO_AUTH_ENABLED && !TRAFFIC_SIMULATION_ENABLED) return null;

  return (
    <div className="cms-simulation-banner" role="note">
      <Icon name="info-circle" size={14} />
      <span><strong>Dados simulados.</strong> Conversões, CPA e ROAS desta operação não representam uma conta Meta real.</span>
    </div>
  );
}
