/**
 * Exemplos ilustrativos derivados do catálogo público de skills.
 * Usados no mapa-skills.html para preview clicável.
 */
(function () {
  const SLUG = "academia-fit";
  const P = (rel) => `projetos/${SLUG}/${rel}`;

  const SAMPLES = "/mapa-skills-samples/academia-fit";

  const md = (id, label, rel, content) => ({
    id, label, path: P(rel), format: "md",
    sampleUrl: `${SAMPLES}/${rel}`,
    content: content || null
  });
  const html = (id, label, rel, content) => ({
    id, label, path: P(rel), format: "html",
    sampleUrl: `${SAMPLES}/${rel}`,
    content: content || null
  });
  /** Artefato ilustrativo — sem arquivo em mapa-skills-samples (só content inline) */
  const mdInline = (id, label, rel, content) => ({
    id, label, path: P(rel), format: "md", sampleUrl: null, content
  });
  const htmlInline = (id, label, rel, content) => ({
    id, label, path: P(rel), format: "html", sampleUrl: null, content
  });
  const pdf = (id, label, rel, htmlId) => ({
    id, label, path: P(rel), format: "pdf",
    htmlId,
    sampleUrl: `${SAMPLES}/${rel}`
  });
  const docx = (id, label, rel, htmlId) => ({
    id, label, path: P(rel), format: "docx", htmlId,
    sampleUrl: null
  });
  const folder = (id, label, rel, content) => ({ id, label, path: P(rel), format: "folder", content });

  const miniHtml = (title, kicker, color, body) =>
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${title}</title><style>
      body{font-family:Inter,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:36px;line-height:1.55}
      .wrap{max-width:680px;margin:0 auto}
      .kicker{font:600 0.68rem Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${color};border:1px solid ${color}55;padding:4px 12px;border-radius:999px;display:inline-block}
      h1{font-size:1.6rem;margin:14px 0 8px}h2{font-size:1rem;color:${color};margin:20px 0 8px}
      .card{background:#121218;border:1px solid #2a2a35;border-radius:12px;padding:14px 18px;margin:10px 0}
      blockquote{border-left:3px solid ${color};margin:12px 0;padding:10px 16px;background:#121218;color:#d4d4d8;font-style:italic}
      table{width:100%;border-collapse:collapse;font-size:0.85rem;margin:12px 0}th,td{border:1px solid #2a2a35;padding:8px}th{background:#1a1a22;color:${color}}
      .foot{color:#666;font-size:0.78rem;margin-top:32px}
    </style></head><body><div class="wrap">${body}<p class="foot">Exemplo ilustrativo · Cohort de Marketing</p></div></body></html>`;

  window.ARTIFACT_SAMPLES = {
    "comecar": [
      md("setup-md", "SETUP.md", "SETUP.md", `# Ambiente preparado — Cohort de Marketing

## Checklist
- [x] Git atualizado (branch rafaelscosta)
- [x] Node.js v20+
- [x] Catálogo de skills carregado
- [x] APIFY_API_TOKEN no .env
- [ ] Primeiro projeto criado em \`projetos/\`

## Próximo passo único
Rode \`/avatar-funil\` com seu nicho ou produto.`)
    ],

    "avatar-funil": [
      md("avatar-md", "avatar.md", "avatar.md", `# Avatar: Personal Trainer Online — Mulheres 35+

Ancorado na dor número 1:
> "Já tentei de tudo, perco 3kg e volto tudo. Não aguento mais me olhar no espelho."
> Fonte: Instagram @coachmaria

| # | Dimensão | Conteúdo |
|---|----------|----------|
| 1 | Demografia | Mulher 35–48, classe B/C |
| 2 | Psicografia | Medo de falhar de novo; quer autoestima |
| 5 | Objeções | Tempo, dinheiro gasto, disciplina |

Leitura: falar de **consistência sem culpa**, não de força de vontade.`),
      html("avatar-html", "relatorio-avatar.html", "relatorio-avatar.html",
        miniHtml("Pesquisa de Avatar", "Pesquisa de Avatar", "#a78bfa",
          `<span class="kicker">Pesquisa de Avatar</span><h1>Mulheres 35+ — PT Online</h1>
           <h2>Dor #1 (verbatim)</h2><blockquote>"Já tentei de tudo, perco 3kg e volto tudo."</blockquote>
           <table><tr><th>Dimensão</th><th>Resumo</th></tr><tr><td>Objeções</td><td>Tempo, dinheiro, disciplina</td></tr></table>`)),
      pdf("avatar-pdf", "relatorio-avatar.pdf", "relatorio-avatar.pdf", "avatar-html")
    ],

    "espiao-do-concorrente": [
      md("dossie-md", "dossie-fitflow.md", "espiao/dossie-fitflow.md", `# Dossiê: FitFlow Academy

**Resumo:** vende emagrecimento 12 semanas. Brecha: não fala de manutenção pós-30 dias.

## Hook vencedor
"Descobri o erro que 9 em 10 mulheres cometem na dieta" — Score 8/10

## Brechas
- Zero narrativa de recaída
- Preço só na call
- Nicho homens 40+ livre`),
      html("dossie-html", "dossie-fitflow.html", "espiao/dossie-fitflow.html",
        miniHtml("Dossiê FitFlow", "Dossiê do Concorrente", "#22c7b1",
          `<span class="kicker">Dossiê do Concorrente</span><h1>FitFlow Academy</h1>
           <div class="card"><strong>Hook:</strong> "Descobri o erro que 9 em 10 mulheres cometem na dieta"</div>
           <div class="card" style="border-color:#23e16955"><strong style="color:#23e169">Brecha:</strong> Não fala de manutenção pós-emagrecimento</div>`)),
      pdf("dossie-pdf", "dossie-fitflow.pdf", "espiao/dossie-fitflow.pdf", "dossie-html")
    ],

    "trend-hunting": [
      md("trends-md", "trends-2026-07.md", "trends-2026-07.md", `# Relatório de Tendências — Jul/2026

## Formato em ascensão
**Carrossel "antes/depois honesto"** — engajamento 3.2x acima da média do nicho

## Hooks virais detectados
1. "Parei de contar caloria e..."
2. "O que ninguém te conta sobre menopausa e peso"

## Timing
Saturação estimada: 6–8 semanas. Testar agora.`),
      html("trends-html", "trends-2026-07.html", "trends-2026-07.html",
        miniHtml("Trends", "Trend Hunting", "#22c7b1",
          `<span class="kicker">Trend Hunting</span><h1>Tendências Jul/2026</h1>
           <div class="card"><strong>Formato:</strong> Carrossel antes/depois honesto (+220% engajamento)</div>
           <div class="card"><strong>Hook:</strong> "Parei de contar caloria e..."</div>`)),
      pdf("trends-pdf", "trends-2026-07.pdf", "trends-2026-07.pdf", "trends-html"),
      html("variacoes-html", "variacoes-hooks.html", "variacoes-hooks.html",
        miniHtml("Hooks", "Variações", "#22c7b1",
          `<span class="kicker">Trend Hunting</span><h1>Variações de Hook</h1>
           <div class="card"><strong>A:</strong> O erro silencioso que faz 9 em 10 mulheres voltarem ao peso antigo</div>
           <div class="card"><strong>B:</strong> Parei de me pesar todo dia. Em 90 dias perdi 8kg.</div>`)),
      pdf("variacoes-pdf", "variacoes-hooks.pdf", "variacoes-hooks.pdf", "variacoes-html"),
      md("variacoes-md", "variacoes-hooks.md", "variacoes-hooks.md", `# Variações de Hook — prontas pra teste

## Variação A (curiosidade)
"O erro silencioso que faz 9 em 10 mulheres voltarem ao peso antigo"

## Variação B (confissão)
"Parei de me pesar todo dia. Em 90 dias perdi 8kg."

## Vencedor provável
Variação A — baseado em engajamento de referências do nicho.`)
    ],

    "swipe-file": [
      md("briefing-md", "briefing-swipe-file.md", "swipe/briefing-swipe-file.md", `# Briefing Swipe File

## Padrões extraídos (não copiar literal)
- Hook tipo confissão + número específico
- CTA suave no carrossel (slide 7)
- Prova: foto real, não stock

## Para Copy
Usar estrutura confissão nos headlines do copy.md`),
      html("briefing-html", "briefing-swipe-file.html", "swipe/briefing-swipe-file.html",
        miniHtml("Swipe File", "Briefing", "#22c7b1",
          `<span class="kicker">Swipe File</span><h1>Briefing — padrões extraídos</h1>
           <div class="card">Hook tipo confissão + número específico</div>`)),
      pdf("briefing-pdf", "briefing-swipe-file.pdf", "swipe/briefing-swipe-file.pdf", "briefing-html"),
      html("index-html", "swipe-file-index.html", "swipe-file-index.html",
        miniHtml("Swipe File", "Biblioteca de Referências", "#22c7b1",
          `<span class="kicker">Swipe File</span><h1>Índice — 34 criativos</h1>
           <table><tr><th>Tipo</th><th>Qtd</th><th>Score médio</th></tr>
           <tr><td>Hook curiosidade</td><td>12</td><td>7.8</td></tr>
           <tr><td>Confissão</td><td>9</td><td>8.1</td></tr></table>`)),
      pdf("index-pdf", "swipe-file-index.pdf", "swipe-file-index.pdf", "index-html"),
      folder("swipe-folder", "swipe/{tipo}/", "swipe/",
        `# Pasta swipe/\n\n\`\`\`\nswipe/\n├── hooks/\n├── ctas/\n├── carrosseis/\n└── vsl-refs/\n\`\`\`\n\nCada criativo: .md + .html + metadados (fonte, score, padrão).`)
    ],

    "offerbook": [
      md("offerbook-md", "offerbook.md", "offerbook.md", `# Offerbook — Método Consistência 90

## Perfil do Projeto
- Destino: checkout direto · Voz: marca

## Mecanismo Único
**Ciclo de 3 Fases:** Desinflamar → Reprogramar → Manter

## Stack
| Item | Valor |
|------|-------|
| Programa 90 dias | R$ 1.997 |
| **Preço** | **R$ 497** |`),
      html("offerbook-html", "offerbook.html", "offerbook.html",
        miniHtml("Offerbook", "Livro da Oferta", "#f59e0b",
          `<span class="kicker">Offerbook</span><h1>Método Consistência 90</h1>
           <div class="card"><strong>Mecanismo:</strong> Ciclo de 3 Fases</div>
           <table><tr><td>Programa</td><td>R$ 1.997</td></tr><tr><td><strong>Preço</strong></td><td><strong style="color:#f59e0b">R$ 497</strong></td></tr></table>`)),
      pdf("offerbook-pdf", "offerbook.pdf", "offerbook.pdf", "offerbook-html"),
      docx("offerbook-docx", "offerbook.docx", "offerbook.docx", "offerbook-html")
    ],

    "design-md": [
      md("design-md", "DESIGN.md", "DESIGN.md", `# DESIGN.md — Academia Fit

## Cores
- primary: #7C3AED (violeta)
- on-deep: #F5F0FF
- background: #0A0A0F

## Tipografia
- display: Space Grotesk
- body: Inter

## Componentes
- border-radius: 16px
- CTA: fundo primary, texto on-deep`),
      html("preview-html", "preview.html", "preview.html",
        miniHtml("Brand Preview", "Design System", "#8b5cf6",
          `<span class="kicker">DESIGN.md</span><h1>Preview da Marca</h1>
           <div class="card" style="border-color:#7C3AED"><button style="background:#7C3AED;color:#F5F0FF;border:none;padding:10px 20px;border-radius:16px;font-weight:600">CTA primário</button></div>
           <p style="color:#999;font-size:0.85rem">tokens.json · preview.html · .cohort-brand-choice</p>`)),
      pdf("preview-pdf", "preview.pdf", "preview.pdf", "preview-html")
    ],

    "metodo-funil": [
      md("funil-md", "funil.md", "funil.md", `# Mapa de Execução — N12

## Diagnóstico: Nível 4
Peças prescritas: **quiz-funil** + pagina-vendas

## Você está aqui
copy-funil ✓ → **quiz-funil** (próximo)

## Ordem N12 adaptada
1–5 ✓ · 6–8 ✓ · 9 quiz · 10 conteúdo · 11 email · 12 recuperação · 13 cro`),
      html("funil-html", "funil.html", "funil.html",
        miniHtml("Funil", "Mapa de Execução", "#8b5cf6",
          `<span class="kicker">metodo-funil</span><h1>Diagnóstico: Nível 4</h1>
           <div class="card"><strong>Próximo:</strong> /quiz-funil</div>
           <div class="card"><strong>Peça principal:</strong> Quiz de diagnóstico</div>`)),
      pdf("funil-pdf", "funil.pdf", "funil.pdf", "funil-html")
    ],

    "copy-funil": [
      md("copy-md", "copy.md", "copy.md", `# copy.md — Fonte única

## Big Idea
**Emagrecer sem recomeçar toda segunda-feira**

## Headlines
1. Como perder 8kg em 90 dias sem contar caloria
2. O erro que 9 em 10 mulheres cometem na dieta

## Bullets
- Fase 1: cardápio anti-inflamação 7 dias
- Fase 3: protocolo de manutenção permanente`)
    ],

    "vsl-funil": [
      md("vsl-md", "vsl.md", "vsl.md"),
      html("vsl-page", "pagina/vsl.html", "pagina/vsl.html"),
      pdf("vsl-pdf", "pagina/vsl.pdf", "pagina/vsl.pdf", "vsl-page")
    ],

    "advertorial-funil": [
      md("adv-md", "advertorial.md", "advertorial.md"),
      html("adv-page", "pagina/advertorial.html", "pagina/advertorial.html"),
      pdf("adv-pdf", "pagina/advertorial.pdf", "pagina/advertorial.pdf", "adv-page")
    ],

    "lancamento-funil": [
      md("lanc-md", "lancamento.md", "lancamento.md"),
      html("lanc-html", "lancamento.html", "lancamento.html"),
      pdf("lanc-pdf", "lancamento.pdf", "lancamento.pdf", "lanc-html")
    ],

    "webinario-funil": [
      md("web-md", "webinario.md", "webinario.md"),
      html("web-reg", "pagina/registro.html", "pagina/registro.html"),
      pdf("web-pdf", "pagina/registro.pdf", "pagina/registro.pdf", "web-reg")
    ],

    "quiz-funil": [
      md("quiz-md", "quiz.md", "quiz.md", `# Quiz — Qual seu perfil de emagrecimento?

## Perguntas (5)
1. Quantas dietas você já tentou?
2. O que mais te frustra hoje?
3. Quanto tempo tem por dia?
4. Já teve efeito sanfona?
5. O que te motiva mais?

## Resultados
- **Emocional** → oferta com comunidade
- **Racional** → oferta com dados e protocolo
- **Pragmático** → oferta com checklist rápido`),
      html("quiz-page", "pagina/quiz.html", "pagina/quiz.html",
        miniHtml("Quiz", "Diagnóstico", "#f43f5e",
          `<span class="kicker">Quiz</span><h1>Qual seu perfil de emagrecimento?</h1>
           <div class="card"><strong>Pergunta 1/5</strong><p>Quantas dietas você já tentou?</p>
           <p style="color:#888">○ Nenhuma · ○ 1-3 · ○ Mais de 3</p></div>`)),
      pdf("quiz-pdf", "pagina/quiz.pdf", "pagina/quiz.pdf", "quiz-page"),
      html("quiz-resultado", "pagina/resultado-emocional.html", "pagina/resultado-emocional.html",
        miniHtml("Resultado", "Perfil Emocional", "#f43f5e",
          `<span class="kicker">Quiz</span><h1>Seu perfil: Emocional</h1>
           <div class="card">Você precisa de consistência sem culpa — oferta com comunidade e suporte.</div>`)),
      pdf("quiz-resultado-pdf", "pagina/resultado-emocional.pdf", "pagina/resultado-emocional.pdf", "quiz-resultado")
    ],

    "pagina-vendas-funil": [
      md("pv-md", "pagina/pagina-vendas.md", "pagina/pagina-vendas.md"),
      html("pv-page", "pagina/index.html", "pagina/index.html"),
      pdf("pv-pdf", "pagina/index.pdf", "pagina/index.pdf", "pv-page")
    ],

    "conteudo-funil": [
      md("cont-md", "conteudo/roteiros.md", "conteudo/roteiros.md"),
      html("cont-html", "conteudo/roteiros.html", "conteudo/roteiros.html"),
      pdf("cont-pdf", "conteudo/roteiros.pdf", "conteudo/roteiros.pdf", "cont-html")
    ],

    "criativos-funil": [
      md("cri-md", "criativos/roteiros.md", "criativos/roteiros.md")
    ],

    "email-funil": [
      html("email-nut", "emails/nutricao.html", "emails/nutricao.html",
        miniHtml("E-mail", "Nutrição", "#3b82f6",
          `<div style="max-width:480px;margin:0 auto"><div style="background:#7C3AED;padding:20px;text-align:center"><strong style="color:#fff">Academia Fit</strong></div>
           <div class="card"><h1 style="font-size:1.2rem">Maria, você não falhou. A dieta falhou.</h1>
           <p>Nos próximos 5 dias vou te mostrar por que...</p></div></div>`)),
      html("email-venda", "emails/venda.html", "emails/venda.html",
        miniHtml("E-mail", "Venda", "#3b82f6",
          `<div class="card"><h1 style="font-size:1.1rem">Últimas 12 vagas — Método Consistência 90</h1>
           <p>R$ 497 · Garantia 30 dias</p>
           <button style="background:#3b82f6;color:#fff;border:none;padding:10px 20px;border-radius:8px">GARANTIR MINHA VAGA</button></div>`)),
      pdf("email-nut-pdf", "emails/nutricao.pdf", "emails/nutricao.pdf", "email-nut"),
      pdf("email-venda-pdf", "emails/venda.pdf", "emails/venda.pdf", "email-venda")
    ],

    "whatsapp-funil": [
      md("wa-md", "whatsapp.md", "whatsapp.md")
    ],

    "mockup-produto-funil": [
      md("mock-md", "mockups/prompts.md", "mockups/prompts.md")
    ],

    "bonus-funil": [
      md("bonus-md", "bonus/checklist-semanal.md", "bonus/checklist-semanal.md"),
      html("bonus-html", "bonus/checklist-semanal.html", "bonus/checklist-semanal.html"),
      pdf("bonus-pdf", "bonus/checklist-semanal.pdf", "bonus/checklist-semanal.pdf", "bonus-html")
    ],

    "recuperacao-funil": [
      md("rec-md", "recuperacao.md", "recuperacao.md", `# Sequência de Recuperação

## Carrinho abandonado (T+1h)
Assunto: Você esqueceu algo importante

## Cartão recusado (imediato)
WhatsApp: "Quer tentar em 2x?"

## Boleto (T+3d)
Última chance com bônus extra`),
      html("rec-html", "recuperacao.html", "recuperacao.html",
        miniHtml("Recuperação", "Cascata", "#f59e0b",
          `<span class="kicker">recuperacao-funil</span><h1>Cascata de Recuperação</h1>
           <table><tr><th>Trigger</th><th>Canal</th><th>Timing</th></tr>
           <tr><td>Carrinho</td><td>E-mail</td><td>T+1h</td></tr>
           <tr><td>Cartão</td><td>WhatsApp</td><td>Imediato</td></tr></table>`)),
      pdf("rec-pdf", "recuperacao.pdf", "recuperacao.pdf", "rec-html")
    ],

    "backend-funil": [
      md("be-md", "back-end.md", "back-end.md", `# Back-end — Maximização de Ticket

## Upsell 1 (pós-compra, 3–7s)
**Programa Avançado Fase 4** — R$ 197 (one-click)

## OTO (janela 4h)
**Consultoria individual 30min** — R$ 297

## Downsell (recusou upsell)
**Pack de receitas premium** — R$ 47`),
      htmlInline("upsell-page", "pagina/upsell.html", "pagina/upsell.html",
        miniHtml("Upsell", "One-Click", "#f59e0b",
          `<span class="kicker" style="color:#23e169;border-color:#23e169">Compra confirmada!</span>
           <h1>Espere — oferta exclusiva</h1>
           <div class="card"><strong>Programa Avançado Fase 4</strong><p>De R$ 497 por <strong style="color:#f59e0b">R$ 197</strong></p></div>
           <button style="background:#f59e0b;color:#000;border:none;padding:12px;width:100%;border-radius:12px;font-weight:700">SIM, QUERO ADICIONAR</button>`))
    ],

    "cro-funil": [
      md("cro-md", "cro.md", "cro.md"),
      html("cro-html", "cro.html", "cro.html"),
      pdf("cro-pdf", "cro.pdf", "cro.pdf", "cro-html")
    ],

    "status-funil": [
      md("status-md", "status.md", "status.md")
    ]
  };

  /** Fallback genérico para outputs não mapeados */
  window.buildGenericArtifact = function (skill, outputLabel, index) {
    const safeName = outputLabel.replace(/\{[^}]+\}/g, "exemplo").replace(/\*/g, "");
    const isFolder = /\/(\.\.\.)?$|\*\/$/.test(outputLabel);
    const ext = safeName.includes(".") ? safeName.split(".").pop().toLowerCase() : "md";
    const format = isFolder ? "folder" : ext === "html" ? "html" : ext === "pdf" ? "pdf" : ext === "docx" ? "docx" : "md";
    const path = P(outputLabel.replace(/\{[^}]+\}/g, "exemplo"));

    let content = null;
    if (format === "folder") {
      content = `# Pasta: ${outputLabel}\n\n\`\`\`\nprojetos/${SLUG}/\n└── ${outputLabel.replace(/\*/g, "exemplo")}\n\`\`\``;
    } else if (format === "md") {
      content = `# ${outputLabel}\n\nGerado por **/${skill.id}**\n\nCaminho: \`${path}\``;
    } else if (format === "html") {
      content = miniHtml(outputLabel, `/${skill.id}`, "#a78bfa",
        `<span class="kicker">/${skill.id}</span><h1>${outputLabel}</h1><p>Caminho: <code>${path}</code></p>`);
    }

    const base = { id: `generic-${skill.id}-${index}`, label: outputLabel, path, format, content, generic: true };
  if (format === "pdf") {
    base.sampleUrl = null;
    base.htmlId = null;
  }
  return base;
  };
})();
