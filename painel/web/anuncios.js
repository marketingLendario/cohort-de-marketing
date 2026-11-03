import { api } from './api.js';

const SVG = 'http://www.w3.org/2000/svg';

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto != null) e.textContent = texto;
  return e;
}

function svg(tag, atributos = {}) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(atributos)) e.setAttribute(k, String(v));
  return e;
}

function botao(classe, texto, acao) {
  const b = el('button', classe, texto);
  b.type = 'button';
  b.onclick = acao;
  return b;
}

const valor = (v, casas = 2) => (v == null ? '—'
  : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }));
const inteiro = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR'));
const dataCurta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

// Variação entre períodos: seta + texto, e a cor só reforça (nunca é o único sinal).
function variacao(delta, sentidoBom) {
  if (delta == null) return null;
  const sobe = delta > 0;
  let tom = 'neutro';
  if (sentidoBom && delta !== 0) tom = (sobe === (sentidoBom === 'sobe')) ? 'bom' : 'ruim';
  return el('span', `variacao ${tom}`, `${sobe ? '▲' : delta < 0 ? '▼' : '■'} ${valor(Math.abs(delta), 1)}%`);
}

function indicador(rotulo, texto, delta, sentidoBom) {
  const d = el('div', 'indicador');
  d.append(el('span', 'rotulo-indicador', rotulo), el('strong', '', texto));
  const v = variacao(delta, sentidoBom);
  if (v) d.append(v);
  return d;
}

// Linha única de investimento diário, com cruz e dica ao passar o mouse.
function graficoInvestimento(serie) {
  const caixa = el('div', 'grafico');
  if (serie.length < 2) { caixa.append(el('p', 'vazio', 'Sem série diária suficiente para o gráfico.')); return caixa; }
  const L = 640; const A = 200; const m = { t: 12, r: 12, b: 26, l: 44 };
  const max = Math.max(...serie.map((d) => d.investimento)) || 1;
  const teto = Math.ceil(max / 10) * 10;
  const x = (i) => m.l + (i / (serie.length - 1)) * (L - m.l - m.r);
  const y = (v) => m.t + (1 - v / teto) * (A - m.t - m.b);
  const s = svg('svg', { viewBox: `0 0 ${L} ${A}`, role: 'img', 'aria-label': 'Investimento por dia' });

  for (const f of [0, 0.5, 1]) {
    const yy = y(teto * f);
    s.append(svg('line', { x1: m.l, x2: L - m.r, y1: yy, y2: yy, class: 'grade' }));
    const t = svg('text', { x: m.l - 8, y: yy + 4, 'text-anchor': 'end', class: 'eixo' });
    t.textContent = valor(teto * f, 0);
    s.append(t);
  }
  for (const i of [0, Math.floor((serie.length - 1) / 2), serie.length - 1]) {
    const t = svg('text', { x: x(i), y: A - 6, 'text-anchor': i === 0 ? 'start' : i === serie.length - 1 ? 'end' : 'middle', class: 'eixo' });
    t.textContent = dataCurta(serie[i].data);
    s.append(t);
  }
  const pontos = serie.map((d, i) => `${x(i)},${y(d.investimento)}`);
  s.append(svg('path', { d: `M${m.l},${y(0)} L${pontos.join(' L')} L${x(serie.length - 1)},${y(0)} Z`, class: 'area' }));
  s.append(svg('path', { d: `M${pontos.join(' L')}`, class: 'linha' }));

  const cruz = svg('line', { y1: m.t, y2: A - m.b, class: 'cruz', visibility: 'hidden' });
  const ponto = svg('circle', { r: 4.5, class: 'ponto-grafico', visibility: 'hidden' });
  const alvo = svg('rect', { x: m.l, y: m.t, width: L - m.l - m.r, height: A - m.t - m.b, fill: 'transparent' });
  s.append(cruz, ponto, alvo);
  const dica = el('div', 'dica-grafico');
  dica.hidden = true;

  alvo.addEventListener('mousemove', (ev) => {
    const caixaSvg = s.getBoundingClientRect();
    const px = ((ev.clientX - caixaSvg.left) / caixaSvg.width) * L;
    const i = Math.max(0, Math.min(serie.length - 1, Math.round(((px - m.l) / (L - m.l - m.r)) * (serie.length - 1))));
    const d = serie[i];
    cruz.setAttribute('x1', x(i)); cruz.setAttribute('x2', x(i)); cruz.setAttribute('visibility', 'visible');
    ponto.setAttribute('cx', x(i)); ponto.setAttribute('cy', y(d.investimento)); ponto.setAttribute('visibility', 'visible');
    dica.replaceChildren(el('strong', '', dataCurta(d.data)),
      el('span', '', `Investimento ${valor(d.investimento)}`), el('span', '', `${inteiro(d.compras)} compras`));
    dica.hidden = false;
    const esquerda = (x(i) / L) * caixaSvg.width;
    dica.style.left = `${Math.min(Math.max(esquerda, 70), caixaSvg.width - 70)}px`;
  });
  alvo.addEventListener('mouseleave', () => {
    cruz.setAttribute('visibility', 'hidden'); ponto.setAttribute('visibility', 'hidden'); dica.hidden = true;
  });

  caixa.append(s, dica);
  return caixa;
}

