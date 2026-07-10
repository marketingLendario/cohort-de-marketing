import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Icon } from '@/lib/lendaria-ds';
import { useProjectStore } from '@/stores/project-store';
import { useSpokeStore } from '@/stores/spoke-store';
import { DEMO_AUTH_ENABLED, signOutDemo } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useProjectWorkspaceActions } from '@/components/project-hydration-boundary';

interface IntakeSource {
  slug: string;
  root: string;
}

interface IntakePreviewFile {
  path: string;
  artifactType: string;
  format: string;
  hash: string;
  sizeBytes: number;
  conflict: 'new' | 'unchanged' | 'conflict';
  existingHash: string | null;
}

interface IntakePreview {
  projectId: string;
  projectSlug: string;
  manifest: {
    hash: string;
    sourcePath: string;
    fileCount: number;
    allowlist: string[];
    allowlistVersion: string;
  };
  files: IntakePreviewFile[];
  conflicts: Array<{ path: string; existingHash: string; incomingHash: string }>;
}

interface IntakeConfirmation {
  manifestHash: string;
  imported: number;
  unchanged: number;
}

async function readProjectIntakeError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  return payload.message ?? `Intake respondeu ${response.status}.`;
}

async function fetchProjectIntakeSources(): Promise<IntakeSource[]> {
  const response = await fetch('/api/local/project-intake/sources');
  if (!response.ok) throw new Error(await readProjectIntakeError(response));
  return (await response.json()) as IntakeSource[];
}

