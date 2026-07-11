export interface ProjectStatusView {
  schemaVersion: '1.0.0';
  projectSlug: string;
  pieces: Array<{
    id: string;
    title: string;
    path: string;
    skillId: string;
    filesystem: boolean;
    database: boolean;
    book: boolean;
    converged: boolean;
    applicable: boolean;
  }>;
  alternatives: Array<{ id: string; path: string; skillId: string }>;
  pending: { open: number; resolved: number; decisions: Array<{ key: string; resolved: boolean }> };
  completed: number;
  total: number;
  nextCommand: string;
  divergences: Array<{ pieceId: string; missing: Array<'filesystem' | 'database' | 'book'> }>;
  sourceHashes: { filesystem: string; database: string; book: string | null; pendings: string | null };
  readOnly: true;
  profile: { offerType: string | null; destination: string | null; voice: string | null; affiliate: boolean };
  guidance: string | null;
  sourceIssues: Array<'book-state-invalid'>;
}

export async function fetchProjectStatus(projectId: string, signal?: AbortSignal): Promise<ProjectStatusView> {
  const response = await fetch(`/api/local/projects/${encodeURIComponent(projectId)}/status`, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Status do projeto respondeu ${response.status}.`);
  return await response.json() as ProjectStatusView;
}
