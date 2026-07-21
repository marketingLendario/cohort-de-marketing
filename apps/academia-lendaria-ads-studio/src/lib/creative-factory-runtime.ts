import type { CreativeFactoryBatchManifest, ProjectArtifact } from '@/lib/project-domain';
import type { SkillProposal } from '@/lib/skill-runtime';

function baseUrl(): string {
  return import.meta.env.VITE_BFF_URL?.replace(/\/$/, '') ?? '';
}

async function readError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => ({})) as { message?: string };
  return payload.message ?? `Creative Factory respondeu ${response.status}.`;
}

export function manifestFromProposal(proposal: SkillProposal): CreativeFactoryBatchManifest {
  const artifact = proposal.artifacts.find((candidate) => candidate.artifactType === 'creativeFactoryBatch');
  if (!artifact) throw new Error('O runner não devolveu o manifesto do lote criativo.');
  const manifest = JSON.parse(artifact.content) as CreativeFactoryBatchManifest;
  if (manifest.schemaVersion !== '1.0.0' || !manifest.batchId || !Array.isArray(manifest.items)) {
    throw new Error('O manifesto criativo devolvido pelo runner é incompatível.');
  }
  return manifest;
}

export function creativeAssetUrl(batchId: string, assetId: string): string {
  return `${baseUrl()}/api/local/creative-factory/batches/${encodeURIComponent(batchId)}/assets/${encodeURIComponent(assetId)}`;
}

export interface CreativePromotionResponse {
  batchId: string;
  artifactPath: string;
  artifactContent: string;
  artifactHash: string;
  promotedAssets: Array<{ itemId: string; assetId: string; relativePath: string }>;
}

export async function promoteCreativeBatch(input: {
  batchId: string;
  projectId: string;
  selectedItemIds: string[];
}): Promise<CreativePromotionResponse> {
  const response = await fetch(`${baseUrl()}/api/local/creative-factory/batches/${encodeURIComponent(input.batchId)}/promote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ projectId: input.projectId, selectedItemIds: input.selectedItemIds }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as CreativePromotionResponse;
}

export function promotionArtifact(input: {
  workspaceId: string;
  projectId: string;
  response: CreativePromotionResponse;
  artifactType?: string;
  title?: string;
}): Omit<ProjectArtifact, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    artifactType: input.artifactType ?? 'creativeFactoryBatch',
    title: input.title ?? 'Pacote criativo aprovado',
    path: input.response.artifactPath,
    format: 'json',
    state: 'confirmed',
    verification: 'confirmed',
    source: 'skill_run',
    hash: input.response.artifactHash,
    content: input.response.artifactContent,
  };
}
