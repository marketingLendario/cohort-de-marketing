import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { Icon } from '@/lib/lendaria-ds';
import { DEMO_AUTH_ENABLED, signOutDemo } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useSpokeStore } from '@/stores/spoke-store';
import { useProjectStore, type DEMO_PROJECT_ID } from '@/stores/project-store';
import { SystemReadiness } from './system-readiness';

interface UnifiedShellProps {
  projectId: typeof DEMO_PROJECT_ID | string;
  children: ReactNode;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Visão geral', icon: 'home-simple-door' },
  { id: 'briefing', label: 'Briefing', icon: 'edit-pencil' },
  { id: 'journey', label: 'Jornada', icon: 'network' },
  { id: 'artifacts', label: 'Artefatos', icon: 'folder' },
  { id: 'campaigns', label: 'Campanhas', icon: 'megaphone' },
  { id: 'weeks', label: 'Operação semanal', icon: 'calendar' },
] as const;

export function UnifiedShell({ projectId, children }: UnifiedShellProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { theme, setTheme } = useTheme();
  const projects = useProjectStore((state) => state.projects);
  const project = projects.find((candidate) => candidate.id === projectId);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const spokes = useSpokeStore((state) => state.spokes);
  const activeSpokeId = useSpokeStore((state) => state.activeSpokeId);
  const setActiveSpoke = useSpokeStore((state) => state.setActiveSpoke);
  const resetSpokes = useSpokeStore((state) => state.reset);

  const workspaceProjects = projects.filter((candidate) => candidate.workspaceId === (activeSpokeId ?? project?.workspaceId));
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  async function handleSignOut() {
    if (DEMO_AUTH_ENABLED) signOutDemo();
    else await supabase.auth.signOut();
    resetSpokes();
    navigate({ to: '/' });
  }

  function changeProject(nextProjectId: string) {
    setActiveProject(nextProjectId);
    navigate({ to: '/projects/$projectId/overview', params: { projectId: nextProjectId } });
  }

  return (
    <div className="asx-stage">
      <div className="asx-app al-scrollbar">
        <header className="asx-topbar cms-topbar">
          <div className="asx-topbar__left">
            <Link to="/projects" className="asx-brand cms-brand-link" aria-label="Projetos">
              <span className="asx-wordmark">
                Lendár<em>[IA]</em>
              </span>
              <span className="asx-brand__rule" />
              <span className="asx-brand__product">Marketing Studio</span>
            </Link>

            <label className="cms-select-control">
              <span className="sr-only">Projeto ativo</span>
              <Icon name="folder" size={14} />
              <select value={projectId} onChange={(event) => changeProject(event.target.value)}>
                {workspaceProjects.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                ))}
              </select>
              <Icon name="nav-arrow-down" size={12} />
            </label>
          </div>

          <div className="asx-topbar__actions">
            {spokes.length > 1 ? (
              <label className="cms-select-control cms-select-control--workspace">
                <span className="sr-only">Workspace ativo</span>
                <select value={activeSpokeId ?? ''} onChange={(event) => setActiveSpoke(event.target.value)}>
                  {spokes.map((spoke) => <option key={spoke.id} value={spoke.id}>{spoke.name}</option>)}
                </select>
              </label>
            ) : null}
            <SystemReadiness />
            <button
              className="asx-iconbtn"
              type="button"
              onClick={() => setTheme(nextTheme)}
              title="Alternar tema"
              aria-label="Alternar tema"
            >
              <Icon name={theme === 'light' ? 'half-moon' : 'sun-light'} size={16} />
            </button>
            <button className="asx-iconbtn" type="button" onClick={handleSignOut} title="Sair" aria-label="Sair">
              <Icon name="log-out" size={16} />
            </button>
          </div>
        </header>

        <div className="cms-mobile-nav al-scrollbar" aria-label="Navegação do projeto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.id === 'overview'
                ? '/projects/$projectId/overview'
                : item.id === 'briefing'
                  ? '/projects/$projectId/briefing/$sectionId'
                  : `/projects/$projectId/${item.id}` as '/projects/$projectId/journey'}
              params={item.id === 'briefing' ? { projectId, sectionId: 'project' } : { projectId }}
              className={`cms-mobile-nav__item ${pathname.includes(`/${item.id}`) ? 'is-active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="asx-body">
          <nav className="asx-stepper cms-sidebar" aria-label="Projeto">
            <div className="asx-stepper__eyebrow">Projeto ativo</div>
            <div className="cms-project-name" title={project?.name}>{project?.name ?? 'Projeto'}</div>
            <div className="cms-project-slug">{project?.slug}</div>

            <div className="cms-sidebar__nav">
              {NAV_ITEMS.map((item) => {
                const active = pathname.includes(`/${item.id}`);
                const to = item.id === 'overview'
                  ? '/projects/$projectId/overview'
                  : item.id === 'briefing'
                    ? '/projects/$projectId/briefing/$sectionId'
                    : `/projects/$projectId/${item.id}` as '/projects/$projectId/journey';
                const params = item.id === 'briefing' ? { projectId, sectionId: 'project' } : { projectId };
                return (
                  <Link key={item.id} to={to} params={params} className={`asx-step ${active ? 'asx-step--current' : 'asx-step--available'}`}>
                    <span className="asx-step__index"><Icon name={item.icon} size={13} /></span>
                    <span className="asx-step__label">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="asx-stepper__note">
              Um projeto. <span>Uma próxima ação.</span>
            </div>
          </nav>

          <main className="asx-main al-scrollbar">{children}</main>
        </div>
      </div>
    </div>
  );
}