function funil(etapas) {
  const lista = el('ol', 'funil-anuncios');
  const topo = etapas[0]?.valor || 1;
  etapas.forEach((e, i) => {
    const li = el('li');
    const texto = el('div', 'funil-texto');
    texto.append(el('span', '', e.nome), el('strong', '', inteiro(e.valor)));
    const trilha = el('div', 'funil-trilha');
    const barra = el('i');
    barra.style.width = `${Math.max(1.5, (e.valor / topo) * 100)}%`;
    trilha.append(barra);
    li.append(texto, trilha);
    if (i > 0 && etapas[i - 1].valor) {
      li.append(el('span', 'funil-taxa', `${valor((e.valor / etapas[i - 1].valor) * 100, 1)}% da etapa anterior`));
    }
    lista.append(li);
  });
  return lista;
}

function tabelaCampanhas(campanhas) {
  const t = el('table', 'tabela-campanhas');
  const cab = el('tr');
  for (const c of ['Campanha', 'Investimento', 'Compras', 'Custo por compra', 'ROAS']) cab.append(el('th', '', c));
  const thead = el('thead'); thead.append(cab);
  const tbody = el('tbody');
  const max = Math.max(...campanhas.map((c) => c.investimento), 1);
  for (const c of campanhas) {
    const tr = el('tr');
    const nome = el('td');
    nome.append(el('span', 'nome-campanha', c.nome), el('span', `situacao ${c.ativa ? 'ativa' : 'pausada'}`, c.ativa ? 'Ativa' : 'Pausada'));
    const inv = el('td', 'num');
    const barra = el('span', 'barra-inline');
    const preenchido = el('i');
    preenchido.style.width = `${(c.investimento / max) * 100}%`;
    barra.append(preenchido);
    inv.append(el('span', '', valor(c.investimento)), barra);
    tr.append(nome, inv, el('td', 'num', inteiro(c.compras)), el('td', 'num', valor(c.custoPorCompra)),
      el('td', 'num', c.roas == null ? '—' : `${valor(c.roas, 1)}x`));
    tbody.append(tr);
  }
  t.append(thead, tbody);
  return t;
}

