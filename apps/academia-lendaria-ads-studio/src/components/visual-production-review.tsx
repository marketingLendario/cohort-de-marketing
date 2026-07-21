import { useMemo, useState } from 'react'
import { Button, Icon } from '@/lib/lendaria-ds'
import type { CreativeFactoryBatchManifest } from '@/lib/project-domain'
import type { SkillProposal } from '@/lib/skill-runtime'
import { creativeAssetUrl, manifestFromProposal, promoteCreativeBatch, type CreativePromotionResponse } from '@/lib/creative-factory-runtime'
import { decideArtifactApproval, makeIdempotencyKey, planArtifactApproval } from '@/lib/artifact-approval'

export function VisualProductionReview(props: { proposal: SkillProposal; projectId: string; skillRunId: string; artifactType: string; artifactTitle: string; onPromoted: (response: CreativePromotionResponse) => void }) {
  const manifest = useMemo<CreativeFactoryBatchManifest>(() => manifestFromProposal(props.proposal), [props.proposal])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(itemId: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  async function promote() {
    if (selected.size === 0) return
    setBusy(true)
    setError(null)
    try {
      const response = await promoteCreativeBatch({ batchId: manifest.batchId, projectId: props.projectId, selectedItemIds: [...selected] })
      const artifacts = [{
        artifactType: props.artifactType,
        title: props.artifactTitle,
        path: response.artifactPath,
        format: 'json' as const,
        content: response.artifactContent,
      }]
      const plan = await planArtifactApproval({ skillRunId: props.skillRunId, artifacts })
      await decideArtifactApproval({
        skillRunId: props.skillRunId,
        decision: 'approve',
        expectedProposalHash: plan.proposalHash,
        expectedProposalRevision: plan.proposalRevision,
        idempotencyKey: makeIdempotencyKey(props.skillRunId, plan.proposalHash, 'approve'),
        artifacts,
      })
      props.onPromoted(response)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível promover as imagens selecionadas.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="cms-visual-review" aria-label="Revisão da produção visual">
    <div className="cms-visual-review__head"><div><strong>{manifest.items.length} peças geradas</strong><span>Selecione somente as peças aprovadas visualmente.</span></div><small>{manifest.productionSkillId ?? 'ads-creative-factory'}</small></div>
    <div className="cms-factory-grid">{manifest.items.map((item) => {
      const asset = item.assets[0]!
      const ready = item.status === 'ready'
      return <article key={item.id} className={`cms-factory-card ${ready ? '' : 'is-flagged'} ${selected.has(item.id) ? 'is-selected' : ''}`}>
        <div className="cms-factory-media" style={{ aspectRatio: `${asset.width}/${asset.height}` }}><img src={creativeAssetUrl(manifest.batchId, asset.id)} alt={item.headline} /></div>
        <div className="cms-factory-card-body"><div><span>{item.archetype.replaceAll('_', ' ')}</span><strong>{ready ? 'Gate aprovado' : 'Revisão necessária'}</strong></div><h3>{item.headline}</h3><p>{item.caption}</p><small>{item.assets.map((entry) => `${entry.format} ${entry.width}×${entry.height}`).join(' · ')}</small><details><summary>Proveniência</summary><code>{item.promptSha256.slice(0, 16)}</code><p>{item.promptSanitized}</p></details><label className="cms-factory-select"><input type="checkbox" disabled={!ready || busy} checked={selected.has(item.id)} onChange={() => toggle(item.id)} /><span>{selected.has(item.id) ? 'Selecionado' : 'Aprovar para o projeto'}</span></label></div>
      </article>
    })}</div>
    {error ? <div className="cms-inline-error">{error}</div> : null}
    <Button onClick={() => void promote()} disabled={busy || selected.size === 0}><Icon name="check" size={13} /> {busy ? 'Promovendo...' : `Promover ${selected.size} selecionado(s)`}</Button>
  </section>
}
