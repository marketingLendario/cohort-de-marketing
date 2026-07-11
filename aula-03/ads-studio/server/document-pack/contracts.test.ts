import { describe, expect, it } from 'vitest';
import { assertDocumentPackProposal, documentPackPattern, documentPackPrompt, loadDocumentPackContract, type DocumentPackContract } from './contracts.js';
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
});
