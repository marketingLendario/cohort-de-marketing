export interface SkillProposalArtifact {
  artifactType: string;
  title: string;
  path: string;
  format: 'markdown' | 'json' | 'yaml' | 'html';
  content: string;
}

export interface SkillProposal {
  summary: string;
  resultMarkdown: string;
  artifacts: SkillProposalArtifact[];
  fields: Array<{ key: string; value: string }>;
  questions: string[];
  warnings: string[];
}

export interface SkillRuntimeResult {
  skillId: string;
  skillHash: string;
  model: string;
  proposal: SkillProposal;
}

export async function executeLocalSkill(
  skillId: string,
  input: {
    projectId: string;
    brief: Record<string, unknown>;
    context?: Record<string, unknown>;
    operatorInput?: string;
  },
): Promise<SkillRuntimeResult> {
  const baseUrl = import.meta.env.VITE_BFF_URL?.replace(/\/$/, '') ?? '';
  const response = await fetch(`${baseUrl}/api/local/skills/${encodeURIComponent(skillId)}/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({})) as { message?: string } & Partial<SkillRuntimeResult>;
  if (!response.ok) {
    throw new Error(payload.message ?? `Runner local respondeu ${response.status}.`);
  }
  if (!payload.proposal || !payload.skillHash || !payload.model || !payload.skillId) {
    throw new Error('Runner local devolveu uma resposta incompleta.');
  }
  return payload as SkillRuntimeResult;
}

export function isSkillProposal(value: unknown): value is SkillProposal {
  if (!value || typeof value !== 'object') return false;
  const proposal = value as Partial<SkillProposal>;
  return typeof proposal.summary === 'string'
    && typeof proposal.resultMarkdown === 'string'
    && Array.isArray(proposal.artifacts)
    && Array.isArray(proposal.fields)
    && Array.isArray(proposal.questions)
    && Array.isArray(proposal.warnings);
}
