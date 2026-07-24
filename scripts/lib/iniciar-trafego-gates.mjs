import { createHash } from 'node:crypto';
import {
  assertPreservedSections,
  mergePanelYamlPreserving,
} from './iniciar-trafego/panel-yaml-merge.mjs';
import {
  missingArtifactsFromBindings,
  readBoundFile,
  resolveArtifactBindings,
} from './iniciar-trafego/artifact-resolution.mjs';
import { buildCanonicalInput, detectConversionMode } from './iniciar-trafego/semantic-bridge.mjs';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const TEMPLATE_REL = '.claude/skills/_shared/squad-trafego/painel-da-semana-tmpl.yaml';
export const PANEL_REL = 'trafego/PAINEL-DA-SEMANA.yaml';

export const NIVEL_ENUM = new Set([
  'inconsciente',
  'consciente_do_problema',
  'consciente_da_solucao',
  'consciente_do_produto',
  'mais_consciente',
]);

const GUIDE_PAGE = { id: 'guia-publicar-pagina', label: 'pagina publicada (URL https)' };
const GUIDE_PIXEL = { id: 'guia-pixel-capi', label: 'pixel plugado no HTML publicado' };
const GUIDE_CHECKOUT = { id: 'guia-produto-e-checkout', label: 'checkout Hotmart com sck na mesma URL' };
const GUIDE_META = { id: 'guia-meta-fundacao', label: 'conta de anuncios / BM configurados' };

export function isHttpsUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' && u.hostname.length > 0;
  } catch {
    return false;
  }
}

export function readProjectFile(projectRoot, rel) {
  const p = join(projectRoot, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

export function stripHtmlComments(html) {
  return String(html ?? '').replace(/<!--[\s\S]*?-->/g, '');
}

export function parseLocaleNumber(raw) {
  const s = String(raw).trim().replace(/R\$\s*/i, '');
  if (!s) return NaN;
  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) return Number(s.replace(/\./g, '').replace(',', '.'));
    return Number(s.replace(/,/g, ''));
  }
  if (s.includes(',')) {
    const [, dec] = s.split(',');
    if (dec?.length === 2) return Number(s.replace(',', '.'));
    return Number(s.replace(/,/g, ''));
  }
  return Number(s);
}

export function detectPixel(html) {
  return inspectPixel(html).ok;
}

