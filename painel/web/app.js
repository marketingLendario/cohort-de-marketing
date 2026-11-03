import { api } from './api.js';
import { criarVisaoRun } from './runs.js';
import { criarArquivos } from './arquivos.js';
import { criarHistorico } from './historico.js';
import { criarComposer } from './composer.js';
import { criarResumo } from './resumo.js';

const $ = (s) => document.querySelector(s);

let cliente = null;

function lembrar(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch { /* sem armazenamento: segue */ }
}
function recordar(chave) {
  try { return localStorage.getItem(chave); } catch { return null; }
}

const arquivos = criarArquivos({
  arvore: $('#arvore'), visualizador: $('#visualizador'), titulo: $('#titulo-arquivo'),
  janela: $('#janela-arquivo'), obterProjeto: () => cliente,
});

const historico = criarHistorico({
  lista: $('#linha-tempo'), obterProjeto: () => cliente,
  obterAberto: () => visao.idAberto(),
  aoAbrir: (id) => { fecharGavetas(); visao.abrir(id).then(() => historico.carregar()); },
});

const composer = criarComposer({
  form: $('#composer'), campo: $('#campo'), botaoSkill: $('#botao-skill'),
  chip: $('#chip-skill'), chipNome: $('#chip-nome'), tirarSkill: $('#tirar-skill'),
  popover: $('#popover-skills'), busca: $('#busca-skill'), lista: $('#lista-skills'),
  enviar: $('#enviar'),
  aoEnviar: async ({ skill, texto }) => {
    if (!cliente) return;
    if (skill) {
      const meta = await api('/api/runs', { metodo: 'POST', corpo: { skill, projeto: cliente, args: texto } });
      await visao.abrir(meta.id);
      historico.carregar();
    } else {
      await visao.responder(texto);
    }
  },
});

const visao = criarVisaoRun({
  cabecalho: $('#cabecalho-run'), log: $('#log'), boasVindas: $('#boas-vindas'),
  aoMudar: () => historico.carregar(),
  aoArquivosMudarem: () => arquivos.recarregar(),
  aoEstado: (meta) => composer.definirEstado({ podeResponder: visao?.podeResponder() ?? false, temCliente: Boolean(cliente), runAberto: Boolean(meta) }),
});

const resumo = criarResumo({
  janela: $('#janela-resumo'), alvo: $('#resumo'), obterProjeto: () => cliente,
  aoAbrirArquivo: (caminho) => arquivos.abrirArquivo(caminho),
  aoRodarSkill: (skill) => { visao.fechar(); composer.escolher(skill); },
});

async function diagnostico() {
  const alvo = $('#diag');
  try {
    const d = await api('/api/diagnostico');
    if (d.problemas.length === 0) {
      const versao = String(d.versao ?? '').match(/^\d+(\.\d+)+/)?.[0];
      alvo.textContent = versao ? `Claude Code ${versao} conectado` : 'Claude Code conectado';
      alvo.className = '';
    } else {
      alvo.textContent = d.problemas.map((p) => `${p.mensagem} Comando: ${p.comando}`).join(' · ');
      alvo.className = 'problema';
    }
  } catch (e) {
    alvo.textContent = e.message;
    alvo.className = 'problema';
  }
}

async function carregarClientes(escolher) {
  const { projetos } = await api('/api/projetos');
  const sel = $('#sel-cliente');
  sel.replaceChildren();
  if (projetos.length === 0) sel.append(new Option('Nenhum cliente ainda', ''));
  for (const p of projetos) sel.append(new Option(p.slug, p.slug));
  const preferido = escolher ?? recordar('painel.cliente');
  if (preferido && projetos.some((p) => p.slug === preferido)) sel.value = preferido;
  return sel.value;
}

async function trocarCliente(slug) {
  cliente = slug || null;
  if (cliente) lembrar('painel.cliente', cliente);
  $('#nome-saudacao').textContent = cliente ?? 'este cliente';
  $('#avaliar').disabled = !cliente;
  visao.fechar();
  arquivos.recarregar();
  await historico.carregar();
  if (!cliente) return;
  const { runs } = await api(`/api/projetos/${cliente}/runs`);
  const ativo = runs.find((r) => r.estado === 'executando' || r.estado === 'aguardando_resposta');
  if (ativo) await visao.abrir(ativo.id);
}

function fecharGavetas() {
  $('#lateral').classList.remove('aberto');
  $('#historico').classList.remove('aberto');
}

// ---- eventos ----
$('#sel-cliente').addEventListener('change', (e) => trocarCliente(e.target.value));
$('#nova-conversa').addEventListener('click', () => {
  fecharGavetas();
  visao.fechar();
  historico.carregar();
  composer.abrirSkills();
});
$('#avaliar').addEventListener('click', () => { fecharGavetas(); resumo.abrir(); });
$('#abrir-lateral').addEventListener('click', () => $('#lateral').classList.toggle('aberto'));
$('#abrir-historico').addEventListener('click', () => $('#historico').classList.toggle('aberto'));
for (const b of document.querySelectorAll('[data-fechar]')) {
  b.addEventListener('click', () => b.closest('dialog').close());
}
$('#janela-arquivo').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

$('#novo-cliente').addEventListener('click', () => {
  $('#form-cliente').hidden = false;
  $('#erro-cliente').hidden = true;
  $('#nome-cliente').focus();
});
$('#cancelar-cliente').addEventListener('click', () => { $('#form-cliente').hidden = true; });
$('#form-cliente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = $('#nome-cliente').value.trim();
  if (!nome) return;
  try {
    const { slug } = await api('/api/projetos', { metodo: 'POST', corpo: { nome } });
    $('#nome-cliente').value = '';
    $('#form-cliente').hidden = true;
    await trocarCliente(await carregarClientes(slug));
    composer.definirEstado({ temCliente: true });
  } catch (err) {
    $('#erro-cliente').textContent = err.message;
    $('#erro-cliente').hidden = false;
  }
});

async function iniciar() {
  diagnostico();
  const { skills } = await api('/api/skills');
  composer.definirSkills(skills);
  await trocarCliente(await carregarClientes());
  composer.definirEstado({ temCliente: Boolean(cliente) });
}

iniciar().catch((e) => { $('#diag').textContent = e.message; $('#diag').className = 'problema'; });
