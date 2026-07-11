import { Card, CardContent, Badge, StatChip } from '@/lib/lendaria-ds';
import type { BadgeVariant } from '@/lib/lendaria-ds';
import type { AdsCampaign, AdsCampaignStatus } from '@/lib/types';

/**
 * Card de uma campanha no grid da Home (AC1 — STORY-AL-ADS-1.4).
 *
 * Mostra nome · status · CPA · ROAS · gasto (brief Tela 0). As métricas NÃO
 * existem na fundação: campanhas em `draft` ainda não foram publicadas, então
 * não há dados de performance. Em vez de inventar números (proibido — Art. IV),
 * exibimos placeholders honestos:
 *   - "—" no valor da métrica (StatChip);
 *   - rótulo "aguardando publicação" no rodapé do card.
 * As métricas ao vivo chegam no Epic 5 (FR33). O modelo de dados (`AdsCampaign`)
 * não tem campos de métrica — o SOT (`supabase/schemas/`) é a fonte; não
 * adicionamos campos especulativos.
 */

const STATUS_LABEL: Record<AdsCampaignStatus, string> = {
  draft: 'Rascunho',
  in_review: 'Em revisão',
  approved: 'Aprovada',
  live: 'No ar',
  paused: 'Pausada',
  archived: 'Arquivada',
};

const STATUS_VARIANT: Record<AdsCampaignStatus, BadgeVariant> = {
  draft: 'outline',
  in_review: 'warning',
  approved: 'info',
  live: 'success',
  paused: 'warning',
  archived: 'outline',
};

/** Placeholder honesto: nenhuma métrica existe antes da publicação (Epic 5). */
const NO_DATA = '—';

export interface CampaignCardProps {
  campaign: AdsCampaign;
  /** Abre a campanha no passo apropriado do wizard (rascunho → onde parou). */
  onOpen?: (campaign: AdsCampaign) => void;
}

export function CampaignCard({ campaign, onOpen }: CampaignCardProps) {
  const hasMetrics = false; // Fundação: sem métricas até o Epic 5 popular dados ao vivo (FR33).

  return (
    <Card
      onClick={onOpen ? () => onOpen(campaign) : undefined}
      style={onOpen ? { cursor: 'pointer' } : undefined}
    >
      <CardContent>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '0.75rem',
          }}
        >
          <span style={{ fontWeight: 600 }}>{campaign.name}</span>
          <Badge variant={STATUS_VARIANT[campaign.status]}>
            {STATUS_LABEL[campaign.status]}
          </Badge>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <StatChip label="CPA" value={NO_DATA} />
          <StatChip label="ROAS" value={NO_DATA} />
          <StatChip label="Gasto" value={NO_DATA} />
        </div>

        {!hasMetrics && (
          <p style={{ opacity: 0.6, fontSize: '0.75rem', margin: '0.75rem 0 0' }}>
            Sem dados — aguardando publicação.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
