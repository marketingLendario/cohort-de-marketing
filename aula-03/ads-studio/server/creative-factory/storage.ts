import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  materializeConfinedArtifact,
  materializeConfinedBinaryArtifact,
  type ConfinedMaterializeResult,
} from '../artifact-fs-worker-client.js';
import { creativeArchetypeSchema, creativeFormatSchema } from './runner.js';

const batchIdSchema = z.string().regex(/^[a-f0-9-]{16,64}$/i);
const segmentSchema = z.string().regex(/^[a-z0-9-]{1,120}$/);

const assetSchema = z.object({
  id: segmentSchema,
  format: creativeFormatSchema,
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().positive().max(30_000_000),
}).strict();

export const creativeFactoryPublicManifestSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  batchId: batchIdSchema,
  projectId: z.string().min(1).max(200),
  campaignId: z.string().min(1).max(120),
  productionSkillId: z.enum(['ads-creative-factory', 'criativos-funil', 'mockup-produto-funil']).default('ads-creative-factory'),
  status: z.literal('ready_for_review'),
  createdAt: z.string().datetime(),
  items: z.array(z.object({
    id: segmentSchema,
    status: z.enum(['ready', 'flagged']),
    archetype: z.union([creativeArchetypeSchema, z.literal('unknown')]),
    headline: z.string().max(500),
    caption: z.string().max(20_000),
    linkDescription: z.string().max(500),
    cta: z.string().max(200),
    promptSanitized: z.string().min(1).max(2_000),
    promptSha256: z.string().regex(/^[a-f0-9]{64}$/),
    gate: z.record(z.string(), z.unknown()),
    review: z.record(z.string(), z.unknown()),
    assets: z.array(assetSchema).min(1).max(3),
  }).strict()).min(1).max(36),
}).strict();

export type CreativeFactoryStoredManifest = z.infer<typeof creativeFactoryPublicManifestSchema>;

function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

function safePathSegment(value: string, fallback: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  return normalized || fallback;
}

function containsAbsolutePath(value: unknown): boolean {
  if (typeof value === 'string') return value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value);
  if (Array.isArray(value)) return value.some(containsAbsolutePath);
  return Boolean(value && typeof value === 'object' && Object.values(value as Record<string, unknown>).some(containsAbsolutePath));
}

function batchRoot(runtimeRoot: string, batchId: string): string {
  return resolve(runtimeRoot, batchIdSchema.parse(batchId));
}

export async function readCreativeFactoryManifest(runtimeRoot: string, batchId: string): Promise<CreativeFactoryStoredManifest> {
  const content = await readFile(resolve(batchRoot(runtimeRoot, batchId), 'manifest.json'), 'utf8');
  const manifest = creativeFactoryPublicManifestSchema.parse(JSON.parse(content));
  if (manifest.batchId !== batchId) throw new Error('Identidade do lote criativo não confere.');
  if (containsAbsolutePath(manifest)) throw new Error('Manifesto criativo contém path absoluto e foi recusado.');
  return manifest;
}

export async function readCreativeFactoryAsset(input: {
  runtimeRoot: string;
  batchId: string;
  assetId: string;
}): Promise<{ content: Buffer; sha256: string }> {
  const manifest = await readCreativeFactoryManifest(input.runtimeRoot, input.batchId);
  const asset = manifest.items.flatMap((item) => item.assets).find((candidate) => candidate.id === input.assetId);
  if (!asset) throw new Error('Asset criativo não encontrado no manifesto do lote.');
  const path = resolve(batchRoot(input.runtimeRoot, input.batchId), 'assets', `${segmentSchema.parse(input.assetId)}.png`);
  const noFollow = (constants as unknown as Record<string, number | undefined>).O_NOFOLLOW;
  if (typeof noFollow !== 'number') throw new Error('O runtime não suporta abertura segura de arquivos.');
  const handle = await open(path, constants.O_RDONLY | noFollow);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size !== asset.bytes) throw new Error('Asset criativo divergiu do manifesto.');
    const content = await handle.readFile();
    const digest = sha256(content);
    if (digest !== asset.sha256) throw new Error('Hash do asset criativo divergiu do manifesto.');
    return { content, sha256: digest };
  } finally {
    await handle.close();
  }
}

