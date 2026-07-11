#!/usr/bin/env node
/**
 * cohort.cjs — wrapper "comando único" da skill design-md para o Cohort de Marketing.
 *
 * O aluno só dá o comando. Este wrapper cuida do resto:
 *   1. Instala as dependências da skill na primeira vez (sem o aluno rodar npm install)
 *   2. Roda o extrator original (run.cjs) — não toca no código do Alan
 *   3. Copia o DESIGN.md gerado para projetos/{slug}/ quando houver projeto ativo
 *   4. Copia tokens.json + preview.html junto e marca o brand-choice do projeto
 *
 * Uso (o Claude Code chama isto quando o aluno digita /design-md <url>):
 *   node .claude/skills/design-md/cohort.cjs --url https://site-da-marca.com
 */

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const skillDir = __dirname;
const projectRoot = process.cwd();

function log(msg) { process.stdout.write(`[cohort] ${msg}\n`); }

function slugifyProjectName(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function consumeCohortArgs(argv) {
  const passthrough = [];
  let projectSlug = '';
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project' || arg === '--slug') {
      projectSlug = slugifyProjectName(argv[i + 1] || '');
      i++;
      continue;
    }
    if (arg.startsWith('--project=')) {
      projectSlug = slugifyProjectName(arg.slice('--project='.length));
      continue;
    }
    if (arg.startsWith('--slug=')) {
      projectSlug = slugifyProjectName(arg.slice('--slug='.length));
      continue;
    }
    passthrough.push(arg);
  }
  return { passthrough, projectSlug };
}

function listProjectDirs() {
  const projetosDir = path.join(projectRoot, 'projetos');
  if (!fs.existsSync(projetosDir)) return [];
  return fs.readdirSync(projetosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function resolveProjectTarget(projectSlug) {
  const projetosDir = path.join(projectRoot, 'projetos');
  const projects = listProjectDirs();

  if (projectSlug) {
    const dir = path.join(projetosDir, projectSlug);
    fs.mkdirSync(dir, { recursive: true });
    return { dir, label: `projetos/${projectSlug}` };
  }

  if (projects.length === 1) {
    const dir = path.join(projetosDir, projects[0]);
    return { dir, label: `projetos/${projects[0]}` };
  }

  if (projects.length > 1) {
    log(`Encontrei mais de um projeto: ${projects.join(', ')}.`);
    log('Não vou escolher uma marca por você. Rode de novo com --project <slug> para salvar no projeto certo.');
    process.exit(1);
  }

  return null;
}

function copyIfExists(fromDir, fileName, toDir) {
  const src = path.join(fromDir, fileName);
  if (!fs.existsSync(src)) return false;
  fs.copyFileSync(src, path.join(toDir, fileName));
  return true;
}

// --- 1. Garante as dependências (primeira vez apenas) ---
const nodeModules = path.join(skillDir, 'node_modules');
const yamlInstalled = fs.existsSync(path.join(nodeModules, 'yaml'));
if (!yamlInstalled) {
  log('Primeira vez: instalando as dependências da skill (~30s, só acontece uma vez)...');
  try {
    execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund'], {
      cwd: skillDir,
      stdio: 'inherit',
      shell: process.platform === 'win32', // no Windows o npm e npm.cmd; sem shell o execFileSync nao acha
    });
  } catch (e) {
    log('Falha ao instalar dependências automaticamente.');
    log('Rode manualmente uma vez:  cd .claude/skills/design-md && npm install');
    process.exit(1);
  }
}

// --- 2 a 4: roda o extrator, mostra progresso, copia o DESIGN.md e marca o brand-choice ---
const { passthrough: args, projectSlug } = consumeCohortArgs(process.argv.slice(2));

function findFreshestDesignMd(dir) {
  if (!fs.existsSync(dir)) return null;
  let best = null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(dir, entry.name, 'DESIGN.md');
    if (fs.existsSync(candidate)) {
      const mtime = fs.statSync(candidate).mtimeMs;
      if (!best || mtime > best.mtime) best = { file: candidate, mtime, slug: entry.name };
    }
  }
  return best;
}

