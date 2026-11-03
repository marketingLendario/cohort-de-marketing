import { api } from './api.js';

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto != null) e.textContent = texto;
  return e;
}

function botao(classe, texto, acao) {
  const b = el('button', classe, texto);
  b.type = 'button';
  b.onclick = acao;
  return b;
}

const dinheiro = (v) => `US$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

function quando(iso) {
  if (!iso) return 'nunca';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Janela "Avaliar conta": estado do funil do cliente, números das execuções e atalhos.
export function criarResumo({ janela, alvo, obterProjeto, aoAbrirArquivo, aoRodarSkill }) {
  async function abrir() {
    const slug = obterProjeto();
    if (!slug) return;
    alvo.replaceChildren(el('p', 'vazio', 'Avaliando a conta…'));
    if (!janela.open) janela.showModal();
    let r;
    try {
      r = await api(`/api/projetos/${slug}/resumo`);
    } catch (e) {
      alvo.replaceChildren(el('p', 'msg erro', e.message));
      return;
    }
    alvo.replaceChildren(desenhar(slug, r));
  }

  function fechar() { janela.close(); }

  function abrirArquivo(caminho) {
    fechar();
    aoAbrirArquivo(caminho);
  }

  function rodar(skill) {
    fechar();
    aoRodarSkill(skill);
  }

  function desenhar(slug, r) {
    const frag = document.createDocumentFragment();

    const topo = el('div', 'resumo-topo');
    const titulo = el('div');
    titulo.append(el('p', 'sobrelinha', 'Avaliação da conta'), el('h2', '', slug));
    titulo.append(el('p', '', r.proxima
      ? `Próximo passo: ${r.proxima.nome.toLowerCase()} com /${r.proxima.skill}.`
      : 'Todas as etapas do funil têm entrega. Hora de medir e otimizar.'));
    const fecharBtn = botao('botao-icone', '×', fechar);
    fecharBtn.setAttribute('aria-label', 'Fechar');
    topo.append(titulo, fecharBtn);
    frag.append(topo);

    const grade = el('div', 'resumo-grade');

    // Funil: a escada de etapas.
    const funil = el('section', 'cartao');
    funil.append(el('h3', '', 'Funil do cliente'));
    const prog = el('div', 'progresso-funil');
    prog.append(el('strong', '', `${r.feitas}`), el('span', '', `de ${r.etapas.length} etapas entregues`));
    const trilho = el('div', 'trilho');
    const barra = el('i');
    barra.style.width = '0%';
    trilho.append(barra);
    requestAnimationFrame(() => { barra.style.width = `${Math.round((r.feitas / r.etapas.length) * 100)}%`; });
    funil.append(prog, trilho);

    const escada = el('ol', 'escada');
    r.etapas.forEach((e, i) => {
      const proximo = r.proxima?.chave === e.chave;
      const li = el('li', `degrau${e.feito ? ' feito' : ''}${proximo ? ' proximo' : ''}`);
      const no = el('span', 'no', e.feito ? '✓' : String(i + 1));
      no.setAttribute('aria-hidden', 'true');
      const texto = el('div');
      texto.append(el('span', 'nome-etapa', e.nome),
        el('span', 'estado-etapa', e.feito ? 'Entregue' : proximo ? 'Próximo passo' : 'Ainda não feito'));
      const acao = e.feito
        ? botao('', 'Abrir', () => abrirArquivo(e.abrir))
        : botao('', `Rodar /${e.skill}`, () => rodar(e.skill));
      li.append(no, texto, acao);
      escada.append(li);
    });
    funil.append(escada);
    grade.append(funil);

    // Lado: números, skills usadas, pendências, outras peças.
    const lado = el('div', 'coluna-lado');

    const numeros = el('section', 'cartao');
    numeros.append(el('h3', '', 'Execuções'));
    const n = el('div', 'numeros');
    const numero = (valor, rotulo) => { const d = el('div', 'numero'); d.append(el('strong', '', valor), el('span', '', rotulo)); return d; };
    n.append(numero(String(r.execucoes.total), 'skills rodadas'),
      numero(String(r.execucoes.concluidas), 'concluídas'),
      numero(dinheiro(r.execucoes.custoUsd), 'gasto com IA'),
      numero(quando(r.execucoes.ultima), 'última atividade'));
    numeros.append(n);
    lado.append(numeros);

    const usadas = el('section', 'cartao');
    usadas.append(el('h3', '', 'Skills usadas'));
    if (r.skillsUsadas.length === 0) {
      usadas.append(el('p', 'vazio', 'Nenhuma ainda.'));
    } else {
      const fichas = el('div', 'fichas');
      for (const s of r.skillsUsadas) {
        const f = el('span', 'ficha', `/${s.skill}`);
        f.append(el('b', '', `×${s.vezes}`));
        f.title = `Última vez: ${quando(s.ultima)}`;
        fichas.append(f);
      }
      usadas.append(fichas);
    }
    lado.append(usadas);

    if (r.pendencias) {
      const pend = el('section', 'cartao');
      pend.append(el('h3', '', 'Decisões pendentes do dono'));
      const placar = el('div', 'pendencias-placar');
      const abertas = el('div');
      abertas.append(el('strong', '', String(r.pendencias.abertas)), document.createTextNode(' abertas'));
      placar.append(abertas, el('span', 'vazio', `${r.pendencias.resolvidas} resolvidas`));
      pend.append(placar, botao('link-acao', 'Ver pendências', () => abrirArquivo(r.pendencias.abrir)));
      lado.append(pend);
    }

    if (r.extras.length || r.book) {
      const pecas = el('section', 'cartao');
      pecas.append(el('h3', '', 'Outras entregas'));
      const fichas = el('div', 'fichas');
      if (r.book) fichas.append(botao('ficha botao', 'Book do Funil', () => abrirArquivo(r.book)));
      for (const x of r.extras) fichas.append(botao('ficha botao', x.nome, () => abrirArquivo(x.abrir)));
      pecas.append(fichas);
      lado.append(pecas);
    }

    grade.append(lado);
    frag.append(grade);
    return frag;
  }

  janela.addEventListener('click', (e) => { if (e.target === janela) fechar(); });
  return { abrir };
}
