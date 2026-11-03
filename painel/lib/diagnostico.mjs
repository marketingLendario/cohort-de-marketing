import { execFile } from 'node:child_process';

export async function diagnosticar({ claudeBin = 'claude', claudeBaseArgs = [], execFileFn = execFile } = {}) {
  const rodar = (args) => new Promise((ok, ko) => {
    execFileFn(claudeBin, [...claudeBaseArgs, ...args], { timeout: 15000 },
      (erro, stdout) => (erro ? ko(erro) : ok(String(stdout))));
  });

  const problemas = [];
  let versao;
  try {
    versao = (await rodar(['--version'])).trim();
  } catch {
    problemas.push({
      codigo: 'claude_ausente',
      mensagem: 'Claude Code não encontrado neste computador.',
      comando: 'npm install -g @anthropic-ai/claude-code',
    });
    return { claudeInstalado: false, versao: null, logado: null, problemas };
  }

  let logado = null;
  try {
    logado = JSON.parse(await rodar(['auth', 'status'])).loggedIn === true;
  } catch {
    logado = null;
  }
  if (logado === false) {
    problemas.push({
      codigo: 'sem_login',
      mensagem: 'Claude Code sem login. Abra o terminal, rode o comando e faça login.',
      comando: 'claude',
    });
  }
  return { claudeInstalado: true, versao, logado, problemas };
}
