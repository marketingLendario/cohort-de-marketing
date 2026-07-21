import { describe, expect, it } from 'vitest';
import { assertDocumentPackProposal, documentPackPattern, documentPackPrompt, loadDocumentPackContract, normalizeDocumentPackArtifactTypes, normalizeDocumentPackCollectionIndexes, normalizeDocumentPackDeclaredArtifacts, type DocumentPackContract } from './contracts.js';
import { validSalesPageFixture } from './sales-page-fixture.js';

describe('document pack contracts', () => {
  const repoRoot = new URL('../../../../', import.meta.url).pathname;

  it('loads the first-cut Offerbook contract without binary prompt payloads', async () => {
    const contract = await loadDocumentPackContract(repoRoot, 'offerbook');
    expect(contract).not.toBeNull();
    expect(contract?.requiredTextOutputs.map((output) => output.path)).toEqual([
      'offerbook.md',
      'offerbook.html',
      'briefing-offerbook.md',
    ]);
    expect(documentPackPrompt(contract!)).toContain('BFF derivará: offerbook.docx via offerbook-docx');
  });

  it('rejects an incomplete generic proposal', async () => {
    const contract = await loadDocumentPackContract(repoRoot, 'offerbook');
    expect(() => assertDocumentPackProposal(contract!, {
      summary: 'incompleto',
      resultMarkdown: '# Offerbook',
      artifacts: [{ artifactType: 'offerbook', title: 'Offerbook', path: 'offerbook.md', format: 'markdown', content: '# Offerbook' }],
      fields: [],
      questions: [],
      warnings: [],
    })).toThrow('offerbook.html, briefing-offerbook.md');
  });

  it('accepts every required text source while keeping derived files outside the proposal', async () => {
    const contract = await loadDocumentPackContract(repoRoot, 'offerbook');
    expect(() => assertDocumentPackProposal(contract!, {
      summary: 'completo',
      resultMarkdown: '# Offerbook',
      artifacts: [
        { artifactType: 'offerbook', title: 'Offerbook', path: 'offerbook.md', format: 'markdown', content: '# Offerbook' },
        { artifactType: 'offerbook', title: 'Offerbook visual', path: 'offerbook.html', format: 'html', content: '<!doctype html><html><body><main><h1>Offerbook</h1><a href="index.html">Voltar ao Book</a></main></body></html>' },
        { artifactType: 'offerbook', title: 'Briefing', path: 'briefing-offerbook.md', format: 'markdown', content: '# Briefing' },
      ],
      fields: [],
      questions: [],
      warnings: [],
    })).not.toThrow();
  });

  it('enforces the production profile declared by pagina-vendas-funil', async () => {
    const contract = await loadDocumentPackContract(repoRoot, 'pagina-vendas-funil');
    expect(documentPackPrompt(contract!)).toContain('data-page-contract="sales-page-v1"');
    const proposal = {
      summary: 'Página completa',
      resultMarkdown: '# Página',
      artifacts: [
        { artifactType: 'salesPage', title: 'Mapa', path: 'pagina/pagina-vendas.md', format: 'markdown' as const, content: '# Mapa' },
        { artifactType: 'salesPage', title: 'Página', path: 'pagina/index.html', format: 'html' as const, content: validSalesPageFixture() },
      ],
      fields: [], questions: [], warnings: [],
    };
    expect(() => assertDocumentPackProposal(contract!, proposal)).not.toThrow();
    expect(() => assertDocumentPackProposal(contract!, {
      ...proposal,
      artifacts: [proposal.artifacts[0], { ...proposal.artifacts[1], content: '<main><h1>Incompleta</h1></main>' }],
    })).toThrow('Página de vendas reprovada');
  });

  it('enforces dynamic collections and conditional alternatives in v2 contracts', () => {
    const contract: DocumentPackContract = {
      skillId: 'email-funil', contractGroup: 'message-collection', versioning: 'version-directory', reconcileBook: true,
      requiredTextOutputs: [{ path: 'emails/index.html', format: 'html' }],
      optionalTextOutputs: [{ path: 'emails/obrigado.html', format: 'html' }],
      requiredCollections: [{ pathPattern: 'emails/trilha-*.html', format: 'html', minItems: 2 }],
      requiredAnyOf: [['emails/venda.html', 'emails/agendamento.html']],
      derivedOutputs: [], bookEntry: { path: 'emails/index.html', title: 'E-mails', phase: 'Peças do funil' },
    };
    const artifacts = [
      { artifactType: 'emails', title: 'Índice', path: 'emails/index.html', format: 'html' as const, content: '<main />' },
      { artifactType: 'emails', title: '1', path: 'emails/trilha-a.html', format: 'html' as const, content: '<main />' },
      { artifactType: 'emails', title: '2', path: 'emails/trilha-b.html', format: 'html' as const, content: '<main />' },
      { artifactType: 'emails', title: 'Venda', path: 'emails/venda.html', format: 'html' as const, content: '<main />' },
    ];
    expect(documentPackPattern('emails/trilha-*.html').test('emails/trilha-a.html')).toBe(true);
    expect(() => assertDocumentPackProposal(contract, { summary: '', resultMarkdown: '', artifacts, fields: [], questions: [], warnings: [] })).not.toThrow();
    expect(() => assertDocumentPackProposal(contract, { summary: '', resultMarkdown: '', artifacts: [artifacts[0], artifacts[1], artifacts[3]], fields: [], questions: [], warnings: [] })).toThrow('ao menos 2');
  });

  it('normalizes model-chosen document labels to the single canonical primary artifact type', async () => {
    const contract = await loadDocumentPackContract(repoRoot, 'bonus-funil');
    const proposal = {
      summary: 'Bônus pronto', resultMarkdown: '# Bônus', fields: [], questions: [], warnings: [],
      artifacts: [
        { artifactType: 'bonus', title: 'Índice', path: 'bonus/index.html', format: 'html' as const, content: '<main />' },
        { artifactType: 'checklist', title: 'Fonte', path: 'bonus/checklist/checklist.md', format: 'markdown' as const, content: '# Checklist' },
        { artifactType: 'checklist', title: 'Visual', path: 'bonus/checklist/checklist.html', format: 'html' as const, content: '<main />' },
        { artifactType: 'researchSnapshot', title: 'Pesquisa', path: 'research/snapshot.json', format: 'json' as const, content: '{}' },
      ],
    };

    normalizeDocumentPackArtifactTypes(contract!, proposal, ['bonuses']);

    expect(proposal.artifacts.slice(0, 3).every((artifact) => artifact.artifactType === 'bonuses')).toBe(true);
    expect(proposal.artifacts[3]?.artifactType).toBe('researchSnapshot');
  });

  it('normalizes collection indexes to links that resolve to generated HTML artifacts', () => {
    const contract: DocumentPackContract = {
      skillId: 'email-funil', contractGroup: 'message-collection', versioning: 'version-directory', reconcileBook: true,
      requiredTextOutputs: [{ path: 'emails/index.html', format: 'html', validationProfile: 'collection-index-v1' }],
      requiredCollections: [{ pathPattern: 'emails/trilha-*.html', format: 'html', minItems: 2 }],
      derivedOutputs: [], bookEntry: { path: 'emails/index.html', title: 'E-mails', phase: 'Peças do funil' },
    };
    const proposal = {
      summary: 'E-mails prontos', resultMarkdown: '# E-mails', fields: [], questions: [], warnings: [],
      artifacts: [
        { artifactType: 'emails', title: 'Índice', path: 'emails/index.html', format: 'html' as const, content: '<main><h1>E-mails</h1><a href="trilhas.md">Fonte</a></main>' },
        { artifactType: 'emails', title: 'Trilha A', path: 'emails/trilha-a.html', format: 'html' as const, content: '<main />' },
        { artifactType: 'emails', title: 'Trilha B', path: 'emails/trilha-b.html', format: 'html' as const, content: '<main />' },
      ],
    };

    normalizeDocumentPackCollectionIndexes(contract, proposal);

    expect(proposal.artifacts[0]?.content).not.toContain('href="trilhas.md"');
    expect(proposal.artifacts[0]?.content).toContain('href="trilha-a.html"');
    expect(proposal.artifacts[0]?.content).toContain('href="trilha-b.html"');
    expect(proposal.warnings).toHaveLength(1);
    expect(() => assertDocumentPackProposal(contract, proposal)).not.toThrow();
  });

  it('drops undeclared model files but preserves authoritative snapshots', async () => {
    const contract = await loadDocumentPackContract(repoRoot, 'whatsapp-funil');
    const proposal = {
      summary: 'WhatsApp pronto', resultMarkdown: '# WhatsApp', fields: [], questions: [], warnings: [],
      artifacts: [
        { artifactType: 'whatsapp', title: 'Fonte', path: 'whatsapp.md', format: 'markdown' as const, content: '# WhatsApp' },
        { artifactType: 'whatsapp', title: 'Visual', path: 'whatsapp.html', format: 'html' as const, content: '<main />' },
        { artifactType: 'whatsapp', title: 'Índice', path: 'whatsapp/index.html', format: 'html' as const, content: '<main />' },
        { artifactType: 'whatsapp', title: 'Mensagem A', path: 'whatsapp/lead-confirmado.html', format: 'html' as const, content: '<main />' },
        { artifactType: 'whatsapp', title: 'Mensagem B', path: 'whatsapp/checkout-iniciado.html', format: 'html' as const, content: '<main />' },
        { artifactType: 'whatsapp', title: 'Extra', path: 'whatsapp/venda.html', format: 'html' as const, content: '<main />' },
        { artifactType: 'researchSnapshot', title: 'Pesquisa', path: 'research/whatsapp/snapshot.json', format: 'json' as const, content: '{}' },
      ],
    };

    normalizeDocumentPackDeclaredArtifacts(contract!, proposal);

    expect(proposal.artifacts.map((artifact) => artifact.path)).not.toContain('whatsapp/venda.html');
    expect(proposal.artifacts.map((artifact) => artifact.path)).toContain('research/whatsapp/snapshot.json');
    expect(proposal.warnings[0]).toContain('whatsapp/venda.html');
  });
});
