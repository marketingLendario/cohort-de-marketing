#!/usr/bin/env node
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { constants as fsConstants, existsSync, openSync } from 'node:fs';
import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = resolve(repoRoot, 'apps/academia-lendaria-ads-studio');
const STATUS_ORDER = { ready: 0, degraded: 1, blocked: 2 };
const STATUS_PREFIX = { ready: '[OK]', degraded: '[ATENCAO]', blocked: '[BLOQUEIO]' };
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{12,}/g,
  /sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g,
  /eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /postgres(?:ql)?:\/\/[^\s@]+@/g,
];

export function redact(value) {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, '[REDACTED]'), String(value ?? ''));
}

export function aggregateReadiness(checks) {
  if (checks.some((check) => check.required && check.status === 'blocked')) return 'blocked';
  return checks.reduce((current, check) => STATUS_ORDER[check.status] > STATUS_ORDER[current] ? check.status : current, 'ready');
}

export function runtimePaths(root = repoRoot) {
  const id = createHash('sha256').update(resolve(root)).digest('hex').slice(0, 12);
  const directory = resolve(tmpdir(), `marketing-studio-${id}`);
  return {
    directory,
    state: resolve(directory, 'state.json'),
    readiness: resolve(directory, 'readiness.json'),
    bffLog: resolve(directory, 'bff.log'),
    webLog: resolve(directory, 'web.log'),
  };
}

export function parseCli(argv) {
  const options = {
    command: 'start',
    webPort: Number(process.env.MARKETING_STUDIO_WEB_PORT) || 5177,
    bffPort: Number(process.env.MARKETING_STUDIO_BFF_PORT) || 3002,
    openBrowser: true,
    install: true,
  };
  const args = [...argv];
  if (args[0] && !args[0].startsWith('--')) options.command = args.shift();
  while (args.length) {
    const arg = args.shift();
    if (arg === '--no-browser' || arg === '--no-open') options.openBrowser = false;
    else if (arg === '--no-install') options.install = false;
    else if (arg === '--web-port') options.webPort = Number(args.shift());
    else if (arg === '--bff-port') options.bffPort = Number(args.shift());
    else throw new Error(`Opção desconhecida: ${arg}`);
  }
  if (!['start', 'check', 'status', 'stop'].includes(options.command)) {
    throw new Error(`Comando desconhecido: ${options.command}`);
  }
  for (const [label, port] of [['web', options.webPort], ['BFF', options.bffPort]]) {
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error(`Porta ${label} inválida: ${port}`);
  }
  if (options.webPort === options.bffPort) throw new Error('As portas do navegador e do BFF precisam ser diferentes.');
  return options;
}

export function loadRepoEnvironment(root = repoRoot) {
  try {
    loadEnvFile(resolve(root, '.env'));
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn(`Não foi possível carregar o .env local: ${redact(error instanceof Error ? error.message : error)}`);
    }
  }
}

export function codexCliEnvironment(env = process.env) {
  const sanitized = { ...env };
  delete sanitized.OPENAI_API_KEY;
  delete sanitized.CODEX_API_KEY;
  return sanitized;
}

export function windowsTaskkillArgs(pid, force = false) {
  return ['/PID', String(pid), '/T', ...(force ? ['/F'] : [])];
}

async function runCapture(command, args = [], options = {}) {
  return await new Promise((resolvePromise) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const child = spawn(command, args, {
      cwd: options.cwd ?? repoRoot,
      env: options.env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({ ...result, stdout, stderr });
    };
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish({ ok: false, code: null, error: `tempo limite de ${options.timeoutMs ?? 120_000} ms` });
    }, options.timeoutMs ?? 120_000);
    child.stdout?.on('data', (chunk) => { if (stdout.length < 128_000) stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { if (stderr.length < 128_000) stderr += chunk.toString(); });
    child.on('error', (error) => finish({ ok: false, code: null, error: error.message }));
    child.on('close', (code) => finish({ ok: code === 0, code, error: code === 0 ? undefined : `exit ${code}` }));
  });
}

