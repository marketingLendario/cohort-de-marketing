// Blocos de uso das skills no seletor, na ordem em que o trabalho acontece num funil.
export const BLOCOS = [
  { titulo: 'Começar e acompanhar', skills: ['comecar', 'status-funil', 'zelador'] },
  { titulo: 'Pesquisa de mercado', skills: ['avatar-funil', 'espiao-do-concorrente', 'trend-hunting', 'swipe-file'] },
  { titulo: 'Oferta e identidade', skills: ['offerbook', 'design-md', 'metodo-funil', 'bonus-funil', 'mockup-produto-funil'] },
  { titulo: 'Copy e páginas', skills: ['copy-funil', 'pagina-vendas-funil', 'vsl-funil', 'advertorial-funil', 'quiz-funil', 'webinario-funil', 'lancamento-funil'] },
  { titulo: 'Relacionamento e pós-venda', skills: ['email-funil', 'whatsapp-funil', 'conteudo-funil', 'recuperacao-funil', 'backend-funil'] },
  { titulo: 'Criativos e tráfego', skills: ['criativos-funil', 'ads-creative-factory', 'briefista', 'estruturador', 'iniciar-trafego', 'gestor-de-campanhas'] },
  { titulo: 'Dados e otimização', skills: ['analista-de-dados', 'coletor-de-dados', 'board-de-especialistas', 'painel-de-dados', 'leitor-de-metricas', 'diagnosticador', 'retroalimentacao', 'cro-funil'] },
];

// Workers internos que o dono nunca chama direto (o /iniciar-trafego usa o /iniciar-studio).
export const OCULTAS = new Set(['iniciar-studio']);

// Agrupa as skills em blocos. Sem filtro, a sugestão para o cliente vem primeiro;
// com filtro, só os blocos com resultado aparecem (sem repetir a sugestão).
export function agruparSkills(skills, { filtro = '', sugeridas = [] } = {}) {
  const f = filtro.trim().toLowerCase();
  const visiveis = skills.filter((s) => !OCULTAS.has(s.name)
    && (!f || s.name.includes(f) || (s.description ?? '').toLowerCase().includes(f)));
  const porNome = new Map(visiveis.map((s) => [s.name, s]));
  const grupos = [];

  if (!f) {
    const itens = sugeridas.map((n) => porNome.get(n)).filter(Boolean);
    if (itens.length) grupos.push({ titulo: 'Próximo passo deste cliente', itens });
  }
  const usadas = new Set();
  for (const b of BLOCOS) {
    const itens = b.skills.map((n) => porNome.get(n)).filter(Boolean);
    itens.forEach((s) => usadas.add(s.name));
    if (itens.length) grupos.push({ titulo: b.titulo, itens });
  }
  const outras = visiveis.filter((s) => !usadas.has(s.name));
  if (outras.length) grupos.push({ titulo: 'Outras', itens: outras });
  return grupos;
}
