import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const appRoot = resolve(__dirname, '../../..');
export const repoRoot = resolve(appRoot, '..', '..');

const SOURCE_ARTIFACTS = Object.freeze([
  { artifactType: 'offerbook', title: 'Offerbook controlado', path: 'offerbook.md', format: 'markdown' },
  { artifactType: 'design', title: 'Design controlado', path: 'DESIGN.md', format: 'markdown' },
  { artifactType: 'funnel', title: 'Funil controlado', path: 'funil.md', format: 'markdown' },
  { artifactType: 'copy', title: 'Copy controlada', path: 'copy.md', format: 'markdown' },
  { artifactType: 'salesPage', title: 'Pagina controlada', path: 'pagina/index.html', format: 'html' },
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function localSupabaseConfig() {
  const raw = execFileSync('supabase', ['status', '-o', 'json'], {
    cwd: appRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const status = JSON.parse(raw);
  return {
    url: status.API_URL,
    anonKey: status.ANON_KEY,
    serviceRoleKey: status.SERVICE_ROLE_KEY,
  };
}

function safeSourceContent(source) {
  if (source.format === 'html') {
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fixture</title></head><body><main><h1>Fonte controlada</h1></main></body></html>\n';
  }
  return `# ${source.title}\n\nConteudo sintetico, deterministico e sem dados pessoais.\n`;
}

function buildBrief(surface, slug, name, now) {
  return {
    schemaVersion: '1.0.0',
    meta: { createdAt: now, updatedAt: now, completionStatus: 'ready_for_document_pack_v2_contract_lane' },
    project: {
      slug,
      name,
      currentStage: 'producao-funil',
      startingPoint: 'do-zero',
      offerType: 'especialista',
      operator: 'dono',
      regulatedNiche: 'nao',
      voice: 'marca',
      ticketRange: 'medio',
      ownerName: 'Marca Fixture',
      surface,
    },
    market: {
      niche: 'educacao profissional',
      productCategory: 'programa digital',
      targetAudience: 'Profissionais que buscam um processo pratico e verificavel.',
      awarenessLevel: 'consciente_do_problema',
      marketSophistication: 'alto',
      trafficTemperature: 'frio',
      trafficSource: 'pago',
      avatarSummary: 'Profissional com pouco tempo e preferencia por orientacao objetiva.',
      dominantPain: 'Falta de um processo consistente para executar o trabalho.',
    },
    offer: {
      name: 'Programa Fixture',
      promise: 'Organizar a execucao com um processo pratico.',
      uniqueMechanism: 'Ciclo de Planejamento, Execucao e Revisao.',
      problemMechanism: 'Acoes isoladas nao formam um sistema repetivel.',
      solutionMechanism: 'Um ciclo curto conecta decisao, entrega e revisao.',
      exactPrice: 497,
      guarantee: 'Garantia de 30 dias conforme os termos fornecidos.',
      bonuses: ['Checklist de execucao'],
      deliverables: ['Programa principal', 'Checklist de execucao'],
      proofAssets: [],
      backendOffer: 'Acompanhamento de implementacao',
      downsell: 'Plano essencial autoguiado',
      upsell: 'Acompanhamento de implementacao',
    },
    funnel: {
      recommendedFormat: 'quiz seguido de pagina de vendas',
      closingDestination: 'checkout',
      segmentationAxis: 'maturidade operacional',
      captureMoment: 'antes do resultado',
      bigDomino: 'Um processo curto e repetivel supera iniciativas desconectadas.',
      webinarSecrets: ['Diagnostico', 'Plano', 'Rotina'],
      webinarFormat: 'ao-vivo',
      audienceListSize: 2500,
      cartTargetDate: '2026-09-15',
      launchType: 'semente',
    },
    brand: { designMode: 'existing-design-md', approvedDirection: 'editorial funcional' },
    channels: {
      primaryCtaText: 'Conhecer o programa',
      primaryCtaUrl: 'https://fixture.invalid/checkout',
      eventUrl: 'https://fixture.invalid/evento',
      thankYouPageUrl: 'https://fixture.invalid/obrigado',
      emailTypes: ['convite', 'nutricao', 'venda'],
      automationMode: 'manual',
      detectableEvents: ['lead', 'checkout_iniciado', 'compra'],
      swipePatterns: ['contraste antes e depois do processo'],
    },
    data: {
      analyticsVariant: 'pre-lancamento',
      dataSourceNotes: 'Fixture controlada sem metricas reais.',
    },
    integrations: {
      activeCampaignStatus: 'not_configured',
      calendarStatus: 'not_configured',
    },
  };
}

async function deleteFixtureRows(admin, identity) {
  const projectIds = Object.values(identity.surfaces).map((surface) => surface.projectId);
  if (projectIds.length > 0) {
    const { error } = await admin.from('marketing_projects').delete().in('id', projectIds);
    if (error && !['PGRST205', '42P01'].includes(error.code)) throw new Error(`Falha limpando projetos: ${error.message}`);
  }
  const { error } = await admin.from('workspaces').delete().eq('id', identity.workspaceId);
  if (error && !['PGRST205', '42P01'].includes(error.code)) throw new Error(`Falha limpando workspace: ${error.message}`);
}

async function seedSourceArtifacts(admin, identity, surfaceName, now) {
  const surface = identity.surfaces[surfaceName];
  const root = resolve(repoRoot, 'projetos', surface.slug);
  const rows = [];
  for (const source of SOURCE_ARTIFACTS) {
    const content = safeSourceContent(source);
    await mkdir(dirname(resolve(root, source.path)), { recursive: true });
    await writeFile(resolve(root, source.path), content, 'utf8');
    rows.push({
      id: randomUUID(),
      workspace_id: identity.workspaceId,
      project_id: surface.projectId,
      artifact_type: source.artifactType,
      title: source.title,
      path: source.path,
      format: source.format,
      state: 'confirmed',
      verification: 'confirmed',
      source: 'e2e_controlled_fixture',
      content,
      content_hash: sha256(content),
      created_at: now,
      updated_at: now,
    });
  }
  const { error } = await admin.from('project_artifacts').insert(rows);
  if (error) throw new Error(`Falha criando fontes ${surfaceName}: ${error.message}`);
}

export async function createDocumentPackV2Fixture({ webUrl, bffUrl }) {
  const runToken = randomUUID().replaceAll('-', '').slice(0, 12);
  const identity = {
    workspaceId: randomUUID(),
    workspaceName: `Document pack v2 ${runToken}`,
    email: `document-pack-v2-${runToken}@fixture.local`,
    password: `DpV2-${randomUUID()}!`,
    surfaces: {
      panel: {
        projectId: randomUUID(),
        briefId: randomUUID(),
        slug: `e2e-dpv2-panel-${runToken}`,
        name: 'Document pack v2 - Painel',
      },
      cli: {
        projectId: randomUUID(),
        briefId: randomUUID(),
        slug: `e2e-dpv2-cli-${runToken}`,
        name: 'Document pack v2 - CLI',
      },
    },
  };
  const config = localSupabaseConfig();
  const admin = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let userId = null;

  const cleanup = async () => {
    await deleteFixtureRows(admin, identity);
    if (userId) {
      const result = await admin.auth.admin.deleteUser(userId);
      if (result.error && result.error.status !== 404) throw new Error(`Falha limpando usuario: ${result.error.message}`);
    }
    for (const surface of Object.values(identity.surfaces)) {
      await rm(resolve(repoRoot, 'projetos', surface.slug), { recursive: true, force: true });
    }
  };

  try {
    const created = await admin.auth.admin.createUser({
      email: identity.email,
      password: identity.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) throw new Error(`Falha criando usuario: ${created.error?.message ?? 'sem usuario'}`);
    userId = created.data.user.id;
    const now = new Date().toISOString();
    const { error: workspaceError } = await admin.from('workspaces').insert({
      id: identity.workspaceId,
      name: identity.workspaceName,
      created_at: now,
    });
    if (workspaceError) throw new Error(`Falha criando workspace: ${workspaceError.message}`);
    const { error: memberError } = await admin.from('workspace_members').insert({
      workspace_id: identity.workspaceId,
      user_id: userId,
      role: 'owner',
      created_at: now,
    });
    if (memberError) throw new Error(`Falha vinculando usuario: ${memberError.message}`);

    for (const [surfaceName, surface] of Object.entries(identity.surfaces)) {
      await mkdir(resolve(repoRoot, 'projetos', surface.slug), { recursive: true });
      const { error: projectError } = await admin.from('marketing_projects').insert({
        id: surface.projectId,
        workspace_id: identity.workspaceId,
        slug: surface.slug,
        name: surface.name,
        status: 'active',
        created_at: now,
        updated_at: now,
      });
      if (projectError) throw new Error(`Falha criando projeto ${surfaceName}: ${projectError.message}`);
      const brief = buildBrief(surfaceName, surface.slug, surface.name, now);
      const { error: briefError } = await admin.from('project_brief_revisions').insert({
        id: surface.briefId,
        workspace_id: identity.workspaceId,
        project_id: surface.projectId,
        revision: 1,
        schema_version: '1.0.0',
        status: 'active',
        data: brief,
        field_sources: {},
        created_at: now,
        updated_at: now,
      });
      if (briefError) throw new Error(`Falha criando briefing ${surfaceName}: ${briefError.message}`);
      const { error: pointerError } = await admin.from('marketing_projects')
        .update({ active_brief_revision_id: surface.briefId })
        .eq('id', surface.projectId);
      if (pointerError) throw new Error(`Falha ativando briefing ${surfaceName}: ${pointerError.message}`);
      await seedSourceArtifacts(admin, identity, surfaceName, now);
    }
  } catch (error) {
    await cleanup().catch(() => undefined);
    throw error;
  }

  return {
    ...identity,
    webUrl,
    bffUrl,
    config,
    admin,
    userId,
    projectRoot(surface) {
      return resolve(repoRoot, 'projetos', identity.surfaces[surface].slug);
    },
    briefFor(surface) {
      return buildBrief(surface, identity.surfaces[surface].slug, identity.surfaces[surface].name, new Date(0).toISOString());
    },
    async contextArtifacts(surface) {
      const { data, error } = await admin.from('project_artifacts')
        .select('artifact_type, title, path, format, content, verification')
        .eq('project_id', identity.surfaces[surface].projectId)
        .eq('verification', 'confirmed')
        .order('path', { ascending: true });
      if (error) throw new Error(`Falha lendo contexto ${surface}: ${error.message}`);
      return (data ?? []).filter((artifact) => typeof artifact.content === 'string');
    },
    async latestRun(surface, skillId) {
      const { data, error } = await admin.from('skill_runs').select('*')
        .eq('project_id', identity.surfaces[surface].projectId)
        .eq('skill_id', skillId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) throw new Error(`Run ausente em ${surface}/${skillId}: ${error?.message ?? 'sem linha'}`);
      return data;
    },
    async artifactsForRun(runId) {
      const { data, error } = await admin.from('project_artifacts').select('*')
        .eq('skill_run_id', runId)
        .order('path', { ascending: true });
      if (error) throw new Error(`Falha lendo artefatos do run: ${error.message}`);
      return data ?? [];
    },
    async approvalForRun(runId) {
      const { data, error } = await admin.from('artifact_approval_outbox')
        .select('decision, state, outcome, plan, audit_event')
        .eq('skill_run_id', runId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) throw new Error(`Aprovacao ausente: ${error?.message ?? 'sem linha'}`);
      return data;
    },
    async readBook(surface) {
      return JSON.parse(await readFile(resolve(this.projectRoot(surface), 'book-do-funil.json'), 'utf8'));
    },
    async cleanup() {
      await cleanup();
      const { count, error } = await admin.from('marketing_projects')
        .select('id', { count: 'exact', head: true })
        .in('id', Object.values(identity.surfaces).map((surface) => surface.projectId));
      if (error || count !== 0) throw new Error(`Cleanup incompleto: ${error?.message ?? `${count} projeto(s)`}`);
    },
  };
}

export { SOURCE_ARTIFACTS, sha256 };
