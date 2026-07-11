import { describe, expect, it } from 'vitest';
import { parseBookDoFunilState, reconcileBookDoFunil, renderBookDoFunil } from './book-reconciler.js';

describe('Book do Funil reconciler', () => {
  it('creates the canonical hub with HTML-only links and progress marker', () => {
    const first = reconcileBookDoFunil({
      prior: parseBookDoFunilState(null, 'demo'),
      skillId: 'offerbook',
      title: 'Offerbook',
      revision: 1,
      canonicalHtmlPath: 'offerbook.html',
      immutableHtmlPath: 'offerbook.r1.html',
    });
    const second = reconcileBookDoFunil({
      prior: first,
      skillId: 'offerbook',
      title: 'Offerbook',
      revision: 2,
      canonicalHtmlPath: 'offerbook.html',
      immutableHtmlPath: 'offerbook.r2.html',
    });
    expect(second.cards[0].versions.map((version) => version.revision)).toEqual([2, 1]);
    const html = renderBookDoFunil(second);
    expect(html).toContain('VOCÊ ESTÁ AQUI:');
    expect(html).toContain('/design-md');
    expect(html).toContain('Os arquivos continuam no disco.');
    expect(html).not.toMatch(/href="[^"]+\.md"/);
  });

  it('rejects unsafe links and incompatible existing state', () => {
    expect(() => reconcileBookDoFunil({
      prior: parseBookDoFunilState(null, 'demo'),
      skillId: 'offerbook',
      title: 'Offerbook',
      revision: 1,
      canonicalHtmlPath: '../outside.html',
      immutableHtmlPath: 'offerbook.r1.html',
    })).toThrow('Link inválido');
    expect(() => parseBookDoFunilState('{"schemaVersion":"0"}', 'demo')).toThrow('incompatível');
  });
});