// Janela "Conta de anúncios": lê o que as skills de dados coletaram e oferece rodar a análise.
export function criarAnuncios({ janela, alvo, obterProjeto, aoAnalisar, aoAbrirArquivo }) {
  function fechar() { janela.close(); }

  function analisar() {
    fechar();
    aoAnalisar();
  }

  function topo(slug, r) {
    const d = el('div', 'resumo-topo');
    const t = el('div');
    t.append(el('p', 'sobrelinha', 'Conta de anúncios Meta'), el('h2', '', slug));
    if (r.disponivel) {
      const linha = el('p');
      const partes = [r.escopo, r.atualizadoEm && `atualizado em ${new Date(r.atualizadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`].filter(Boolean);
      linha.textContent = partes.join(' · ');
      if (r.modo === 'exemplo') linha.prepend(el('span', 'selo-exemplo', 'Dados de exemplo'), ' ');
      t.append(linha);
    }
    const acoes = el('div', 'acoes-topo');
    if (r.painel) acoes.append(botao('botao-texto', 'Abrir painel completo', () => { fechar(); aoAbrirArquivo(r.painel); }));
    acoes.append(botao('botao-primario', r.disponivel ? 'Analisar de novo' : 'Analisar conta', analisar));
    const x = botao('botao-icone', '×', fechar);
    x.setAttribute('aria-label', 'Fechar');
    acoes.append(x);
    d.append(t, acoes);
    return d;
  }

  function vazio(r) {
    const c = el('section', 'cartao vazio-anuncios');
    c.append(el('h3', '', r.erro ?? 'A conta de anúncios deste cliente ainda não foi analisada'));
    c.append(el('p', '', 'A análise roda a /analista-de-dados: coleta campanhas, gastos e resultados da Meta, ouve o board de especialistas e monta o painel. Sem as chaves da Meta no .env, ela oferece o Modo Exemplo com dados fictícios para você conhecer o painel.'));
    c.append(botao('botao-primario', 'Analisar conta de anúncios', analisar));
    return c;
  }

  function desenhar(slug, r) {
    const frag = document.createDocumentFragment();
    frag.append(topo(slug, r));
    if (!r.disponivel) { frag.append(vazio(r)); return frag; }

    const d = r.comparacao?.deltas ?? {};
    const linha = el('div', 'indicadores');
    linha.append(
      indicador('Investimento', valor(r.totais.investimento), d.spend, null),
      indicador('Compras', inteiro(r.totais.compras), d.purchases, 'sobe'),
      indicador('Custo por compra', valor(r.totais.custoPorCompra), null, null),
      indicador('CTR', `${valor(r.totais.ctr)}%`, d.ctr, 'sobe'),
      indicador('CPM', valor(r.totais.cpm), d.cpm, 'desce'),
    );
    frag.append(linha);
    if (r.comparacao) frag.append(el('p', 'nota-variacao', `Variações: ${r.comparacao.rotulo}.`));

    const grade = el('div', 'grade-anuncios');
    const serie = el('section', 'cartao');
    serie.append(el('h3', '', 'Investimento por dia'), graficoInvestimento(r.serie));
    grade.append(serie);
    if (r.funil.length) {
      const f = el('section', 'cartao');
      f.append(el('h3', '', 'Funil de conversão'), funil(r.funil));
      grade.append(f);
    }
    frag.append(grade);

    if (r.campanhas.length) {
      const c = el('section', 'cartao');
      c.append(el('h3', '', `Campanhas (${r.campanhas.length})`));
      const rolagem = el('div', 'rolagem-tabela');
      rolagem.append(tabelaCampanhas(r.campanhas));
      c.append(rolagem);
      frag.append(c);
    }

    if (r.especialistas.length || r.sintese) {
      const b = el('section', 'cartao');
      b.append(el('h3', '', 'O que os especialistas recomendam'));
      if (r.sintese) b.append(el('p', 'sintese', r.sintese));
      const cartoes = el('div', 'especialistas');
      for (const e of r.especialistas) {
        const c = el('article', 'especialista');
        c.append(el('span', 'papel', e.papel), el('strong', '', e.titulo), el('p', '', e.alavanca));
        cartoes.append(c);
      }
      b.append(cartoes);
      frag.append(b);
    }
    return frag;
  }

  async function abrir() {
    const slug = obterProjeto();
    if (!slug) return;
    alvo.replaceChildren(el('p', 'vazio', 'Lendo os dados da conta…'));
    if (!janela.open) janela.showModal();
    try {
      const r = await api(`/api/projetos/${slug}/anuncios`);
      alvo.replaceChildren(desenhar(slug, r));
    } catch (e) {
      alvo.replaceChildren(el('p', 'msg erro', e.message));
    }
  }

  janela.addEventListener('click', (e) => { if (e.target === janela) fechar(); });
  return { abrir };
}