(async () => {
  log('Analisando o site e montando o seu DESIGN.md...');
  log('A etapa de IA leva alguns minutos (normalmente 2 a 6 min). É NORMAL a tela ficar parada um tempo aqui — não travou, pode deixar rodando.');

  let runHadError = false;
  const started = Date.now();
  let lastOutput = Date.now();

  // Roda o extrator original (run.cjs) de forma assíncrona para conseguir
  // mostrar um "ainda processando..." durante a etapa longa (silenciosa) da IA.
  await new Promise((resolve) => {
    const child = spawn('node', [path.join(skillDir, 'run.cjs'), ...args], {
      cwd: projectRoot,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    const forward = (chunk) => { process.stdout.write(chunk); lastOutput = Date.now(); };
    child.stdout.on('data', forward);
    child.stderr.on('data', forward);
    // Heartbeat: só aparece quando há silêncio (>12s sem output), pra não poluir.
    const heartbeat = setInterval(() => {
      if ((Date.now() - lastOutput) / 1000 >= 12) {
        const total = Math.round((Date.now() - started) / 1000);
        const min = Math.floor(total / 60), sec = total % 60;
        const tempo = min > 0 ? `${min}m${String(sec).padStart(2, '0')}s` : `${sec}s`;
        process.stdout.write(`[cohort] ...ainda processando (${tempo}) — a IA está analisando o design, pode deixar rodando.\n`);
      }
    }, 12000);
    child.on('error', () => { runHadError = true; });
    child.on('close', (code) => {
      clearInterval(heartbeat);
      if (code && code !== 0) runHadError = true;
      resolve();
    });
  });

  // Acha o DESIGN.md recém-gerado e copia para o projeto ativo (ou raiz como fallback)
  const outputsDir = path.join(projectRoot, 'outputs', 'design-md');
  const found = findFreshestDesignMd(outputsDir);
  if (!found) {
    log('Não consegui gerar o DESIGN.md. Veja o log acima.');
    process.exit(runHadError ? 1 : 2);
  }
  if (runHadError) {
    log('Obs: um passo opcional (preview) deu aviso, mas o seu DESIGN.md saiu normalmente.');
  }

  const projectTarget = resolveProjectTarget(projectSlug);
  const targetDir = projectTarget ? projectTarget.dir : projectRoot;
  fs.mkdirSync(targetDir, { recursive: true });

  copyIfExists(path.dirname(found.file), 'DESIGN.md', targetDir);
  copyIfExists(path.dirname(found.file), 'tokens.json', targetDir);
  copyIfExists(path.dirname(found.file), 'preview.html', targetDir);
  log(`DESIGN.md copiado para ${projectTarget ? projectTarget.label : 'a raiz (fallback: ainda não há projetos/)'} a partir de "${found.slug}".`);
  if (!projectTarget) {
    log('Quando o projeto existir, a fonte canônica passa a ser projetos/{slug}/DESIGN.md.');
  }

  // Marca o brand-choice
  try {
    fs.writeFileSync(path.join(targetDir, '.cohort-brand-choice'), 'design-md\n');
  } catch (_) { /* não-crítico */ }

  log('Pronto! A sua marca está ativa. Daqui pra frente as skills usam o seu DESIGN.md automaticamente.');
  log(`Confira o preview: outputs/design-md/${found.slug}/preview.html`);
  if (projectTarget) log(`Preview copiado também para: ${path.join(projectTarget.label, 'preview.html')}`);
  log('');
  log('PRÓXIMO PASSO:');
  log('  - Se já tem a copy da oferta:  rode  /pagina-vendas  (monta a página já com a sua marca).');
  log('  - Não sabe a ordem do funil?   rode  /metodo-funil   (ele lê o seu offerbook e te dá o mapa completo).');
})();