async function findExecutable(name) {
  const local = resolve(appRoot, 'node_modules/.bin', process.platform === 'win32' ? `${name}.cmd` : name);
  if (existsSync(local)) return local;
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const result = await runCapture(finder, [name], { timeoutMs: 5_000 });
  return result.ok ? result.stdout.trim().split(/\r?\n/)[0] : null;
}

async function portAvailable(port) {
  return await new Promise((resolvePromise) => {
    const server = createServer();
    server.unref();
    server.once('error', () => resolvePromise(false));
    server.listen({ host: '127.0.0.1', port }, () => server.close(() => resolvePromise(true)));
  });
}

function check(id, label, status, detail, recovery, required = true) {
  return { id, label, status, detail, ...(recovery ? { recovery } : {}), required };
}

function parseEnvOutput(output) {
  const env = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const raw = match[2].trim();
    try {
      env[match[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw;
    } catch {
      env[match[1]] = raw.replace(/^"|"$/g, '');
    }
  }
  return env;
}

export function isOwnedCommand(command, root = repoRoot) {
  const normalized = String(command ?? '');
  const rootPath = resolve(root);
  const belongsToRoot = normalized.includes(`${rootPath}/`) || normalized.includes(`${rootPath}\\`);
  return belongsToRoot && /(?:vite|tsx|server[\\/]start\.ts)/.test(normalized);
}

async function processCommand(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return '';
  const result = process.platform === 'win32'
    ? await runCapture('wmic', ['process', 'where', `processid=${pid}`, 'get', 'CommandLine', '/value'], { timeoutMs: 5_000 })
    : await runCapture('ps', ['-p', String(pid), '-o', 'command='], { timeoutMs: 5_000 });
  return result.ok ? result.stdout.trim() : '';
}

async function ownedProcessAlive(record, root = repoRoot) {
  if (!record?.pid) return false;
  try {
    process.kill(record.pid, 0);
  } catch {
    return false;
  }
  return isOwnedCommand(await processCommand(record.pid), root);
}

async function terminateOwnedProcess(record, root = repoRoot) {
  if (!(await ownedProcessAlive(record, root))) return false;
  if (process.platform === 'win32') {
    const graceful = await runCapture('taskkill', windowsTaskkillArgs(record.pid), { timeoutMs: 5_000 });
    if (graceful.ok || !(await ownedProcessAlive(record, root))) return true;
    const forced = await runCapture('taskkill', windowsTaskkillArgs(record.pid, true), { timeoutMs: 5_000 });
    return forced.ok || !(await ownedProcessAlive(record, root));
  }
  const target = process.platform === 'win32' ? record.pid : -record.pid;
  try { process.kill(target, 'SIGTERM'); } catch { return false; }
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (!(await ownedProcessAlive(record, root))) return true;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  try { process.kill(target, 'SIGKILL'); } catch { /* already stopped */ }
  return true;
}

async function readJson(filePath) {
  try { return JSON.parse(await readFile(filePath, 'utf8')); } catch { return null; }
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, filePath);
}

async function migrationStatus(supabaseBin) {
  const files = (await readdir(resolve(appRoot, 'supabase/migrations'))).filter((file) => file.endsWith('.sql'));
  const result = await runCapture(supabaseBin, ['migration', 'list', '--local'], { cwd: appRoot });
  if (!result.ok) return { ok: false, count: 0 };
  const rows = [...result.stdout.matchAll(/^\s*(\d{14})\s*\|\s*(\d{14})/gm)];
  return { ok: rows.length >= files.length && rows.every((row) => row[1] === row[2]), count: rows.length };
}

async function supabaseStatus(supabaseBin) {
  const result = await runCapture(supabaseBin, ['status', '-o', 'env'], { cwd: appRoot, timeoutMs: 30_000 });
  return result.ok ? { running: true, env: parseEnvOutput(result.stdout) } : { running: false, env: {} };
}