export function inspectPixel(html) {
  const stripped = stripHtmlComments(html);
  const prepared = /fbq\s*\(|connect\.facebook\.net\/[^"']+\/fbevents\.js/i.test(stripped);
  const placeholder = /\[PLUG:|SEU_PIXEL_ID|YOUR_PIXEL_ID|PIXEL_ID|fbq\s*\(\s*['"]init['"]\s*,\s*['"]\s*['"]/i.test(stripped);
  const pixelId = stripped.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]([0-9]{5,})['"]/i)?.[1] ?? null;
  const events = [...stripped.matchAll(/fbq\s*\(\s*['"]track(?:Custom)?['"]\s*,\s*['"]([^'"]+)['"]/gi)]
    .map((match) => match[1]);
  const expectedEvent = events.some((event) => /^(PageView|ViewContent|Lead|CompleteRegistration|Purchase)$/i.test(event));
  return {
    prepared,
    ok: prepared && !placeholder && Boolean(pixelId) && expectedEvent,
    pixelId,
    events,
    reason: !prepared
      ? 'PIXEL_SNIPPET_MISSING'
      : placeholder || !pixelId
        ? 'PIXEL_ID_PLACEHOLDER'
        : !expectedEvent
          ? 'PIXEL_EVENT_MISSING'
          : null,
  };
}

export function inspectConversionDestination(html, conversionMode = 'direct_checkout') {
  const body = stripHtmlComments(String(html ?? ''));
  if (conversionMode === 'application_call' || conversionMode === 'lead_capture') {
    const formActions = [...body.matchAll(/<form\b[^>]*\baction\s*=\s*["']([^"']+)["'][^>]*>/gi)]
      .map((match) => match[1].trim());
    const schedulingUrls = [...body.matchAll(/https?:\/\/[^\s"'<>]+/gi)]
      .map((match) => match[0])
      .filter((url) => /(calendly|cal\.com|hubspot|typeform|tally\.so|forms\.gle|meetings)/i.test(url));
    const destination = [...formActions, ...schedulingUrls]
      .find((value) => value && value !== '#' && !/\[PLUG:|placeholder|javascript:/i.test(value)) ?? null;
    const leadEvent = /fbq\s*\(\s*['"]track(?:Custom)?['"]\s*,\s*['"](?:Lead|CompleteRegistration)['"]/i.test(body);
    return {
      mode: conversionMode,
      result: destination && leadEvent ? 'pass' : 'fail',
      ok: Boolean(destination && leadEvent),
      destination,
      event: leadEvent ? 'Lead' : null,
      reason: !destination ? 'APPLICATION_DESTINATION_MISSING' : !leadEvent ? 'LEAD_EVENT_MISSING' : null,
    };
  }
  const checkoutUrls = [...body.matchAll(/https?:\/\/pay\.hotmart\.com[^\s"'<>]*/gi)].map((match) => match[0]);
  const destination = checkoutUrls.find((url) => {
    if (/\[PLUG:|placeholder|SEU_|YOUR_/i.test(url)) return false;
    try {
      const parsed = new URL(url.replace(/&amp;/g, '&'));
      return parsed.protocol === 'https:' && parsed.hostname === 'pay.hotmart.com' && Boolean(parsed.searchParams.get('sck'));
    } catch {
      return false;
    }
  }) ?? null;
  return {
    mode: conversionMode,
    result: destination ? 'pass' : 'fail',
    ok: Boolean(destination),
    destination,
    event: null,
    reason: destination ? null : 'CHECKOUT_URL_WITH_SCK_MISSING',
  };
}

export function detectCheckout(_projectRoot, _offerbookText, html, conversionMode = 'direct_checkout') {
  return inspectConversionDestination(html, conversionMode).ok;
}

export function parseTicketAndMargin(offerbookText) {
  let ticket = null;
  let margem_pct = null;
  if (!offerbookText) return { ticket, margem_pct, valid: false };
  const ticketMatch = offerbookText.match(/(?:ticket|preco|preço|price)\s*[:=]\s*R?\$?\s*([\d.,]+)/i);
  if (ticketMatch) ticket = parseLocaleNumber(ticketMatch[1]);
  const marginMatch = offerbookText.match(/margem(?:_pct)?\s*[:=]\s*([\d.,]+)/i);
  if (marginMatch) {
    let m = parseLocaleNumber(marginMatch[1]);
    if (m > 1) m = m / 100;
    margem_pct = m;
  }
  const valid = Number.isFinite(ticket) && ticket > 0 && Number.isFinite(margem_pct) && margem_pct > 0 && margem_pct <= 1;
  return { ticket, margem_pct, valid };
}

export function computeProjection(ticket, margem_pct) {
  if (!(ticket > 0) || !(margem_pct > 0 && margem_pct <= 1)) {
    throw new Error('Entrada invalida para projecao');
  }
  return {
    roas_break_even: 1 / margem_pct,
    cac_break_even: ticket * margem_pct,
  };
}

export function parseFunilNivel(funilText) {
  if (!funilText) return null;
  const m = funilText.match(/nivel(?:_de_|_)?consciencia\s*[:=]\s*["']?([\w_-]+)/i);
  if (m) {
    const n = m[1].toLowerCase().replace(/-/g, '_');
    if (NIVEL_ENUM.has(n)) return n;
  }
  const prose = funilText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/nivel\s*4[^\r\n]*(consciente\s+do\s+problema|problema)/.test(prose)) return 'consciente_do_problema';
  if (/nivel\s*3[^\r\n]*(consciente\s+da\s+solucao|solucao)/.test(prose)) return 'consciente_da_solucao';
  if (/nivel\s*2[^\r\n]*(consciente\s+do\s+produto|produto)/.test(prose)) return 'consciente_do_produto';
  if (/nivel\s*1[^\r\n]*(mais\s+consciente)/.test(prose)) return 'mais_consciente';
  if (/nivel\s*5[^\r\n]*(inconsciente|captacao\s+fria)/.test(prose)) return 'inconsciente';
  return null;
}

export function parseApprovalText(text) {
  if (!text || typeof text !== 'string') return { approved: false, reason: 'empty' };
  const t = text.trim().toLowerCase();
  if (/\b(n[aã]o\s+aprovo|rejeito|ainda\s+n[aã]o|espere|calma|n[aã]o\s+pode\s+gravar|nao\s+aprovo)\b/.test(t)) {
    return { approved: false, reason: 'explicit_reject' };
  }
  if (/\b(aprovo|pode\s+gravar|confirmo|autorizo|sim[,]?\s+pode|gravar\s+sim)\b/.test(t)) {
    return { approved: true, reason: 'explicit_approve' };
  }
  return { approved: false, reason: 'no_signal' };
}

export function proposalSourceHash(assessment) {
  return createHash('sha256')
    .update([assessment.copy ?? '', assessment.funil ?? '', assessment.html ?? ''].join('\n'))
    .digest('hex')
    .slice(0, 16);
}

const REJECT_LANDING_HOSTS = [
  /^pay\.hotmart\.com$/i,
  /^fonts\.googleapis\.com$/i,
  /^fonts\.gstatic\.com$/i,
  /^connect\.facebook\.net$/i,
  /^www\.googletagmanager\.com$/i,
];

function isLandingUrl(url) {
  if (!isHttpsUrl(url)) return false;
  try {
    const u = new URL(url.trim());
    if (REJECT_LANDING_HOSTS.some((re) => re.test(u.hostname))) return false;
    if (/\.(css|js|png|jpe?g|webp|svg|woff2?|ico)(\?|$)/i.test(u.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

function readDeploymentRecord(projectRoot) {
  const p = join(projectRoot, 'pagina/deployment.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function extractPublishedUrl(copyText, html, projectRoot = null) {
  void copyText;
  void html;
  if (!projectRoot) return '';
  const dep = readDeploymentRecord(projectRoot);
  if (dep?.status === 'verified' && dep?.url && isLandingUrl(dep.url)) return dep.url.trim();
  for (const rel of ['project-manifest.json', '.aiox/iniciar-trafego/config.json']) {
    const raw = readProjectFile(projectRoot, rel);
    if (!raw) continue;
    try {
      const config = JSON.parse(raw);
      const page = config.pageDeployment ?? config.deployment ?? null;
      if (page?.status === 'verified' && page?.url && isLandingUrl(page.url)) return page.url.trim();
    } catch {
      // Configuração inválida não vira evidência positiva.
    }
  }
  return '';
}

export function hashTree(projectRoot) {
  const h = createHash('sha256');
  for (const rel of ['avatar.md', 'copy.md', 'funil.md', 'offerbook.md', 'DESIGN.md', 'pagina/index.html', PANEL_REL]) {
    const p = join(projectRoot, rel);
    h.update(rel);
    h.update(existsSync(p) ? readFileSync(p) : Buffer.from(''));
  }
  h.update('trafego-dir');
  h.update(existsSync(join(projectRoot, 'trafego')) ? '1' : '0');
  return h.digest('hex');
}

function structuredCheck({
  id,
  code,
  result,
  artifactKey,
  binding,
  evidence,
  routeCommand,
}) {
  return {
    id,
    code,
    result,
    severity: 'critical',
    artifact: {
      key: artifactKey,
      path: binding?.path ?? null,
      sha256: binding?.sha256 ?? null,
    },
    evidence,
    blockingPhase: 'assessment',
    routeCommand,
  };
}

export function assessProject(projectRoot, repoRoot) {
  const resolution = resolveArtifactBindings(projectRoot);
  const { canonical } = buildCanonicalInput(projectRoot, { resolution });
  const missingArtifacts = missingArtifactsFromBindings(resolution);
  const html = readBoundFile(projectRoot, resolution.bindings, 'salesPage');
  const offerbook = readBoundFile(projectRoot, resolution.bindings, 'offerbook');
  const funil = readBoundFile(projectRoot, resolution.bindings, 'funnel');
  const copy = readBoundFile(projectRoot, resolution.bindings, 'copy');
  const conversionMode = canonical.conversionMode ?? detectConversionMode(funil, offerbook);

  const publishedUrl = extractPublishedUrl(copy, html, projectRoot);
  const pageOk = isHttpsUrl(publishedUrl) && isLandingUrl(publishedUrl);
  const deployment = readDeploymentRecord(projectRoot);
  const pixelEvidence = inspectPixel(html);
  const pixelOk = pageOk && deployment?.remotePixelOk === true;
  const checkoutOk = conversionMode === 'direct_checkout'
    ? pageOk && deployment?.remoteCheckoutOk === true
    : pageOk && deployment?.remoteConversionOk === true;
  const conversionEvidence = deployment?.conversionEvidence ?? {
    mode: conversionMode,
    result: checkoutOk ? 'pass' : 'fail',
    ok: checkoutOk,
    destination: null,
    event: null,
    reason: conversionMode === 'direct_checkout'
      ? 'CHECKOUT_URL_WITH_SCK_MISSING'
      : 'APPLICATION_DESTINATION_MISSING',
  };
  const economics = parseTicketAndMargin(offerbook);
  const funilNivel = parseFunilNivel(funil);

  const critical = [];
  if (!pageOk) critical.push(GUIDE_PAGE);
  if (!pixelOk) critical.push(GUIDE_PIXEL);
  if (conversionMode === 'direct_checkout' && !checkoutOk) critical.push(GUIDE_CHECKOUT);
  if (conversionMode !== 'direct_checkout' && !checkoutOk) {
    critical.push({ id: 'guia-aplicacao-call', label: 'destino de aplicação/call e evento de lead operacionais' });
  }

  const advisory = [];
  advisory.push(GUIDE_META);
  if (conversionMode === 'application_call') {
    advisory.push({ id: 'guia-aplicacao-call', label: 'destino de aplicacao/call configurado' });
  }

  const blocksProposal = missingArtifacts.length > 0
    || critical.length > 0
    || !funilNivel
    || !economics.valid;

  let proposalDryRun = { ok: false };
  if (!blocksProposal) {
    try {
      buildProposal({
        canonical,
        bindings: resolution.bindings,
        conversionMode,
        copy,
        funil,
        funilNivel,
        publishedUrl,
        economics,
      });
      proposalDryRun = { ok: true };
    } catch (error) {
      proposalDryRun = { ok: false, error: error.message };
    }
  }

  const checks = [
    structuredCheck({
      id: 'page',
      code: pageOk ? 'PAGE_VERIFIED' : 'BLOCKED_PAGE_NOT_PUBLISHED',
      result: pageOk ? 'pass' : deployment?.status === 'unverified' ? 'unverified' : 'fail',
      artifactKey: 'salesPage',
      binding: resolution.bindings.salesPage,
      evidence: deployment
        ? {
            source: 'pagina/deployment.json',
            status: deployment.status,
            verifiedAt: deployment.verifiedAt ?? null,
            origin: deployment.origin ?? null,
          }
        : null,
      routeCommand: 'node scripts/iniciar-trafego.mjs set-page-url --project=<project> --url=https://...',
    }),
    structuredCheck({
      id: 'pixel',
      code: pixelOk ? 'PIXEL_OPERATIONAL' : pixelEvidence.reason ?? 'PIXEL_NOT_OPERATIONAL',
      result: pixelOk ? 'pass' : pixelEvidence.prepared ? 'unverified' : 'fail',
      artifactKey: 'salesPage',
      binding: resolution.bindings.salesPage,
      evidence: {
        prepared: pixelEvidence.prepared,
        localPixelId: pixelEvidence.pixelId,
        localEvents: pixelEvidence.events,
        remotePixelOk: deployment?.remotePixelOk ?? false,
      },
      routeCommand: '/guia-pixel-capi',
    }),
    structuredCheck({
      id: 'conversion-destination',
      code: checkoutOk ? 'CONVERSION_DESTINATION_OPERATIONAL' : conversionEvidence.reason,
      result: checkoutOk ? 'pass' : 'fail',
      artifactKey: 'salesPage',
      binding: resolution.bindings.salesPage,
      evidence: {
        conversionMode,
        checkout: conversionMode === 'direct_checkout'
          ? (checkoutOk ? 'pass' : 'fail')
          : 'not_applicable',
        destination: conversionEvidence.destination ?? null,
        event: conversionEvidence.event ?? null,
      },
      routeCommand: conversionMode === 'direct_checkout'
        ? '/guia-produto-e-checkout'
        : '/guia-aplicacao-call',
    }),
  ];
  const pending = checks.filter((check) => check.result === 'fail' || check.result === 'unverified');

  return {
    missingArtifacts,
    bindings: resolution.bindings,
    artifactIndex: resolution.artifactIndex,
    canonical,
    conversionMode,
    publishedUrl,
    pageOk,
    pixelOk,
    pixelPrepared: pixelEvidence.prepared,
    pixelEvidence,
    checkoutOk,
    conversionDestination: conversionEvidence,
    economics,
    funil,
    funilNivel,
    copy,
    html,
    offerbook,
    advisory,
    blocksAll: missingArtifacts.length > 0,
    blocksProposal: blocksProposal || !proposalDryRun.ok,
    blocksWrite: blocksProposal || !proposalDryRun.ok,
    critical,
    checks,
    pending,
    proposalDryRun,
    templatePath: join(repoRoot, TEMPLATE_REL),
  };
}

export function ensureEmptyPanel(projectRoot, repoRoot) {
  const dest = join(projectRoot, PANEL_REL);
  if (existsSync(dest)) return dest;
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(repoRoot, TEMPLATE_REL), dest);
  return dest;
}

export function maybeCopyTemplate(projectRoot, repoRoot, assessment) {
  const a = assessment ?? assessProject(projectRoot, repoRoot);
  if (a.blocksProposal) {
    throw new Error('Pendencia critica ou artefato ausente — template nao pode ser copiado (spec T1)');
  }
  return ensureEmptyPanel(projectRoot, repoRoot);
}

function extractSection(text, key) {
  const block = extractSectionBlock(text, key);
  return block ?? '';
}

function extractSectionBlock(text, key) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^[a-zA-Z_][\w-]*:/.test(line) && !line.startsWith(' ')) {
      end = i;
      break;
    }
    if (/^# ═/.test(line)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

export function readPanelBlocks(panelPath) {
  if (!existsSync(panelPath)) return { insumos: '', projecao: '', text: '' };
  const text = readFileSync(panelPath, 'utf8');
  return {
    insumos: extractSection(text, 'insumos_a2'),
    projecao: extractSection(text, 'projecao'),
    text,
  };
}

export function validateBriefistaInsumos(panelPath) {
  const blocks = readPanelBlocks(panelPath);
  const text = blocks.insumos;
  const errors = [];
  if (!text.includes('angulos:')) errors.push('insumos_a2.angulos ausente');
  const niveis = [...text.matchAll(/nivel_consciencia:\s*["']?([\w_]+)/gi)];
  if (!niveis.length) errors.push('nenhum angulo com nivel_consciencia');
  for (const m of niveis) {
    const n = m[1].toLowerCase();
    if (!NIVEL_ENUM.has(n)) errors.push(`nivel_consciencia invalido: ${m[1]}`);
    if (/extrair do copy/i.test(text)) errors.push('dor placeholder proibida');
  }
  if (!/pagina_url:\s*["']?https:\/\//.test(text)) errors.push('pagina_url https ausente ou invalida');
  if (!/ticket:\s*[1-9]/i.test(text)) errors.push('ticket ausente ou zero');
  if (!/margem_pct:\s*0?\.\d+/i.test(text) && !/margem_pct:\s*1\b/.test(text)) errors.push('margem_pct ausente ou invalida');
  const proj = readPanelBlocks(panelPath).projecao;
  if (!proj.includes('roas_break_even')) errors.push('projecao.roas_break_even ausente');
  if (!proj.includes('cac_break_even')) errors.push('projecao.cac_break_even ausente');
  return { ok: errors.length === 0, errors };
}

/** Conteúdo final do painel antes da promoção (QA2-P0-07 — hash real sem gravar). */
export function buildStagedPanelContent(projectRoot, repoRoot, proposal) {
  const assessment = assessProject(projectRoot, repoRoot);
  if (assessment.blocksWrite) throw new Error('Projeto incompleto para staging do painel');
  if (!assessment.funilNivel) throw new Error('funil.md sem nivel_consciencia valido');

  const currentHash = proposalSourceHash(assessment);
  if (proposal?.sourceHash && proposal.sourceHash !== currentHash) {
    throw new Error('Fontes alteradas desde a proposta — reproponha ao aluno');
  }

  const panelPath = join(projectRoot, PANEL_REL);
  const { ticket, margem_pct, valid } = assessment.economics;
  if (!valid) throw new Error('Ticket ou margem invalidos');
  const proj = computeProjection(ticket, margem_pct);
  const sourcePath = existsSync(panelPath) ? panelPath : join(repoRoot, TEMPLATE_REL);
  const beforeText = readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
  const merged = mergePanelYamlPreserving(beforeText, {
    insumos_a2: proposal.insumosYaml,
    projecao: formatProjecaoYaml(proj, ticket, margem_pct),
  });
  const preserved = assertPreservedSections(beforeText, merged);
  if (!preserved.ok) {
    throw new Error(`Merge YAML perdeu secoes downstream: ${preserved.errors.join(', ')}`);
  }
  return { content: merged, panelPath };
}

export function hashPanelContent(content) {
  return createHash('sha256').update(String(content).replace(/\r\n/g, '\n')).digest('hex');
}

/** Grava bytes canônicos já validados (staged = artifact = final). */
export function writeCanonicalPanel(projectRoot, panelPathRel, content) {
  const panelPath = resolve(projectRoot, panelPathRel);
  mkdirSync(dirname(panelPath), { recursive: true });
  const normalized = String(content).replace(/\r\n/g, '\n');
  writeFileSync(panelPath, normalized, 'utf8');
  return panelPath;
}

export function writeApprovedPanel(projectRoot, repoRoot, proposal, approvalInput) {
  if (typeof approvalInput === 'boolean') {
    if (approvalInput === true) {
      throw new Error('Aprovacao booleana true nao autorizada — use texto literal de aprovacao');
    }
    throw new Error('Aprovacao textual explicita obrigatoria');
  }
  const approved = parseApprovalText(String(approvalInput ?? '')).approved;
  if (!approved) throw new Error('Aprovacao textual explicita obrigatoria');

  const assessment = assessProject(projectRoot, repoRoot);
  if (assessment.blocksWrite) throw new Error('Projeto incompleto para escrita');
  if (!assessment.funilNivel) throw new Error('funil.md sem nivel_consciencia valido');

  const currentHash = proposalSourceHash(assessment);
  if (proposal?.sourceHash && proposal.sourceHash !== currentHash) {
    throw new Error('Fontes alteradas desde a proposta — reproponha ao aluno');
  }

  const panelPath = maybeCopyTemplate(projectRoot, repoRoot, assessment);
  const { ticket, margem_pct, valid } = assessment.economics;
  if (!valid) throw new Error('Ticket ou margem invalidos');
  const proj = computeProjection(ticket, margem_pct);
  const beforeText = readFileSync(panelPath, 'utf8').replace(/\r\n/g, '\n');
  const merged = mergePanelYamlPreserving(beforeText, {
    insumos_a2: proposal.insumosYaml,
    projecao: formatProjecaoYaml(proj, ticket, margem_pct),
  });
  const preserved = assertPreservedSections(beforeText, merged);
  if (!preserved.ok) {
    throw new Error(`Merge YAML perdeu secoes downstream: ${preserved.errors.join(', ')}`);
  }
  writeFileSync(panelPath, merged, 'utf8');
  return panelPath;
}

function formatProjecaoYaml(proj, ticket, margem_pct) {
  return `projecao:
  ticket: ${ticket}
  margem_pct: ${margem_pct}
  roas_break_even: ${Number(proj.roas_break_even.toFixed(4))}
  cac_break_even: ${Number(proj.cac_break_even.toFixed(2))}
  conta_mostrada: "1 ÷ ${margem_pct} = ${proj.roas_break_even.toFixed(4)} | ticket × margem = ${proj.cac_break_even.toFixed(2)}"`;
}

export function buildProposal(assessment) {
  const nivel = assessment.funilNivel ?? parseFunilNivel(assessment.funil);
  if (!nivel) {
    throw new Error('funil.md sem nivel_consciencia valido — briefista recusaria');
  }
  const canonicalAngles = assessment.canonical?.fields?.copyAngles;
  const headlines = Array.isArray(canonicalAngles?.value)
    ? canonicalAngles.value.map((value) => String(value).trim()).filter((value) => value.length > 2)
    : [];
  if (headlines.length < 2) {
    throw new Error('canonical input precisa de 2 a 4 angulos comprovaveis — nao inventar angulos');
  }
  const angles = headlines.slice(0, 4).map((h, i) => ({
    nome: `angulo-${i + 1}`,
    nivel_consciencia: nivel,
    dor: h,
    locator: `${canonicalAngles.sourcePath}#heading-${i + 1}`,
    sourceHash: canonicalAngles.sourceHash,
  }));
  const insumosYaml = `insumos_a2:
  angulos:
${angles.map((a) => `    - nome: "${a.nome}"
      nivel_consciencia: "${a.nivel_consciencia}"
      dor: "${a.dor.replace(/"/g, '\\"')}"
      locator: "${a.locator}"
      sourceHash: "${a.sourceHash}"`).join('\n')}
  pagina_url: "${assessment.publishedUrl}"
  ticket: ${assessment.economics.ticket}
  margem_pct: ${assessment.economics.margem_pct}`;
  return { angles, insumosYaml, sourceHash: proposalSourceHash(assessment) };
}
