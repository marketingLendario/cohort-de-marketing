import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  computeProposalHash,
  createArtifactApprovalService,
  createInMemoryArtifactApprovalStore,
  type ApprovalArtifactInput,
  type ApprovalRunGateway,
  type ApprovalRunState,
  type FinalizeApprovalInput,
} from '../artifact-approval.js';
import { createDocumentPackApprovalDeriver } from './approval-deriver.js';
import { validSalesPageFixture } from './sales-page-fixture.js';

const realIt = process.env.DOCUMENT_PACK_REAL_RENDER === '1' ? it : it.skip;
const repoRoot = new URL('../../../../', import.meta.url).pathname;
const sha256 = (content: Buffer | string) => createHash('sha256').update(content).digest('hex');

function offerbookArtifacts(version: string): ApprovalArtifactInput[] {
  return [
    { artifactType: 'offerbook', title: 'Offerbook', path: 'offerbook.md', format: 'markdown', content: `# Offerbook ${version}\n\n## Bloco 1 - Materiais\n\n### Links\n\nhttps://example.test/${version}\n` },
    { artifactType: 'offerbook', title: 'Offerbook HTML', path: 'offerbook.html', format: 'html', content: `<main><h1>Offerbook ${version}</h1><a href="index.html">Voltar ao Book</a></main>` },
    { artifactType: 'offerbook', title: 'Briefing', path: 'briefing-offerbook.md', format: 'markdown', content: `# Briefing ${version}\n` },
  ];
}

