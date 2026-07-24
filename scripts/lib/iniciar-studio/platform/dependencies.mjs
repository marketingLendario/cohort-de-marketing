import { spawnSync } from 'node:child_process';
import { detectDockerState } from '../discovery.mjs';

function run(command, args) {
  return spawnSync(command, args, { encoding: 'utf8', windowsHide: true, timeout: 15 * 60_000 });
}

export function ensureDockerAvailable(platform = process.platform) {
  const state = detectDockerState();
  if (state.ok || state.code === 'DOCKER_STOPPED') return state;
  if (state.code === 'DOCKER_PERMISSION_DENIED') {
    const error = new Error('Docker instalado, mas o usuário não tem permissão');
    error.code = state.code;
    throw error;
  }
  let result;
  if (platform === 'win32') result = run('winget', ['install', '--exact', '--id', 'Docker.DockerDesktop', '--accept-package-agreements', '--accept-source-agreements']);
  else if (platform === 'darwin') result = run('brew', ['install', '--cask', 'docker']);
  else {
    const manager = spawnSync('sh', ['-lc', 'command -v apt-get || command -v dnf'], { encoding: 'utf8' }).stdout.trim();
    if (manager.endsWith('apt-get')) result = run('pkexec', ['apt-get', 'install', '-y', 'docker.io']);
    else if (manager.endsWith('dnf')) result = run('pkexec', ['dnf', 'install', '-y', 'docker']);
    else {
      const error = new Error('Nenhum gerenciador Linux suportado para instalar Docker');
      error.code = 'DOCKER_INSTALL_UNSUPPORTED';
      throw error;
    }
  }
  if (result?.status !== 0) {
    const error = new Error(`Instalação do Docker falhou: ${(result?.stderr || result?.stdout || '').trim()}`);
    error.code = 'DOCKER_INSTALL_FAILED';
    throw error;
  }
  return { ok: true, code: 'DOCKER_INSTALLED_RESTART_MAY_BE_REQUIRED', installed: true };
}
