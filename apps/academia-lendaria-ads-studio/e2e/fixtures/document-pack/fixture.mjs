import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '../../..');
const repoRoot = resolve(appRoot, '..', '..');
const sourceRoot = resolve(repoRoot, 'projetos', 'academia-fit');

const SURFACES = Object.freeze({
  panel: {
    projectId: '82000000-0000-0000-0000-000000000111',
    briefId: '83000000-0000-0000-0000-000000000111',
    slug: 'epic-11-document-pack-panel',
    name: 'Epic 11 · Document pack · Painel',
  },
  cli: {
    projectId: '82000000-0000-0000-0000-000000000112',
    briefId: '83000000-0000-0000-0000-000000000112',
    slug: 'epic-11-document-pack-cli',
    name: 'Epic 11 · Document pack · CLI',
  },
});

export const DOCUMENT_PACK_FIXTURE = Object.freeze({
  email: 'document-pack-epic-11@fixture.local',
  password: 'DocumentPack11!fixture',
  workspaceId: '81000000-0000-0000-0000-000000000111',
  workspaceName: 'Workspace fixture · Epic 11 document pack',
  webUrl: 'http://127.0.0.1:5177',
  bffUrl: 'http://127.0.0.1:3002',
  surfaces: SURFACES,
});

const SOURCE_ARTIFACTS = Object.freeze([
  { artifactType: 'avatar', title: 'Pesquisa de avatar', sourcePath: 'relatorio-avatar.md', path: 'relatorio-avatar.md' },
  { artifactType: 'competitorDossier', title: 'Dossiê FitFlow', sourcePath: 'espiao/dossie-fitflow.md', path: 'espiao/dossie-fitflow.md' },
  { artifactType: 'swipeBrief', title: 'Briefing de swipe file', sourcePath: 'swipe/briefing-swipe-file.md', path: 'swipe/briefing-swipe-file.md' },
  { artifactType: 'design', title: 'Design System Academia Fit', sourcePath: 'DESIGN.md', path: 'DESIGN.md' },
  { artifactType: 'funnel', title: 'Mapa de execução do funil', sourcePath: 'funil.md', path: 'funil.md' },
]);

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
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

function projectRoot(surface) {
  return resolve(repoRoot, 'projetos', SURFACES[surface].slug);
}

function buildBrief(surface, now) {
  const project = SURFACES[surface];
  return {
    schemaVersion: '1.0.0',
    meta: { createdAt: now, updatedAt: now, completionStatus: 'ready_for_document_pack_parity' },
    project: {
      slug: project.slug,
      name: project.name,
      currentStage: 'producao-funil',
      startingPoint: 'do-zero',
      offerType: 'especialista',
      operator: 'dono',
      regulatedNiche: 'saude',
      voice: 'marca',
      ticketRange: 'baixo',
      ownerName: 'Academia Fit',
    },
    market: {
      niche: 'emagrecimento sustentável para mulheres 35+',
      productCategory: 'programa digital de saúde e hábitos',
      targetAudience: 'Mulheres com 35 anos ou mais que vivem o efeito sanfona e buscam consistência sem dieta restritiva.',
      researchMode: 'rede',
      awarenessLevel: 'consciente_do_problema',
      marketSophistication: 'alto',
      trafficTemperature: 'frio',
      trafficSource: 'pago',
      avatarSummary: 'Mulher 35+, com rotina cheia, que já tentou dietas e desconfia de promessas rápidas.',
      dominantPain: 'Perder peso e recuperar tudo por não conseguir sustentar a rotina.',
    },
    offer: {
      name: 'Método Consistência 90',
      promise: 'Construir uma rotina sustentável de emagrecimento em 90 dias sem dieta restritiva.',
      uniqueMechanism: 'Ciclo de 3 Fases: Desinflamar, Reprogramar e Manter.',
      problemMechanism: 'Dietas isoladas ignoram a manutenção de hábitos e alimentam o ciclo de recomeços.',
      solutionMechanism: 'O Ciclo de 3 Fases combina início simples, repetição guiada e manutenção obrigatória.',
      exactPrice: 497,
      guarantee: '30 dias de garantia, com devolução integral conforme os termos da oferta.',
      bonuses: ['Checklist semanal anti-sanfona', 'E-book Anti-Sanfona', 'Workbook Fase 1'],
      deliverables: ['Programa em vídeo de 90 dias', 'Plano prático', 'Comunidade Consistência'],
      proofAssets: [],
    },
    funnel: {
      recommendedFormat: 'quiz de diagnóstico seguido de página de vendas',
      closingDestination: 'checkout',
      segmentationAxis: 'perfil de decisão: emocional, racional ou pragmático',
      captureMoment: 'antes do resultado do quiz',
    },
    brand: {
      designMode: 'existing-design-md',
      approvedDirection: 'dark premium com ouro e azul água',
    },
    channels: {
      primaryCtaText: 'Começar meu ciclo de 90 dias',
      primaryCtaUrl: 'https://fixture.local/academia-fit/checkout',
    },
    data: {
      dataSourceNotes: 'Fixture de paridade baseada exclusivamente nos arquivos reais de projetos/academia-fit.',
    },
  };
}