async function fetchProjectIntakePreview(input: { projectId: string; sourceSlug: string }): Promise<IntakePreview> {
  const response = await fetch('/api/local/project-intake/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readProjectIntakeError(response));
  return (await response.json()) as IntakePreview;
}

async function confirmProjectIntake(input: {
  projectId: string;
  sourceSlug: string;
  expectedManifestHash: string;
}): Promise<IntakeConfirmation> {
  const response = await fetch('/api/local/project-intake/confirm', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readProjectIntakeError(response));
  return (await response.json()) as IntakeConfirmation;
}

export function ProjectsHome() {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
  const createDemoProject = useProjectStore((state) => state.createProject);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const { createProject: createPersistentProject } = useProjectWorkspaceActions();
  const activeSpokeId = useSpokeStore((state) => state.activeSpokeId);
  const resetSpokes = useSpokeStore((state) => state.reset);
  const [creating, setCreating] = useState(false);
  const [showingIntake, setShowingIntake] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [intakeProjectId, setIntakeProjectId] = useState('');
  const [intakeSourceSlug, setIntakeSourceSlug] = useState('');
  const [intakeSources, setIntakeSources] = useState<IntakeSource[]>([]);
  const [intakePreview, setIntakePreview] = useState<IntakePreview | null>(null);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [confirmingIntake, setConfirmingIntake] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [intakeSuccess, setIntakeSuccess] = useState<string | null>(null);
  const visibleProjects = projects.filter((project) => !activeSpokeId || project.workspaceId === activeSpokeId);

  useEffect(() => {
    if (!visibleProjects.some((project) => project.id === intakeProjectId)) {
      setIntakeProjectId(visibleProjects[0]?.id ?? '');
    }
  }, [intakeProjectId, visibleProjects]);

  async function loadIntakeSources() {
    if (DEMO_AUTH_ENABLED) return;
    setIntakeLoading(true);
    setIntakeError(null);
    setIntakeSuccess(null);
    try {
      const sources = await fetchProjectIntakeSources();
      setIntakeSources(sources);
      setIntakeSourceSlug((current) => (
        sources.some((source) => source.slug === current) ? current : sources[0]?.slug || ''
      ));
    } catch (error) {
      setIntakeError(error instanceof Error ? error.message : 'Não foi possível listar as fontes locais.');
    } finally {
      setIntakeLoading(false);
    }
  }

  useEffect(() => {
    if (!showingIntake || DEMO_AUTH_ENABLED) return;
    let active = true;
    void (async () => {
      setIntakeLoading(true);
      setIntakeError(null);
      setIntakeSuccess(null);
      try {
        const sources = await fetchProjectIntakeSources();
        if (!active) return;
        setIntakeSources(sources);
        setIntakeSourceSlug((current) => (
          sources.some((source) => source.slug === current) ? current : sources[0]?.slug || ''
        ));
      } catch (error) {
        if (active) setIntakeError(error instanceof Error ? error.message : 'Não foi possível listar as fontes locais.');
      } finally {
        if (active) setIntakeLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [showingIntake]);

  useEffect(() => {
    setIntakePreview(null);
    setIntakeSuccess(null);
  }, [intakeProjectId, intakeSourceSlug]);

  function openProject(projectId: string) {
    setActiveProject(projectId);
    navigate({ to: '/projects/$projectId/overview', params: { projectId } });
  }

  async function submitProject(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !activeSpokeId || submitting) return;

    // Caminho demo: criação local e síncrona, sem repository (AC4).
    if (DEMO_AUTH_ENABLED) {
      openProject(createDemoProject(activeSpokeId, trimmedName));
      return;
    }

    // Modo real: persiste no repository ANTES de navegar (AC1/AC5) — a tela
    // de destino já encontra o projeto no cache ao montar.
    setSubmitting(true);
    try {
      const projectId = await createPersistentProject(trimmedName);
      openProject(projectId);
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    if (DEMO_AUTH_ENABLED) signOutDemo();
    else await supabase.auth.signOut();
    resetSpokes();
    navigate({ to: '/' });
  }

  async function previewIntake() {
    if (!intakeProjectId || !intakeSourceSlug) return;
    setIntakeLoading(true);
    setIntakeError(null);
    setIntakeSuccess(null);
    try {
      setIntakePreview(await fetchProjectIntakePreview({ projectId: intakeProjectId, sourceSlug: intakeSourceSlug }));
    } catch (error) {
      setIntakePreview(null);
      setIntakeError(error instanceof Error ? error.message : 'Não foi possível gerar o preview do intake.');
    } finally {
      setIntakeLoading(false);
    }
  }

  async function confirmIntake() {
    if (!intakePreview || !intakeProjectId || !intakeSourceSlug) return;
    setConfirmingIntake(true);
    setIntakeError(null);
    setIntakeSuccess(null);
    try {
      const result = await confirmProjectIntake({
        projectId: intakeProjectId,
        sourceSlug: intakeSourceSlug,
        expectedManifestHash: intakePreview.manifest.hash,
      });
      setIntakeSuccess(`Intake confirmado: ${result.imported} importado(s), ${result.unchanged} reaproveitado(s).`);
      setIntakePreview((current) => current ? { ...current, manifest: { ...current.manifest, hash: result.manifestHash } } : current);
    } catch (error) {
      setIntakeError(error instanceof Error ? error.message : 'Não foi possível confirmar o intake.');
    } finally {
      setConfirmingIntake(false);
    }
  }

  return (
    <div className="cms-projects-page">
      <header className="asx-topbar cms-topbar">
        <div className="asx-brand">
          <span className="asx-wordmark">Lendár<em>[IA]</em></span>
          <span className="asx-brand__rule" />
          <span className="asx-brand__product">Marketing Studio</span>
        </div>
        <button className="asx-iconbtn" type="button" onClick={signOut} title="Sair" aria-label="Sair">
          <Icon name="log-out" size={16} />
        </button>
      </header>

      <main className="cms-projects-main">
        <div className="asx-page-head cms-projects-head">
          <div>
            <div className="asx-page-head__eyebrow">Workspace</div>
            <h1 className="asx-page-head__title">Seus <em>projetos</em></h1>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!DEMO_AUTH_ENABLED ? (
              <Button variant="ghost" onClick={() => setShowingIntake((value) => !value)}>
                <Icon name={showingIntake ? 'xmark' : 'folder'} size={14} />
                {showingIntake ? 'Fechar intake' : 'Intake local'}
              </Button>
            ) : null}
            <Button onClick={() => setCreating((value) => !value)}>
              <Icon name={creating ? 'xmark' : 'plus'} size={14} />
              {creating ? 'Cancelar' : 'Novo projeto'}
            </Button>
          </div>
        </div>

        {creating ? (
          <form className="cms-new-project" onSubmit={submitProject}>
            <label htmlFor="new-project-name">Nome do projeto</label>
            <div>
              <input
                id="new-project-name"
                className="al-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Nova oferta 2026"
                autoFocus
              />
              <Button type="submit" disabled={!name.trim() || !activeSpokeId || submitting}>
                {submitting ? 'Criando...' : 'Criar e abrir'}
              </Button>
            </div>
          </form>
        ) : null}

        {showingIntake ? (
          <section
            aria-label="Intake local do filesystem"
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              display: 'grid',
              gap: 16,
            }}
          >
            <div>
              <strong>Intake local do filesystem</strong>
              <p style={{ margin: '6px 0 0', opacity: 0.8 }}>
                Escaneia apenas diretórios de <code>projetos/</code>, gera preview com manifesto, hashes e conflitos, e só registra metadata no Supabase após confirmação humana.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <label>
                <span>Projeto alvo</span>
                <select
                  className="al-input"
                  value={intakeProjectId}
                  onChange={(event) => setIntakeProjectId(event.target.value)}
                  style={{ width: '100%', marginTop: 6 }}
                >
                  {visibleProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Diretório em projetos/</span>
                <select
                  className="al-input"
                  value={intakeSourceSlug}
                  onChange={(event) => setIntakeSourceSlug(event.target.value)}
                  style={{ width: '100%', marginTop: 6 }}
                >
                  <option value="">Selecione…</option>
                  {intakeSources.map((source) => (
                    <option key={source.slug} value={source.slug}>
                      {source.root}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="ghost" onClick={() => setShowingIntake((value) => !value)}>
                Fechar
              </Button>
              <Button variant="ghost" onClick={() => void loadIntakeSources()} disabled={intakeLoading}>
                Atualizar diretórios
              </Button>
              <Button onClick={previewIntake} disabled={!intakeProjectId || !intakeSourceSlug || intakeLoading || visibleProjects.length === 0}>
                {intakeLoading ? 'Gerando preview...' : 'Gerar preview'}
              </Button>
              <Button
                onClick={confirmIntake}
                disabled={!intakePreview || confirmingIntake || intakeLoading}
              >
                {confirmingIntake ? 'Confirmando...' : 'Confirmar intake'}
              </Button>
            </div>

            {visibleProjects.length === 0 ? <p>Nenhum projeto real disponível para receber o intake.</p> : null}
            {intakeSources.length === 0 && !intakeLoading ? <p>Nenhum diretório válido encontrado em <code>projetos/</code>.</p> : null}
            {intakeError ? <p role="alert">{intakeError}</p> : null}
            {intakeSuccess ? <p>{intakeSuccess}</p> : null}

            {intakePreview ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <strong>Manifesto gerado</strong>
                  <span><code>{intakePreview.manifest.sourcePath}</code></span>
                  <span>{intakePreview.manifest.fileCount} arquivo(s) allowlisted</span>
                  <span><code>{intakePreview.manifest.hash}</code></span>
                  <span>Allowlist: {intakePreview.manifest.allowlistVersion}</span>
                  <span><code>{intakePreview.manifest.allowlist.join(', ')}</code></span>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {intakePreview.files.map((file) => (
                    <article
                      key={`${file.path}:${file.hash}`}
                      style={{
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        padding: 14,
                        display: 'grid',
                        gap: 6,
                      }}
                    >
                      <strong>{file.path}</strong>
                      <span>Tipo: <code>{file.artifactType}</code> · Formato: <code>{file.format}</code></span>
                      <span>Hash: <code>{file.hash}</code></span>
                      <span>Conflito: <code>{file.conflict}</code>{file.existingHash ? ` · atual ${file.existingHash}` : ''}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="cms-project-grid" aria-label="Projetos">
          {visibleProjects.map((project) => (
            <button key={project.id} type="button" className="cms-project-card" onClick={() => openProject(project.id)}>
              <span className="cms-project-card__icon"><Icon name="folder" size={18} /></span>
              <span className="cms-project-card__copy">
                <strong>{project.name}</strong>
                <span>{project.slug}</span>
              </span>
              <Icon name="nav-arrow-right" size={15} />
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
