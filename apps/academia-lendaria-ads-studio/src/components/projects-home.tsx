import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Icon } from '@/lib/lendaria-ds';
import { useProjectStore } from '@/stores/project-store';
import { useSpokeStore } from '@/stores/spoke-store';
import { DEMO_AUTH_ENABLED, signOutDemo } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';

export function ProjectsHome() {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
  const createProject = useProjectStore((state) => state.createProject);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const activeSpokeId = useSpokeStore((state) => state.activeSpokeId);
  const resetSpokes = useSpokeStore((state) => state.reset);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const visibleProjects = projects.filter((project) => !activeSpokeId || project.workspaceId === activeSpokeId);

  function openProject(projectId: string) {
    setActiveProject(projectId);
    navigate({ to: '/projects/$projectId/overview', params: { projectId } });
  }

  function submitProject(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !activeSpokeId) return;
    const projectId = createProject(activeSpokeId, name.trim());
    openProject(projectId);
  }

  async function signOut() {
    if (DEMO_AUTH_ENABLED) signOutDemo();
    else await supabase.auth.signOut();
    resetSpokes();
    navigate({ to: '/' });
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
          <Button onClick={() => setCreating((value) => !value)}>
            <Icon name={creating ? 'xmark' : 'plus'} size={14} />
            {creating ? 'Cancelar' : 'Novo projeto'}
          </Button>
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
              <Button type="submit" disabled={!name.trim() || !activeSpokeId}>Criar e abrir</Button>
            </div>
          </form>
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