async function removeExistingUser(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Não foi possível listar usuários da fixture: ${error.message}`);
  const existing = data.users.find((user) => user.email === DOCUMENT_PACK_FIXTURE.email);
  if (existing) {
    const result = await admin.auth.admin.deleteUser(existing.id);
    if (result.error) throw new Error(`Não foi possível remover o usuário anterior: ${result.error.message}`);
  }
}

async function deleteFixtureRows(admin) {
  const projectIds = Object.values(SURFACES).map((surface) => surface.projectId);
  const { error: projectError } = await admin.from('marketing_projects').delete().in('id', projectIds);
  if (projectError && !['PGRST205', '42P01'].includes(projectError.code)) {
    throw new Error(`Falha limpando projetos da fixture: ${projectError.message}`);
  }
  const { error: workspaceError } = await admin.from('workspaces').delete().eq('id', DOCUMENT_PACK_FIXTURE.workspaceId);
  if (workspaceError && !['PGRST205', '42P01'].includes(workspaceError.code)) {
    throw new Error(`Falha limpando o workspace da fixture: ${workspaceError.message}`);
  }
}

async function seedSourceArtifacts(admin, surface, now) {
  const project = SURFACES[surface];
  const root = projectRoot(surface);
  const rows = [];
  for (let index = 0; index < SOURCE_ARTIFACTS.length; index += 1) {
    const source = SOURCE_ARTIFACTS[index];
    const content = await readFile(resolve(sourceRoot, source.sourcePath), 'utf8');
    const destination = resolve(root, source.path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content, 'utf8');
    rows.push({
      id: `85000000-0000-0000-0000-${surface === 'panel' ? '111' : '112'}${String(index + 1).padStart(9, '0')}`,
      workspace_id: DOCUMENT_PACK_FIXTURE.workspaceId,
      project_id: project.projectId,
      artifact_type: source.artifactType,
      title: source.title,
      path: source.path,
      format: 'markdown',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'filesystem',
      content,
      content_hash: sha256(content),
      created_at: now,
      updated_at: now,
    });
  }
  const { error } = await admin.from('project_artifacts').insert(rows);
  if (error) throw new Error(`Falha criando insumos ${surface}: ${error.message}`);
}

export async function createDocumentPackFixture() {
  const config = localSupabaseConfig();
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } });
  await deleteFixtureRows(admin);
  await removeExistingUser(admin);
  for (const surface of Object.keys(SURFACES)) await rm(projectRoot(surface), { recursive: true, force: true });

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: DOCUMENT_PACK_FIXTURE.email,
    password: DOCUMENT_PACK_FIXTURE.password,
    email_confirm: true,
  });
  if (userError || !userData.user) throw new Error(`Falha criando usuário da fixture: ${userError?.message ?? 'sem usuário'}`);

  const now = new Date().toISOString();
  const { error: workspaceError } = await admin.from('workspaces').insert({
    id: DOCUMENT_PACK_FIXTURE.workspaceId,
    name: DOCUMENT_PACK_FIXTURE.workspaceName,
    created_at: now,
  });
  if (workspaceError) throw new Error(`Falha criando workspace: ${workspaceError.message}`);
  const { error: memberError } = await admin.from('workspace_members').insert({
    workspace_id: DOCUMENT_PACK_FIXTURE.workspaceId,
    user_id: userData.user.id,
    role: 'owner',
    created_at: now,
  });
  if (memberError) throw new Error(`Falha vinculando usuário: ${memberError.message}`);

  for (const surface of Object.keys(SURFACES)) {
    const project = SURFACES[surface];
    await mkdir(projectRoot(surface), { recursive: true });
    const { error: projectError } = await admin.from('marketing_projects').insert({
      id: project.projectId,
      workspace_id: DOCUMENT_PACK_FIXTURE.workspaceId,
      slug: project.slug,
      name: project.name,
      status: 'active',
      created_at: now,
      updated_at: now,
    });
    if (projectError) throw new Error(`Falha criando projeto ${surface}: ${projectError.message}`);
    const brief = buildBrief(surface, now);
    const { error: briefError } = await admin.from('project_brief_revisions').insert({
      id: project.briefId,
      workspace_id: DOCUMENT_PACK_FIXTURE.workspaceId,
      project_id: project.projectId,
      revision: 1,
      schema_version: '1.0.0',
      status: 'active',
      data: brief,
      field_sources: {},
      created_at: now,
      updated_at: now,
    });
    if (briefError) throw new Error(`Falha criando briefing ${surface}: ${briefError.message}`);
    const { error: pointerError } = await admin.from('marketing_projects').update({
      active_brief_revision_id: project.briefId,
    }).eq('id', project.projectId);
    if (pointerError) throw new Error(`Falha ligando briefing ${surface}: ${pointerError.message}`);
    await seedSourceArtifacts(admin, surface, now);
  }

  const api = {
    ...DOCUMENT_PACK_FIXTURE,
    appRoot,
    repoRoot,
    config,
    admin,
    userId: userData.user.id,
    projectRoot,
    briefFor: (surface) => buildBrief(surface, now),
    async runsFor(surface, skillId) {
      const { data, error } = await admin.from('skill_runs').select('*')
        .eq('project_id', SURFACES[surface].projectId)
        .eq('skill_id', skillId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(`Falha lendo runs ${surface}/${skillId}: ${error.message}`);
      return data ?? [];
    },
    async artifactsFor(surface, skillId) {
      const runs = await this.runsFor(surface, skillId);
      const runIds = runs.map((run) => run.id);
      if (runIds.length === 0) return [];
      const { data, error } = await admin.from('project_artifacts').select('*')
        .in('skill_run_id', runIds)
        .order('path', { ascending: true });
      if (error) throw new Error(`Falha lendo artefatos ${surface}/${skillId}: ${error.message}`);
      return data ?? [];
    },
    async cleanup() {
      await deleteFixtureRows(admin);
      await admin.auth.admin.deleteUser(userData.user.id);
      for (const surface of Object.keys(SURFACES)) await rm(projectRoot(surface), { recursive: true, force: true });
    },
  };
  return api;
}

export { SOURCE_ARTIFACTS, SURFACES, appRoot, repoRoot };
