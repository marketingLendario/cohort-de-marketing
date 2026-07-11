import { useState } from 'react';
import { Button, Icon } from '@/lib/lendaria-ds';
import type { ProjectArtifact } from '@/lib/project-domain';
import type { ApprovalArtifactInput, ApprovalPlan, FileChangeType } from '@/lib/artifact-approval';

/**
 * STORY-8.W2.3 — Phase-1 review (presentational). Shows the ACCURATE diff (from
 * the BFF plan), the affected files, the write warnings and the downstream
 * invalidations BEFORE any write, then emits approve / reject / edit intents.
 * The journey owns the orchestration (plan fetch, decide, cache reflection).
 *
 * Reuses the existing compact workflow styling (`cms-proposal-review`) — no
 * marketing hero/cards, no decorative redesign.
 */
const CHANGE_LABELS: Record<FileChangeType, string> = {
  create: 'novo',
  modify: 'atualiza',
  unchanged: 'sem mudança',
};

export interface ArtifactApprovalReviewProps {
  proposalSummary: string;
  artifacts: ApprovalArtifactInput[];
  /** Backend diff (real mode). `null` in demo mode or while the plan loads. */
  plan: ApprovalPlan | null;
  planLoading?: boolean;
  /** Warnings carried by the skill proposal itself. */
  proposalWarnings: string[];
  /** Skill-specific action the operator must complete before approval. */
  workflowHint?: string;
  /** Existing artifacts this decision would mark stale (downstream). */
  invalidations: ProjectArtifact[];
  onApprove: () => void;
  onReject: () => void;
  /** Optional edit affordance — creates a new proposal revision (AC5). */
  onEdit?: (edited: ApprovalArtifactInput[]) => void;
  busy?: boolean;
  error?: string | null;
}

export function ArtifactApprovalReview({
  proposalSummary,
  artifacts,
  plan,
  planLoading = false,
  proposalWarnings,
  workflowHint,
  invalidations,
  onApprove,
  onReject,
  onEdit,
  busy = false,
  error = null,
}: ArtifactApprovalReviewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(artifacts[0]?.content ?? '');

  const warnings = [...(plan?.warnings ?? []), ...proposalWarnings];
  // Affected files: the accurate backend diff when present, else the proposal's
  // own artifact paths (demo/loading — a create-only view without a filesystem).
  const files = plan?.files
    ?? artifacts.map((artifact) => ({
      path: artifact.path,
      artifactType: artifact.artifactType,
      format: artifact.format,
      changeType: 'create' as FileChangeType,
      hashBefore: null,
      hashAfter: '',
      addedLines: 0,
      removedLines: 0,
      preview: [] as string[],
    }));

  function saveEdit() {
    if (!onEdit || !artifacts[0]) return;
    const [first, ...rest] = artifacts;
    onEdit([{ ...first, content: draft }, ...rest]);
    setEditing(false);
  }

  return (
    <div className="cms-proposal-review" data-testid="artifact-approval-review">
      <strong>Proposta para revisão</strong>
      <p>{proposalSummary}</p>

      <div className="cms-approval-section">
        <span className="cms-approval-label">
          Arquivos afetados {planLoading ? '· carregando diff…' : ''}
        </span>
        <ul className="cms-approval-files">
          {files.map((file) => (
            <li key={file.path} className="cms-approval-file">
              <Icon name="page" size={12} />
              <code>{file.path}</code>
              <span className={`cms-approval-change is-${file.changeType}`}>{CHANGE_LABELS[file.changeType]}</span>
              {file.changeType === 'modify' ? (
                <em className="cms-approval-delta">+{file.addedLines} −{file.removedLines}</em>
              ) : null}
            </li>
          ))}
        </ul>
        {files.map((file) =>
          file.preview.length ? (
            <pre key={`diff-${file.path}`} className="cms-approval-diff" aria-label={`Diff de ${file.path}`}>
              {file.preview.join('\n')}
            </pre>
          ) : null,
        )}
      </div>

      {warnings.length ? (
        <div className="cms-approval-section">
          <span className="cms-approval-label">Avisos</span>
          <ul className="cms-approval-warnings">
            {warnings.map((warning) => (
              <li key={warning}>
                <Icon name="warning-triangle" size={12} /> {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {workflowHint ? (
        <div className="cms-approval-section cms-approval-hint">
          <span className="cms-approval-label">Próxima decisão humana</span>
          <p>{workflowHint}</p>
        </div>
      ) : null}

      {invalidations.length ? (
        <div className="cms-approval-section">
          <span className="cms-approval-label">Invalidações a jusante</span>
          <ul className="cms-approval-invalidations">
            {invalidations.map((artifact) => (
              <li key={artifact.id}>
                <Icon name="refresh-double" size={12} /> {artifact.title}
                <small>{artifact.path || artifact.artifactType}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {editing ? (
        <div className="cms-approval-edit">
          <label className="cms-operator-input">
            <span>Editar proposta (gera nova revisão)</span>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
          </label>
          <div>
            <Button size="sm" onClick={saveEdit} disabled={busy}>
              <Icon name="check" size={12} /> Salvar edição
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={busy}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button size="sm" onClick={onApprove} disabled={busy}>
            <Icon name="check" size={12} /> Aprovar
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} disabled={busy}>
            <Icon name="xmark" size={12} /> Rejeitar
          </Button>
          {onEdit ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft(artifacts[0]?.content ?? '');
                setEditing(true);
              }}
              disabled={busy}
            >
              <Icon name="edit-pencil" size={12} /> Editar
            </Button>
          ) : null}
        </div>
      )}

      {error ? <span className="cms-approval-error">{error}</span> : null}
    </div>
  );
}