function browserCommand() {
  if (process.platform === 'darwin') return { command: 'open', args: [] };
  if (process.platform === 'win32') return { command: 'cmd', args: ['/c', 'start', ''] };
  return { command: 'xdg-open', args: [] };
}

async function preflight(options) {
  await mkdir(runtimePaths().directory, { recursive: true });
  const checks = [];
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  checks.push(nodeMajor < 22
    ? check('node', 'Node.js', 'blocked', `Versão ${process.versions.node}; o Studio exige Node 22 ou superior.`, 'Instale o Node.js 22 LTS e rode novamente.')
    : nodeMajor === 22
      ? check('node', 'Node.js', 'ready', `Node ${process.versions.node} compatível.`)
      : check('node', 'Node.js', 'degraded', `Node ${process.versions.node}; o app funciona, mas a versão homologada é 22.x.`, 'Use Node 22 LTS se encontrar comportamento inesperado.', false));

  const npmBin = await findExecutable('npm');
  checks.push(npmBin
    ? check('npm', 'Dependências', existsSync(resolve(appRoot, 'node_modules')) ? 'ready' : 'degraded', existsSync(resolve(appRoot, 'node_modules')) ? 'Dependências instaladas.' : 'Dependências serão instaladas pelo launcher.', null)
    : check('npm', 'Dependências', 'blocked', 'npm não foi encontrado.', 'Instale Node.js 22 LTS, que já inclui npm.'));

  const codexBin = await findExecutable('codex');
  if (!codexBin) {
    checks.push(check('codex', 'Codex CLI', 'blocked', 'Codex CLI não encontrado.', 'Instale o Codex CLI e rode codex login.'));
  } else {
    const login = await runCapture(codexBin, ['login', 'status'], {
      env: codexCliEnvironment(),
      timeoutMs: 15_000,
    });
    checks.push(login.ok && /logged in|autenticado/i.test(`${login.stdout}\n${login.stderr}`)
      ? check('codex', 'Codex CLI', 'ready', 'Autenticado localmente com ChatGPT.')
      : check('codex', 'Codex CLI', 'blocked', 'O Codex CLI ainda não está autenticado.', 'Rode codex login e conclua a autenticação no navegador.'));
  }

  try {
    await access(repoRoot, fsConstants.R_OK | fsConstants.W_OK);
    await mkdir(resolve(repoRoot, 'projetos'), { recursive: true });
    await access(resolve(repoRoot, 'projetos'), fsConstants.W_OK);
    checks.push(check('filesystem', 'Arquivos do projeto', 'ready', 'A pasta de projetos pode receber artefatos.'));
  } catch {
    checks.push(check('filesystem', 'Arquivos do projeto', 'blocked', 'Sem permissão para gravar artefatos.', 'Mova o projeto para uma pasta com permissão de escrita.'));
  }

  const webFree = await portAvailable(options.webPort);
  const bffFree = await portAvailable(options.bffPort);
  checks.push(check('ports', 'Portas locais', webFree && bffFree ? 'ready' : 'blocked', webFree && bffFree ? `Portas ${options.webPort} e ${options.bffPort} livres.` : `Porta em uso: ${[!webFree && options.webPort, !bffFree && options.bffPort].filter(Boolean).join(', ')}.`, 'Encerre o processo nessa porta ou use --web-port e --bff-port.'));

  const supabaseBin = await findExecutable('supabase');
  let supabase = { running: false, env: {} };
  if (!supabaseBin) {
    checks.push(check('supabase', 'Supabase local', 'blocked', 'Supabase CLI não encontrado.', 'No macOS, rode brew install supabase/tap/supabase.'));
  } else {
    supabase = await supabaseStatus(supabaseBin);
    if (supabase.running) {
      checks.push(check('supabase', 'Supabase local', 'ready', 'Banco e autenticação locais estão ativos.'));
    } else {
      const dockerBin = await findExecutable('docker');
      const docker = dockerBin ? await runCapture(dockerBin, ['info'], { timeoutMs: 15_000 }) : { ok: false };
      checks.push(docker.ok
        ? check('supabase', 'Supabase local', 'degraded', 'O serviço será iniciado pelo launcher.', null)
        : check('supabase', 'Supabase local', 'blocked', 'Docker não está disponível para iniciar o Supabase.', 'Abra o Docker Desktop e rode novamente.'));
    }
  }

  if (supabase.running && supabaseBin) {
    const migrations = await migrationStatus(supabaseBin);
    checks.push(migrations.ok
      ? check('migrations', 'Banco atualizado', 'ready', `${migrations.count} migrations alinhadas.`)
      : check('migrations', 'Banco atualizado', 'degraded', 'Há migrations pendentes; o launcher vai aplicá-las.', null));
  } else {
    checks.push(check('migrations', 'Banco atualizado', 'degraded', 'A verificação ocorrerá após o Supabase iniciar.', null));
  }

  const browser = browserCommand();
  checks.push(await findExecutable(browser.command)
    ? check('browser', 'Navegador', 'ready', options.openBrowser ? 'Abertura automática disponível.' : 'Abertura automática disponível, mas desativada neste comando.', null, false)
    : check('browser', 'Navegador', 'degraded', 'Não foi possível localizar o comando de abertura automática.', `Abra manualmente http://127.0.0.1:${options.webPort}.`, false));

  return { checks, supabaseBin, supabase, npmBin, codexBin };
}

