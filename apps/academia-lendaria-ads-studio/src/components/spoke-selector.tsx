import { useSpokeStore } from '@/stores/spoke-store';

/**
 * Seletor de spoke/ad-account (AC2 — STORY-AL-ADS-1.2).
 *
 * Lista os workspaces do usuário e troca o spoke ATIVO. Trocar o ativo
 * re-escopa a UI: todo consumidor do store (ex.: a lista de campanhas) reage e
 * recarrega filtrado pelo novo `workspace_id`.
 *
 * `<select>` nativo (acessível por padrão, sem peso de combobox custom) com
 * label associado. O DS Lendária não exporta um Select; o nativo é a escolha
 * mais simples e correta para o MVP.
 */
export function SpokeSelector() {
  const spokes = useSpokeStore((s) => s.spokes);
  const activeSpokeId = useSpokeStore((s) => s.activeSpokeId);
  const setActiveSpoke = useSpokeStore((s) => s.setActiveSpoke);

  if (spokes.length === 0) {
    return (
      <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>
        Nenhum spoke disponível para esta conta.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label htmlFor="spoke-selector" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        Spoke
      </label>
      <select
        id="spoke-selector"
        className="al-input"
        value={activeSpokeId ?? ''}
        onChange={(e) => setActiveSpoke(e.target.value)}
        style={{ minWidth: '0', maxWidth: '12rem', width: '100%' }}
      >
        {spokes.map((spoke) => (
          <option key={spoke.id} value={spoke.id}>
            {spoke.name}
          </option>
        ))}
      </select>
    </div>
  );
}
