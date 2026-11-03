import { api } from './api.js';
import { criarVisaoRun } from './runs.js';
import { criarArquivos } from './arquivos.js';

const $ = (s) => document.querySelector(s);
const ROTULO = {
  na_fila: 'na fila', executando: 'executando', aguardando_resposta: 'aguardando você',
  concluido: 'concluído', erro: 'erro', cancelado: 'cancelado',
};

let projeto = null;
let skills = [];
let skillEscolhida = null;

const arquivos = criarArquivos({
  arvore: $('#arvore'), visualizador: $('#visualizador'), obterProjeto: () => projeto,
});
const visao = criarVisaoRun({
  cabecalho: $('#cabecalho-run'), log: $('#log'), form: $('#form-resposta'),
  aoMudar: () => carregarRuns(),
  aoArquivosMudarem: () => arquivos.recarregar(),
});

function lembrar(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch { /* sem armazenamento: segue */ }
}
function recordar(chave) {
  try { return localStorage.getItem(chave); } catch { return null; }
}

async function diagnostico() {
  const alvo = $('#diag');
  try {
    const d = await api('/api/diagnostico');
    if (d.problemas.length === 0) {
      alvo.textContent = `Claude Code ${d.versao}`;
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

function desenharSkills() {
  const filtro = $('#filtro-skill').value.trim().toLowerCase();
  const lista = $('#lista-skills');
  lista.replaceChildren();
  for (const s of skills.filter((x) => x.name.includes(filtro) || x.description.toLowerCase().includes(filtro))) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.name;
    b.title = s.description;
    b.onclick = () => escolherSkill(s.name);
    li.append(b);
    lista.append(li);
  }
}

function escolherSkill(nome) {
  skillEscolhida = nome;
  $('#nova-skill').textContent = `/${nome}`;
  $('#form-nova').hidden = false;
  $('#nova-args').focus();
}

async function carregarRuns() {
  const lista = $('#lista-runs');
  lista.replaceChildren();
  if (!projeto) return;
  try {
    const { runs } = await api(`/api/projetos/${projeto}/runs`);
    for (const r of runs) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `/${r.skill} · ${ROTULO[r.estado] ?? r.estado}`;
      b.title = new Date(r.criadoEm).toLocaleString('pt-BR');
      b.onclick = () => visao.abrir(r.id);
      li.append(b);
      lista.append(li);
    }
  } catch (e) {
    lista.textContent = e.message;
  }
}

async function trocarProjeto(slug) {
  projeto = slug || null;
  if (projeto) lembrar('painel.projeto', projeto);
  visao.fechar();
  arquivos.recarregar();
  await carregarRuns();
}

$('#sel-projeto').addEventListener('change', (e) => trocarProjeto(e.target.value));
$('#filtro-skill').addEventListener('input', desenharSkills);
$('#form-nova').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!projeto || !skillEscolhida) return;
  try {
    const meta = await api('/api/runs', {
      metodo: 'POST', corpo: { skill: skillEscolhida, projeto, args: $('#nova-args').value },
    });
    $('#nova-args').value = '';
    $('#form-nova').hidden = true;
    await carregarRuns();
    await visao.abrir(meta.id);
  } catch (err) {
    alert(err.message);
  }
});

async function iniciar() {
  diagnostico();
  const [{ projetos }, { skills: lista }] = await Promise.all([api('/api/projetos'), api('/api/skills')]);
  skills = lista;
  desenharSkills();
  const sel = $('#sel-projeto');
  for (const p of projetos) sel.append(new Option(p.slug, p.slug));
  if (projetos.length === 0) {
    sel.append(new Option('(nenhum projeto em projetos/)', ''));
  }
  const ultimo = recordar('painel.projeto');
  if (ultimo && projetos.some((p) => p.slug === ultimo)) sel.value = ultimo;
  await trocarProjeto(sel.value);
  if (projeto) {
    const { runs } = await api(`/api/projetos/${projeto}/runs`);
    const ativo = runs.find((r) => r.estado === 'executando' || r.estado === 'aguardando_resposta');
    if (ativo) visao.abrir(ativo.id);
  }
}

iniciar().catch((e) => { $('#diag').textContent = e.message; $('#diag').className = 'problema'; });