function snapshotFrom(checks, options, source = 'launcher') {
  return {
    status: aggregateReadiness(checks),
    checkedAt: new Date().toISOString(),
    source,
    appUrl: `http://127.0.0.1:${options.webPort}`,
    checks,
  };
}

function printSnapshot(snapshot) {
  console.log(`\nMarketing Studio: ${snapshot.status === 'ready' ? 'pronto' : snapshot.status === 'blocked' ? 'bloqueado' : 'degradado'}\n`);
  for (const item of snapshot.checks) {
    console.log(`${STATUS_PREFIX[item.status]} ${item.label}: ${item.detail}`);
    if (item.status !== 'ready' && item.recovery) console.log(`  Recuperação: ${item.recovery}`);
  }
}

async function waitFor(url, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let detail = 'sem resposta';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      detail = `HTTP ${response.status}`;
    } catch (error) {
      detail = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
  }
  throw new Error(`Serviço não respondeu em ${url}: ${detail}`);
}

function spawnService(command, args, env, logPath) {
  const log = openSync(logPath, 'a', 0o600);
  const child = spawn(command, args, {
    cwd: appRoot,
    env,
    detached: process.platform !== 'win32',
    stdio: ['ignore', log, log],
  });
  child.unref();
  return { pid: child.pid, command, args, logPath };
}

async function stop(options = {}) {
  const paths = runtimePaths();
  const state = await readJson(paths.state);
  if (!state) {
    console.log('Marketing Studio não tem uma sessão iniciada pelo launcher.');
    return;
  }
  const webStopped = await terminateOwnedProcess(state.web, state.repoRoot);
  const bffStopped = await terminateOwnedProcess(state.bff, state.repoRoot);
  if (state.supabaseStartedByLauncher && state.supabaseBin) {
    const result = await runCapture(state.supabaseBin, ['stop'], { cwd: appRoot, timeoutMs: 120_000 });
    if (!result.ok) {
      await writeJsonAtomic(paths.readiness, snapshotFrom([
        check('supabase', 'Supabase local', 'blocked', 'Os serviços da interface pararam, mas o banco não foi encerrado.', 'Rode o comando stop novamente.'),
      ], { webPort: state.webPort ?? options.webPort ?? 5177 }, 'manual'));
      throw new Error(`Não foi possível parar o Supabase: ${redact(result.stderr || result.stdout || result.error)}`);
    }
  }
  await rm(paths.state, { force: true });
  await writeJsonAtomic(paths.readiness, snapshotFrom([
    check('launcher', 'Inicialização assistida', 'degraded', 'Serviços do launcher estão parados.', 'Rode node scripts/marketing-studio.mjs start.', false),
  ], { webPort: state.webPort ?? options.webPort ?? 5177 }, 'manual'));
  console.log(`Marketing Studio encerrado. Web: ${webStopped ? 'ok' : 'já parado'}; BFF: ${bffStopped ? 'ok' : 'já parado'}. Dados preservados.`);
}