describe('document pack real approval integration', () => {
  let projectsRoot = '';
  afterEach(async () => rm(projectsRoot, { recursive: true, force: true }));

  realIt('promotes canonical and immutable revisions through the repairable approval saga', async () => {
    projectsRoot = await mkdtemp(join(tmpdir(), 'document-pack-approval-'));
    const firstArtifacts = offerbookArtifacts('v1');
    const state: ApprovalRunState = {
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      projectSlug: 'prova-document-pack',
      skillId: 'offerbook',
      status: 'needs_review',
      proposalRevision: 1,
      proposalHash: computeProposalHash(firstArtifacts),
    };
    const finalized: FinalizeApprovalInput[] = [];
    const gateway: ApprovalRunGateway = {
      async getRunState() { return { ...state }; },
      async finalizeApproval(input) {
        finalized.push(input);
        state.status = 'done';
        return { committed: true };
      },
      async finalizeRejection() { return { committed: false }; },
    };
    const store = createInMemoryArtifactApprovalStore();
    let failBeforeWrite = true;
    const service = createArtifactApprovalService({
      store,
      runs: gateway,
      projectsRoot,
      deriveArtifacts: createDocumentPackApprovalDeriver({ repoRoot, projectsRoot }),
      faults: { beforeRename() { if (failBeforeWrite) { failBeforeWrite = false; throw new Error('injected pre-write crash'); } } },
    });

    const firstDecision = {
      skillRunId: 'offerbook-run',
      decision: 'approve',
      expectedProposalHash: computeProposalHash(firstArtifacts),
      expectedProposalRevision: 1,
      idempotencyKey: 'offerbook-run:r1:approve',
      artifacts: firstArtifacts,
    } as const;
    await expect(service.decide(firstDecision)).rejects.toMatchObject({ code: 'write-failed' });
    await expect(readFile(resolve(projectsRoot, state.projectSlug, 'index.html'))).rejects.toThrow();
    const stuck = await store.getByKey(state.workspaceId, firstDecision.idempotencyKey);
    const first = await service.repair(stuck!.id);
    expect(first.state).toBe('done');
    expect(first.plan).toHaveLength(10);
    const firstDocx = await readFile(resolve(projectsRoot, state.projectSlug, 'offerbook-v1.docx'));
    expect(firstDocx.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    const firstPromotionHashes = new Map<string, string>();
    for (const artifact of finalized[0].artifacts) {
      firstPromotionHashes.set(artifact.path, sha256(await readFile(resolve(projectsRoot, state.projectSlug, artifact.path))));
    }

    const secondArtifacts = offerbookArtifacts('v2');
    state.status = 'needs_review';
    state.proposalRevision = 2;
    state.proposalHash = computeProposalHash(secondArtifacts);
    const second = await service.decide({
      skillRunId: 'offerbook-run',
      decision: 'approve',
      expectedProposalHash: computeProposalHash(secondArtifacts),
      expectedProposalRevision: 2,
      idempotencyKey: 'offerbook-run:r2:approve',
      artifacts: secondArtifacts,
    });

    expect(second.state).toBe('done');
    expect(second.plan).toHaveLength(10);
    expect(await readFile(resolve(projectsRoot, state.projectSlug, 'offerbook-v1.md'), 'utf8')).toBe(firstArtifacts[0].content);
    expect(await readFile(resolve(projectsRoot, state.projectSlug, 'offerbook-v2.md'), 'utf8')).toBe(secondArtifacts[0].content);
    expect(await readFile(resolve(projectsRoot, state.projectSlug, 'offerbook.md'), 'utf8')).toBe(secondArtifacts[0].content);
    expect(await readFile(resolve(projectsRoot, state.projectSlug, 'index.html'), 'utf8')).toContain('VOCÊ ESTÁ AQUI:');
    expect(JSON.parse(await readFile(resolve(projectsRoot, state.projectSlug, 'book-do-funil.json'), 'utf8')).cards[0].versions).toHaveLength(2);
    expect(await readFile(resolve(projectsRoot, state.projectSlug, 'offerbook-v1.docx'))).toEqual(firstDocx);

    const currentDocx = await readFile(resolve(projectsRoot, state.projectSlug, 'offerbook.docx'));
    const secondDocx = await readFile(resolve(projectsRoot, state.projectSlug, 'offerbook-v2.docx'));
    expect(currentDocx).toEqual(secondDocx);
    expect(finalized).toHaveLength(2);
    for (const artifact of finalized[0].artifacts) {
      expect(artifact.contentHash).toBe(firstPromotionHashes.get(artifact.path));
    }
    for (const artifact of finalized[1].artifacts) {
      expect(artifact.contentHash).toBe(sha256(await readFile(resolve(projectsRoot, state.projectSlug, artifact.path))));
    }
    console.info('DOCUMENT_PACK_APPROVAL_EVIDENCE', JSON.stringify({
      revisions: [1, 2],
      filesPerRevision: 10,
      firstDocxHash: sha256(firstDocx),
      secondDocxHash: sha256(secondDocx),
      dbArtifactHashesMatchedFilesystem: true,
    }));
  }, 180_000);

  realIt('promotes copy and sales-page PDF packs and accumulates their cards in the Book', async () => {
    projectsRoot = await mkdtemp(join(tmpdir(), 'document-pack-funnel-'));
    const copyArtifacts: ApprovalArtifactInput[] = [
      { artifactType: 'copy', title: 'Copy', path: 'copy.md', format: 'markdown', content: '# Copy aprovada\n' },
      { artifactType: 'copy', title: 'Copy HTML', path: 'copy.html', format: 'html', content: '<main><h1>Copy aprovada</h1><a href="index.html">Voltar ao Book</a></main>' },
    ];
    const state: ApprovalRunState = {
      workspaceId: 'workspace-1', projectId: 'project-1', projectSlug: 'funil-document-pack', skillId: 'copy-funil',
      status: 'needs_review', proposalRevision: 1, proposalHash: computeProposalHash(copyArtifacts),
    };
    const finalized: FinalizeApprovalInput[] = [];
    const gateway: ApprovalRunGateway = {
      async getRunState() { return { ...state }; },
      async finalizeApproval(input) { finalized.push(input); state.status = 'done'; return { committed: true }; },
      async finalizeRejection() { return { committed: false }; },
    };
    const service = createArtifactApprovalService({
      store: createInMemoryArtifactApprovalStore(), runs: gateway, projectsRoot,
      deriveArtifacts: createDocumentPackApprovalDeriver({ repoRoot, projectsRoot }),
    });
    const copy = await service.decide({
      skillRunId: 'copy-run', decision: 'approve', expectedProposalHash: computeProposalHash(copyArtifacts),
      expectedProposalRevision: 1, idempotencyKey: 'copy-run:r1:approve', artifacts: copyArtifacts,
    });
    expect(copy.plan).toHaveLength(8);
    expect((await readFile(resolve(projectsRoot, state.projectSlug, 'copy.pdf'))).subarray(0, 5).toString()).toBe('%PDF-');

    const pageArtifacts: ApprovalArtifactInput[] = [
      { artifactType: 'salesPage', title: 'Página', path: 'pagina/pagina-vendas.md', format: 'markdown', content: '# Página aprovada\n' },
      { artifactType: 'salesPage', title: 'Página HTML', path: 'pagina/index.html', format: 'html', content: validSalesPageFixture() },
    ];
    state.skillId = 'pagina-vendas-funil';
    state.status = 'needs_review';
    state.proposalRevision = 1;
    state.proposalHash = computeProposalHash(pageArtifacts);
    const page = await service.decide({
      skillRunId: 'page-run', decision: 'approve', expectedProposalHash: computeProposalHash(pageArtifacts),
      expectedProposalRevision: 1, idempotencyKey: 'page-run:r1:approve', artifacts: pageArtifacts,
    });
    expect(page.plan).toHaveLength(8);
    expect((await readFile(resolve(projectsRoot, state.projectSlug, 'pagina/index.pdf'))).subarray(0, 5).toString()).toBe('%PDF-');
    const book = JSON.parse(await readFile(resolve(projectsRoot, state.projectSlug, 'book-do-funil.json'), 'utf8'));
    expect(book.cards.map((card: { id: string }) => card.id)).toEqual(['copy-funil', 'pagina-vendas-funil']);
    expect(await readFile(resolve(projectsRoot, state.projectSlug, 'index.html'), 'utf8')).not.toMatch(/href="[^"]+\.md"/);
    for (const artifact of finalized[1].artifacts) {
      expect(artifact.contentHash).toBe(sha256(await readFile(resolve(projectsRoot, state.projectSlug, artifact.path))));
    }
  }, 180_000);
});
