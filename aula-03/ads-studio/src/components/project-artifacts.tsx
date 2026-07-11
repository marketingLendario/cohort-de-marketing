import { useMemo, useState } from 'react';
import { Button, Icon } from '@/lib/lendaria-ds';
import { skillCatalog } from '@/generated/skill-catalog';
import { useProjectStore } from '@/stores/project-store';
import type { ProjectArtifact } from '@/lib/project-domain';

const FORMAT_ICONS: Record<ProjectArtifact['format'], string> = {
  markdown: 'page-edit',
  html: 'www',
  pdf: 'page',
  docx: 'page',
  image: 'media-image',
  json: 'code-brackets',
  yaml: 'code-brackets',
  other: 'page',
};

export function ProjectArtifacts({ projectId }: { projectId: string }) {
  const allArtifacts = useProjectStore((state) => state.artifacts);
  const artifacts = useMemo(() => allArtifacts.filter((artifact) => artifact.projectId === projectId), [allArtifacts, projectId]);
  const addArtifact = useProjectStore((state) => state.addArtifact);
  const updateArtifact = useProjectStore((state) => state.updateArtifact);
  const project = useProjectStore((state) => state.projects.find((candidate) => candidate.id === projectId));
  const [filter, setFilter] = useState<'all' | ProjectArtifact['verification']>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(artifacts[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', path: '', artifactType: '', format: 'markdown' as ProjectArtifact['format'] });
  const filtered = useMemo(() => artifacts.filter((artifact) => {
    const matchesFilter = filter === 'all' || artifact.verification === filter;
    const matchesQuery = !query.trim() || `${artifact.title} ${artifact.path} ${artifact.artifactType}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesQuery;
  }), [artifacts, filter, query]);
  const selected = artifacts.find((artifact) => artifact.id === selectedId) ?? filtered[0];

  if (!project) return null;
  const workspaceId = project.workspaceId;

  function registerArtifact(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.path.trim() || !draft.artifactType.trim()) return;
    const artifactId = addArtifact({
      workspaceId,
      projectId,
      artifactType: draft.artifactType.trim(),
      title: draft.title.trim(),
      path: draft.path.trim(),
      format: draft.format,
      state: 'proposal',
      verification: 'pending',
      source: 'filesystem',
    });
    setSelectedId(artifactId);
    setAdding(false);
    setDraft({ title: '', path: '', artifactType: '', format: 'markdown' });
  }

  const producer = selected?.skillRunId
    ? undefined
    : skillCatalog.skills.find((skill) => skill.primaryArtifacts.includes(selected?.artifactType as never));

  function downloadArtifact(artifact: ProjectArtifact) {
    if (!artifact.content) return;
    const mime = artifact.format === 'json' ? 'application/json' : artifact.format === 'html' ? 'text/html' : 'text/plain';
    const blob = new Blob([artifact.content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = artifact.path.split('/').at(-1) || `${artifact.artifactType}.${artifact.format === 'markdown' ? 'md' : artifact.format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="asx-page cms-page cms-artifacts-page">
      <div className="asx-page-head">
        <div>
          <div className="asx-page-head__eyebrow">Registro de fontes</div>
          <h1 className="asx-page-head__title">Artefatos do <em>projeto</em></h1>
        </div>
        <Button onClick={() => setAdding((value) => !value)}>
          <Icon name={adding ? 'xmark' : 'plus'} size={13} /> {adding ? 'Cancelar' : 'Registrar artefato'}
        </Button>
      </div>

      {adding ? (
        <form className="cms-artifact-form" onSubmit={registerArtifact}>
          <label><span>Título</span><input className="al-input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label><span>Tipo</span><input className="al-input" value={draft.artifactType} onChange={(event) => setDraft({ ...draft, artifactType: event.target.value })} placeholder="Ex.: offerbook" /></label>
          <label className="is-wide"><span>Caminho</span><input className="al-input" value={draft.path} onChange={(event) => setDraft({ ...draft, path: event.target.value })} placeholder="projetos/meu-projeto/arquivo.md" /></label>
          <label><span>Formato</span><select className="al-input" value={draft.format} onChange={(event) => setDraft({ ...draft, format: event.target.value as ProjectArtifact['format'] })}>{Object.keys(FORMAT_ICONS).map((format) => <option key={format} value={format}>{format}</option>)}</select></label>
          <Button type="submit" disabled={!draft.title || !draft.path || !draft.artifactType}>Registrar como pendente</Button>
        </form>
      ) : null}

      <div className="cms-artifact-toolbar">
        <label className="cms-search-control"><Icon name="search" size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artefato" /></label>
        <select className="al-input" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filtrar verificação">
          <option value="all">Todos</option>
          <option value="confirmed">Verificados</option>
          <option value="pending">Pendentes</option>
          <option value="missing">Ausentes</option>
        </select>
      </div>

      <div className="cms-artifact-layout">
        <section className="cms-artifact-list" aria-label="Artefatos">
          {filtered.length ? filtered.map((artifact) => (
            <button key={artifact.id} type="button" className={`cms-artifact-row ${selected?.id === artifact.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(artifact.id)}>
              <span className="cms-file-icon"><Icon name={FORMAT_ICONS[artifact.format]} size={14} /></span>
              <span className="cms-artifact-row__copy"><strong>{artifact.title}</strong><small>{artifact.path || 'Caminho pendente'}</small></span>
              <span className={`cms-verification is-${artifact.verification}`}>{artifact.verification === 'confirmed' ? 'Verificado' : artifact.verification === 'pending' ? 'Pendente' : 'Ausente'}</span>
            </button>
          )) : <div className="cms-empty-state">Nenhum artefato corresponde aos filtros.</div>}
        </section>

        <aside className="cms-artifact-detail">
          {selected ? (
            <>
              <span className="cms-kicker">{selected.artifactType}</span>
              <h2>{selected.title}</h2>
              {selected.content ? (
                <pre className="cms-artifact-content">{selected.content}</pre>
              ) : (
                <div className="cms-artifact-preview">
                  <Icon name={FORMAT_ICONS[selected.format]} size={24} />
                  <span>{selected.format.toUpperCase()}</span>
                  <small>Preview disponível quando o runner local confirmar o caminho.</small>
                </div>
              )}
              <dl>
                <div><dt>Caminho</dt><dd>{selected.path || 'Não informado'}</dd></div>
                <div><dt>Estado</dt><dd>{selected.state}</dd></div>
                <div><dt>Origem</dt><dd>{selected.source}</dd></div>
                <div><dt>Produzido por</dt><dd>{producer?.title ?? 'Registro manual'}</dd></div>
                <div><dt>Hash</dt><dd>{selected.hash ?? 'Será calculado na verificação'}</dd></div>
              </dl>
              <div className="cms-artifact-actions">
                {selected.content ? (
                  <Button variant="outline" onClick={() => downloadArtifact(selected)}>
                    <Icon name="download" size={13} /> Baixar
                  </Button>
                ) : null}
                {selected.verification !== 'confirmed' ? (
                  <Button onClick={() => updateArtifact(selected.id, { verification: 'confirmed', state: 'confirmed' })}>
                    <Icon name="check" size={13} /> Confirmar existência
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => updateArtifact(selected.id, { state: 'stale' })}>
                    <Icon name="refresh" size={13} /> Marcar desatualizado
                  </Button>
                )}
              </div>
            </>
          ) : <div className="cms-empty-state">Selecione um artefato.</div>}
        </aside>
      </div>
    </div>
  );
}