async function start(options) {
  const paths = runtimePaths();
  await mkdir(paths.directory, { recursive: true });
  const previous = await readJson(paths.state);
  if (previous && await ownedProcessAlive(previous.web, previous.repoRoot) && await ownedProcessAlive(previous.bff, previous.repoRoot)) {
    console.log(`Marketing Studio já está aberto em http://127.0.0.1:${previous.webPort}`);
    return;
  }
  if (previous) {
    await terminateOwnedProcess(previous.web, previous.repoRoot);
    await terminateOwnedProcess(previous.bff, previous.repoRoot);
    await rm(paths.state, { force: true });
  }

  const result = await preflight(options);
  let snapshot = snapshotFrom(result.checks, options);
  await writeJsonAtomic(paths.readiness, snapshot);
  printSnapshot(snapshot);
  if (snapshot.status === 'blocked') throw new Error('Corrija os bloqueios acima e rode o mesmo comando novamente.');

  let supabase = result.supabase;
  let supabaseStartedByLauncher = false;
  let supabaseStartRequested = false;
  let supabaseStartPromise = null;
  let migrations = { ok: false, count: 0 };
  let bff;
  let web;
  let interruptedSignal = null;
  let cleanupChain = Promise.resolve();
  let finalSnapshot = snapshot;
  let browserWarning = null;
  let cleanupFailure = null;

  const cleanupStartedResources = () => {
    cleanupChain = cleanupChain.then(async () => {
      await terminateOwnedProcess(web, repoRoot);
      await terminateOwnedProcess(bff, repoRoot);
      if (supabaseStartPromise) await supabaseStartPromise;
      if ((supabaseStartedByLauncher || supabaseStartRequested) && result.supabaseBin) {
        const current = await supabaseStatus(result.supabaseBin);
        if (current.running) {
          const stopped = await runCapture(result.supabaseBin, ['stop'], { cwd: appRoot, timeoutMs: 120_000 });
          if (!stopped.ok) {
            cleanupFailure = `Não foi possível reverter o Supabase iniciado nesta tentativa: ${redact(stopped.stderr || stopped.stdout || stopped.error)}`;
            await writeJsonAtomic(paths.state, {
              schemaVersion: 1,
              runtimeId: randomUUID(),
              repoRoot,
              startedAt: new Date().toISOString(),
              webPort: options.webPort,
              bffPort: options.bffPort,
              web,
              bff,
              supabaseBin: result.supabaseBin,
              supabaseStartedByLauncher: true,
            });
            await writeJsonAtomic(paths.readiness, snapshotFrom([
              check('supabase', 'Supabase local', 'blocked', 'A inicialização foi revertida, mas o banco não parou.', 'Rode node scripts/marketing-studio.mjs stop.'),
            ], options, 'manual'));
            return;
          }
        }
        supabaseStartedByLauncher = false;
        supabaseStartRequested = false;
        cleanupFailure = null;
      }
      await rm(paths.state, { force: true });
    });
    return cleanupChain;
  };
  const interrupt = (signal) => {
    interruptedSignal = signal;
    void cleanupStartedResources();
  };
  const onSigint = () => interrupt('SIGINT');
  const onSigterm = () => interrupt('SIGTERM');
  const assertNotInterrupted = () => {
    if (interruptedSignal) throw new Error(`Inicialização interrompida por ${interruptedSignal}; serviços iniciados foram encerrados.`);
  };
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);

  try {
    if (!existsSync(resolve(appRoot, 'node_modules'))) {
      if (!options.install) throw new Error('Dependências ausentes e --no-install foi informado.');
      console.log('\nInstalando dependências do Marketing Studio...');
      const install = await runCapture(result.npmBin, ['ci', '--no-audit', '--no-fund'], { cwd: appRoot, timeoutMs: 10 * 60_000 });
      if (!install.ok) throw new Error(`Falha ao instalar dependências: ${redact(install.stderr || install.stdout || install.error)}`);
    }
    assertNotInterrupted();

    if (!supabase.running) {
      console.log('Iniciando banco e autenticação locais...');
      supabaseStartRequested = true;
      supabaseStartPromise = runCapture(result.supabaseBin, ['start'], { cwd: appRoot, timeoutMs: 5 * 60_000 });
      const started = await supabaseStartPromise;
      supabaseStartPromise = null;
      if (!started.ok) throw new Error(`Falha ao iniciar o Supabase: ${redact(started.stderr || started.stdout || started.error)}`);
      supabaseStartedByLauncher = true;
      supabaseStartRequested = false;
      supabase = await supabaseStatus(result.supabaseBin);
    }
    if (!supabase.running) throw new Error('O Supabase iniciou, mas não respondeu ao diagnóstico local.');
    assertNotInterrupted();

    const migrated = await runCapture(result.supabaseBin, ['migration', 'up', '--local'], { cwd: appRoot, timeoutMs: 120_000 });
    if (!migrated.ok) throw new Error(`Falha ao aplicar migrations: ${redact(migrated.stderr || migrated.stdout || migrated.error)}`);
    migrations = await migrationStatus(result.supabaseBin);
    if (!migrations.ok) throw new Error('As migrations locais não ficaram alinhadas após a atualização.');
    assertNotInterrupted();

    const token = randomBytes(32).toString('hex');
    const commonEnv = codexCliEnvironment();
    Object.assign(commonEnv, {
      CODEX_CLI_PATH: result.codexBin,
      SUPABASE_URL: supabase.env.API_URL,
      SUPABASE_SERVICE_ROLE_KEY: supabase.env.SERVICE_ROLE_KEY,
      COHORT_REPO_ROOT: repoRoot,
      LOCAL_SKILL_RUNNER_ENABLED: 'true',
      LOCAL_SKILL_RUNNER_TOKEN: token,
      MARKETING_STUDIO_READINESS_FILE: paths.readiness,
      HOST: '127.0.0.1',
      PORT: String(options.bffPort),
      CORS_ORIGIN: `http://127.0.0.1:${options.webPort}`,
    });
    const webEnv = {
      ...commonEnv,
      VITE_SUPABASE_URL: supabase.env.API_URL,
      VITE_SUPABASE_ANON_KEY: supabase.env.ANON_KEY,
      VITE_DEMO_AUTH: 'false',
      LOCAL_BFF_URL: `http://127.0.0.1:${options.bffPort}`,
    };

    const tsxBin = await findExecutable('tsx');
    const viteBin = await findExecutable('vite');
    if (!tsxBin || !viteBin) throw new Error('Dependências instaladas, mas os executáveis tsx/vite não foram encontrados.');
    bff = spawnService(tsxBin, ['watch', resolve(appRoot, 'server/start.ts')], commonEnv, paths.bffLog);
    web = spawnService(viteBin, ['--host', '127.0.0.1', '--port', String(options.webPort)], webEnv, paths.webLog);
    await waitFor(`http://127.0.0.1:${options.bffPort}/healthz`);
    await waitFor(`http://127.0.0.1:${options.webPort}`);
    assertNotInterrupted();

    const finalChecks = result.checks.map((item) => {
      if (item.id === 'npm') return check('npm', 'Dependências', 'ready', 'Dependências instaladas.');
      if (item.id === 'supabase') return check('supabase', 'Supabase local', 'ready', 'Banco e autenticação locais estão ativos.');
      if (item.id === 'migrations') return check('migrations', 'Banco atualizado', 'ready', `${migrations.count} migrations alinhadas.`);
      return item;
    });
    finalChecks.push(check('bff', 'Motor local', 'ready', `BFF ativo na porta ${options.bffPort}.`));
    finalChecks.push(check('web', 'Interface', 'ready', `Interface ativa na porta ${options.webPort}.`));
    finalSnapshot = snapshotFrom(finalChecks, options);
    await writeJsonAtomic(paths.readiness, finalSnapshot);
    assertNotInterrupted();
    await writeJsonAtomic(paths.state, {
      schemaVersion: 1,
      runtimeId: randomUUID(),
      repoRoot,
      startedAt: new Date().toISOString(),
      webPort: options.webPort,
      bffPort: options.bffPort,
      web,
      bff,
      supabaseBin: result.supabaseBin,
      supabaseStartedByLauncher,
    });
    assertNotInterrupted();

    if (options.openBrowser) {
      const browser = browserCommand();
      const opened = await runCapture(browser.command, [...browser.args, finalSnapshot.appUrl], { timeoutMs: 15_000 });
      if (!opened.ok) {
        browserWarning = `Não foi possível abrir o navegador automaticamente. Abra ${finalSnapshot.appUrl}.`;
        const degradedChecks = finalChecks.map((item) => item.id === 'browser'
          ? check('browser', 'Navegador', 'degraded', 'A abertura automática falhou.', `Abra manualmente ${finalSnapshot.appUrl}.`, false)
          : item);
        finalSnapshot = snapshotFrom(degradedChecks, options);
        await writeJsonAtomic(paths.readiness, finalSnapshot);
      }
    }
    assertNotInterrupted();
  } catch (error) {
    await cleanupStartedResources();
    if (cleanupFailure) throw new Error(`${error instanceof Error ? error.message : error} ${cleanupFailure}`);
    throw error;
  } finally {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
  }

  console.log(`\nMarketing Studio aberto: ${finalSnapshot.appUrl}`);
  console.log('Para encerrar somente estes serviços: node scripts/marketing-studio.mjs stop');
  if (browserWarning) console.warn(browserWarning);
  if (finalSnapshot.status === 'degraded') console.log('O Studio está operante com avisos; consulte o ícone de servidor no cabeçalho.');
}

async function main() {
  loadRepoEnvironment();
  const options = parseCli(process.argv.slice(2));
  if (options.command === 'stop') return await stop(options);
  if (options.command === 'status') {
    const paths = runtimePaths();
    const state = await readJson(paths.state);
    const snapshot = await readJson(paths.readiness);
    if (state && snapshot && await ownedProcessAlive(state.web, state.repoRoot) && await ownedProcessAlive(state.bff, state.repoRoot)) {
      printSnapshot(snapshot);
      console.log(`\nMarketing Studio aberto: http://127.0.0.1:${state.webPort}`);
      return;
    }
    console.log('\nMarketing Studio não está em execução pelo launcher. Diagnóstico do ambiente:');
  }
  if (options.command === 'check' || options.command === 'status') {
    const result = await preflight(options);
    const snapshot = snapshotFrom(result.checks, options);
    await writeJsonAtomic(runtimePaths().readiness, snapshot);
    printSnapshot(snapshot);
    if (snapshot.status === 'blocked') process.exitCode = 1;
    return;
  }
  await start(options);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`\nNão foi possível concluir o comando do Marketing Studio.\n${redact(error instanceof Error ? error.message : error)}`);
    process.exitCode = 1;
  });
}
