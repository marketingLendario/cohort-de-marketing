import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Lê o que as skills de dados (/coletor-de-dados, /board-de-especialistas, /painel-de-dados)
// deixam em projetos/{slug}/ e devolve um resumo pronto para o painel visual.

const centavos = (v) => Math.round((Number(v) || 0) * 100) / 100;
const num = (v) => Number(v) || 0;

function ehArquivo(caminho) {
  try { return statSync(caminho).isFile(); } catch { return false; }
}

function lerJson(caminho) {
  return JSON.parse(readFileSync(caminho, 'utf8'));
}

export function resumoAnuncios(dir) {
  const arqBundle = join(dir, 'dados-trafego', 'bundle.json');
  if (!ehArquivo(arqBundle)) return { disponivel: false };
  let b;
  try {
    b = lerJson(arqBundle);
  } catch {
    return { disponivel: false, erro: 'Não foi possível ler os dados da conta (dados-trafego/bundle.json). Rode a análise de novo.' };
  }

  const dias = Array.isArray(b.series?.dia) ? b.series.dia : [];
  const serie = dias.map((d) => ({ data: String(d.periodo), investimento: centavos(d.spend), compras: num(d.purchases) }));
  const soma = (campo) => dias.reduce((s, d) => s + num(d[campo]), 0);
  const investimento = centavos(soma('spend'));
  const impressoes = soma('impressions');
  const cliques = soma('clicks');
  const compras = soma('purchases');

  const campanhas = (Array.isArray(b.campanhas) ? b.campanhas : [])
    .map((c) => ({
      nome: String(c.nome ?? c.id ?? 'Campanha'),
      ativa: c.status === 'ACTIVE',
      investimento: centavos(c.spend),
      compras: num(c.purchases),
      custoPorCompra: num(c.purchases) ? centavos(num(c.spend) / num(c.purchases)) : null,
      ctr: c.ctr ?? null,
      roas: c.roas?.valor ?? null,
    }))
    .sort((x, y) => y.investimento - x.investimento);

  const cmp = b.comparacao;
  const comparacao = cmp?.deltas
    ? { rotulo: `${cmp.periodo_b?.rotulo ?? 'período atual'} vs. ${cmp.periodo_a?.rotulo ?? 'período anterior'}`, deltas: cmp.deltas }
    : null;

  let especialistas = [];
  let sintese = null;
  const arqBoard = join(dir, 'dados-trafego', 'board.json');
  if (ehArquivo(arqBoard)) {
    try {
      const board = lerJson(arqBoard);
      especialistas = (board.clones ?? []).map((c) => ({ papel: c.papel, titulo: c.titulo, alavanca: c.alavanca }));
      sintese = typeof board.sintese === 'string' ? board.sintese : null;
    } catch { /* board ilegível: o painel segue sem a leitura dos especialistas */ }
  }

  let atualizadoEm = null;
  try { atualizadoEm = statSync(arqBundle).mtime.toISOString(); } catch { /* sem data */ }

  return {
    disponivel: true,
    modo: b.modo ?? null,
    escopo: b.escopo ?? null,
    geradoEm: b.gerado_em ?? null,
    atualizadoEm,
    totais: {
      investimento,
      compras,
      custoPorCompra: compras ? centavos(investimento / compras) : null,
      ctr: impressoes ? centavos((cliques / impressoes) * 100) : null,
      cpm: impressoes ? centavos((investimento / impressoes) * 1000) : null,
    },
    comparacao,
    serie,
    campanhas,
    funil: (b.funil?.etapas ?? []).map((e) => ({ nome: e.nome, valor: num(e.valor) })),
    especialistas,
    sintese,
    painel: ehArquivo(join(dir, 'painel-trafego.html')) ? 'painel-trafego.html' : null,
  };
}
