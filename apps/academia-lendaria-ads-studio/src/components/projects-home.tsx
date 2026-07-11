import { useEffect, useRef, useState } from 'react';
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

type IntakeRetry = 'sources' | 'preview' | 'confirm';

class ProjectIntakeRequestError extends Error {
  readonly code: string | null;

  constructor(code: string | null, message: string) {
    super(message);
    this.name = 'ProjectIntakeRequestError';
    this.code = code;
  }
}

async function readProjectIntakeError(response: Response): Promise<ProjectIntakeRequestError> {
  const payload = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
  return new ProjectIntakeRequestError(
    payload.code ?? null,
    payload.message ?? `Intake respondeu ${response.status}.`,
  );
}

function studentFacingImportError(message: string): string {
  if (/segredo|\.env|secret/i.test(message)) {
    return 'Essa pasta contém um arquivo privado e não pode ser importada. Remova esse arquivo da seleção e tente novamente.';
  }
  if (/conflito|conflict|hash|manifest/i.test(message)) {
    return 'Os materiais mudaram durante a revisão. Revise a pasta novamente antes de continuar.';
  }
  return 'Não foi possível ler esses materiais agora. Confira se a pasta continua disponível e tente novamente.';
}

function sourceName(source: IntakeSource): string {
  return source.slug.split('-').filter(Boolean).map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`).join(' ');
}

async function fetchProjectIntakeSources(): Promise<IntakeSource[]> {
  const response = await fetch('/api/local/project-intake/sources');
  if (!response.ok) throw await readProjectIntakeError(response);
  return (await response.json()) as IntakeSource[];
}

async function fetchProjectIntakePreview(input: { projectId: string; sourceSlug: string }): Promise<IntakePreview> {
  const response = await fetch('/api/local/project-intake/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await readProjectIntakeError(response);
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
  if (!response.ok) throw await readProjectIntakeError(response);
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
  const [intakeRetry, setIntakeRetry] = useState<IntakeRetry>('sources');
  const [intakeSuccess, setIntakeSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
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
      setIntakeRetry('sources');
      setIntakeError(studentFacingImportError(error instanceof Error ? error.message : ''));
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
        if (active) {
          setIntakeRetry('sources');
          setIntakeError(studentFacingImportError(error instanceof Error ? error.message : ''));
        }
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

    setCreateError(null);
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
    } catch {
      setCreateError('Não foi possível criar o projeto agora. Seus dados continuam aqui; tente novamente.');
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
      setIntakeRetry('preview');
      setIntakeError(studentFacingImportError(error instanceof Error ? error.message : ''));
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
      setIntakeSuccess(`${result.imported} material(is) adicionado(s) e ${result.unchanged} já estava(m) atualizado(s).`);
      setIntakePreview((current) => current ? { ...current, manifest: { ...current.manifest, hash: result.manifestHash } } : current);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setIntakeRetry(error instanceof ProjectIntakeRequestError && error.code === 'manifest-stale' ? 'preview' : 'confirm');
      setIntakeError(studentFacingImportError(message));
    } finally {
      setConfirmingIntake(false);
    }
  }

  function retryIntake() {
    if (intakeRetry === 'confirm') return void confirmIntake();
    if (intakeRetry === 'preview') return void previewIntake();
    return void loadIntakeSources();
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
            <div className="asx-page-head__eyebrow">Seu trabalho</div>
            <h1 className="asx-page-head__title">Seus <em>projetos</em></h1>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!DEMO_AUTH_ENABLED ? (
              <Button variant="ghost" onClick={() => setShowingIntake((value) => !value)}>
                <Icon name={showingIntake ? 'xmark' : 'folder'} size={14} />
                {showingIntake ? 'Fechar materiais' : 'Trazer materiais'}
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
                ref={nameInputRef}
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
            {createError ? (
              <div className="cms-inline-recovery" role="alert">
                <span>{createError}</span>
                <Button type="submit" variant="ghost" disabled={submitting}>Tentar novamente</Button>
              </div>
            ) : null}
          </form>
        ) : null}

        {visibleProjects.length === 0 && !creating ? (
          <section className="cms-first-project" aria-labelledby="first-project-title">
            <span className="cms-first-project__step">Primeiro passo</span>
            <div>
              <h2 id="first-project-title">Crie seu primeiro projeto</h2>
              <p>Dê um nome ao trabalho que você quer organizar. Depois, você poderá trazer seus materiais e verá exatamente o que fazer em seguida.</p>
            </div>
            <Button onClick={() => {
              setCreating(true);
              window.requestAnimationFrame(() => nameInputRef.current?.focus());
            }}>
              <Icon name="plus" size={14} />
              Começar meu projeto
            </Button>
          </section>
        ) : null}

        {showingIntake ? (
          <section
            aria-labelledby="project-materials-title"
            className="cms-project-materials"
          >
            <div className="cms-project-materials__intro">
              <span>Segundo passo</span>
              <h2 id="project-materials-title">Traga os materiais que você já tem</h2>
              <p>Escolha a pasta do seu projeto. Você poderá conferir tudo antes de adicionar, sem alterar os arquivos originais.</p>
            </div>

            <div className="cms-project-materials__fields">
              <label>
                <span>Adicionar ao projeto</span>
                <select
                  className="al-input"
                  value={intakeProjectId}
                  onChange={(event) => setIntakeProjectId(event.target.value)}
                >
                  {visibleProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Pasta com seus materiais</span>
                <select
                  className="al-input"
                  value={intakeSourceSlug}
                  onChange={(event) => setIntakeSourceSlug(event.target.value)}
                >
                  <option value="">Escolha uma pasta…</option>
                  {intakeSources.map((source) => (
                    <option key={source.slug} value={source.slug}>
                      {sourceName(source)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="cms-project-materials__actions">
              <Button variant="ghost" onClick={() => setShowingIntake((value) => !value)}>
                Fechar
              </Button>
              <Button variant="ghost" onClick={() => void loadIntakeSources()} disabled={intakeLoading}>
                Procurar novamente
              </Button>
              <Button onClick={previewIntake} disabled={!intakeProjectId || !intakeSourceSlug || intakeLoading || visibleProjects.length === 0}>
                {intakeLoading ? 'Preparando revisão...' : 'Revisar materiais'}
              </Button>
              <Button
                onClick={confirmIntake}
                disabled={!intakePreview || confirmingIntake || intakeLoading}
              >
                {confirmingIntake ? 'Adicionando...' : 'Adicionar materiais'}
              </Button>
            </div>

            {visibleProjects.length === 0 ? <p className="cms-guidance">Crie um projeto primeiro. Depois, volte aqui para adicionar os materiais.</p> : null}
            {intakeSources.length === 0 && !intakeLoading ? (
              <div className="cms-inline-recovery" role="status">
                <span>Nenhuma pasta de materiais foi encontrada. Salve seus materiais na pasta de projetos e procure novamente.</span>
                <Button variant="ghost" onClick={() => void loadIntakeSources()}>Procurar novamente</Button>
              </div>
            ) : null}
            {intakeError ? (
              <div className="cms-inline-recovery" role="alert">
                <span>{intakeError}</span>
                <Button variant="ghost" onClick={retryIntake}>Tentar novamente</Button>
              </div>
            ) : null}
            {intakeSuccess ? (
              <div className="cms-material-success" role="status">
                <div><strong>Materiais adicionados</strong><span>{intakeSuccess}</span></div>
                <Button onClick={() => openProject(intakeProjectId)}>Ver minha próxima ação</Button>
              </div>
            ) : null}

            {intakePreview ? (
              <div className="cms-material-review">
                <div className="cms-material-review__summary">
                  <strong>Pronto para revisar</strong>
                  <span>{intakePreview.manifest.fileCount} material(is) encontrado(s)</span>
                  <span>Seus arquivos originais não serão alterados.</span>
                  {intakePreview.conflicts.length > 0 ? <span>{intakePreview.conflicts.length} material(is) será(ão) atualizado(s) com a versão escolhida.</span> : null}
                </div>

                <div className="cms-material-review__list" aria-label="Materiais encontrados">
                  {intakePreview.files.map((file) => (
                    <article key={`${file.path}:${file.hash}`}>
                      <strong>{file.path}</strong>
                      <span>{file.conflict === 'new' ? 'Novo material' : file.conflict === 'unchanged' ? 'Já está atualizado' : 'Será atualizado'}</span>
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
