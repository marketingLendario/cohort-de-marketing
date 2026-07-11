import { describe, expect, it } from 'vitest';
import { validSalesPageFixture } from './sales-page-fixture.js';
import { SALES_PAGE_SECTIONS, validateSalesPageHtml } from './sales-page-validator.js';

describe('sales page production gate', () => {
  it('accepts the complete semantic contract', () => {
    expect(() => validateSalesPageHtml(validSalesPageFixture())).not.toThrow();
  });

  it('rejects missing or reordered sections', () => {
    const reordered = [...SALES_PAGE_SECTIONS];
    [reordered[1], reordered[2]] = [reordered[2], reordered[1]];
    expect(() => validateSalesPageHtml(validSalesPageFixture({ sectionOrder: reordered }))).toThrow('ordem canônica');
  });

  it('rejects broken CTA, visible methodology jargon and external stylesheets', () => {
    const invalid = validSalesPageFixture({ extraHead: '<link rel="stylesheet" href="assets/brand.css">' })
      .replace('href="#checkout"', 'href="#"')
      .replace('Conteúdo verificável.', 'Mecanismo único e prova social.');
    expect(() => validateSalesPageHtml(invalid)).toThrow(/href="#".*jargão interno visível.*stylesheet externo.*assets locais/);
  });

  it('rejects missing tracking events and form fields', () => {
    const invalid = validSalesPageFixture().replace("'Lead'", "'Purchase'").replace('name="phone"', 'name="other"');
    expect(() => validateSalesPageHtml(invalid)).toThrow(/campo phone ausente.*evento Lead ausente/);
  });
});