export interface CreativePromotionResult {
  batchId: string;
  artifactPath: string;
  artifactContent: string;
  artifactHash: string;
  promotedAssets: Array<{ itemId: string; assetId: string; relativePath: string; result: ConfinedMaterializeResult }>;
}

export async function promoteCreativeFactoryBatch(input: {
  runtimeRoot: string;
  projectsRoot: string;
  projectSlug: string;
  batchId: string;
  selectedItemIds: string[];
}): Promise<CreativePromotionResult> {
  const manifest = await readCreativeFactoryManifest(input.runtimeRoot, input.batchId);
  const selected = new Set(input.selectedItemIds.map((id) => segmentSchema.parse(id)));
  if (selected.size === 0) throw new Error('Selecione ao menos um criativo aprovado.');
  const items = manifest.items.filter((item) => selected.has(item.id));
  if (items.length !== selected.size) throw new Error('A seleção contém criativo ausente do lote.');
  if (items.some((item) => item.status !== 'ready')) throw new Error('Criativos sinalizados pelo gate não podem ser promovidos.');

  const productionRoot = manifest.productionSkillId === 'mockup-produto-funil'
    ? 'mockups/factory'
    : manifest.productionSkillId === 'criativos-funil'
      ? 'criativos/banners'
      : 'criativos/factory';
  const basePath = `${productionRoot}/${safePathSegment(manifest.campaignId, 'campaign')}/${manifest.batchId}/final`;
  const promotedAssets: CreativePromotionResult['promotedAssets'] = [];
  for (const item of items) {
    for (const asset of item.assets) {
      const source = await readCreativeFactoryAsset({ runtimeRoot: input.runtimeRoot, batchId: input.batchId, assetId: asset.id });
      const relativePath = `${basePath}/${asset.format}/${asset.id}.png`;
      const result = await materializeConfinedBinaryArtifact({
        projectsRoot: input.projectsRoot,
        slug: input.projectSlug,
        relativePath,
        content: source.content,
        hashAfter: asset.sha256,
        onConflict: 'reject',
      });
      if (result.outcome === 'conflict') throw new Error(`Conflito ao promover ${asset.id}.`);
      promotedAssets.push({ itemId: item.id, assetId: asset.id, relativePath, result });
    }
  }

  const approved = {
    schemaVersion: '1.0.0',
    batchId: manifest.batchId,
    projectId: manifest.projectId,
    campaignId: manifest.campaignId,
    productionSkillId: manifest.productionSkillId,
    approvedAt: manifest.createdAt,
    items: items.map((item) => ({
      ...item,
      assets: item.assets.map((asset) => ({
        ...asset,
        path: promotedAssets.find((entry) => entry.assetId === asset.id)?.relativePath,
      })),
    })),
  };
  const artifactContent = JSON.stringify(approved, null, 2);
  const artifactHash = sha256(artifactContent);
  const artifactPath = `${basePath}/manifest.json`;
  const manifestWrite = await materializeConfinedArtifact({
    projectsRoot: input.projectsRoot,
    slug: input.projectSlug,
    relativePath: artifactPath,
    content: artifactContent,
    hashAfter: artifactHash,
    onConflict: 'reject',
  });
  if (manifestWrite.outcome === 'conflict') throw new Error('Conflito ao promover o manifesto final.');

  const captions = items.map((item) => `## ${item.headline}\n\n${item.caption}\n\n**CTA:** ${item.cta}\n\n**Descrição do link:** ${item.linkDescription}`).join('\n\n---\n\n');
  const captionsPath = `${basePath}/legendas.md`;
  const captionsWrite = await materializeConfinedArtifact({
    projectsRoot: input.projectsRoot,
    slug: input.projectSlug,
    relativePath: captionsPath,
    content: captions,
    hashAfter: sha256(captions),
    onConflict: 'reject',
  });
  if (captionsWrite.outcome === 'conflict') throw new Error('Conflito ao promover as legendas finais.');

  return { batchId: manifest.batchId, artifactPath, artifactContent, artifactHash, promotedAssets };
}
