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
    ],

    "zelador": [
      mdInline("zelador-painel", "Painel — auditoria (Modo API)", "trafego/PAINEL-DA-SEMANA.yaml", `\`\`\`yaml
## Bloco escrito pelo Zelador no PAINEL-DA-SEMANA.yaml
## (depois da compra-teste confirmada pelo aluno — ver relatório ao lado)

zelador:
  modo: "api"
  ultima_checagem: "2026-07-15"
  bm_ativo: true                    # fonte: api
  conta_anuncios_ativa: true        # fonte: api
  pixel_disparando: true            # fonte: api
  capi_ativo: true                  # fonte: api
  evento_compra_deduplicado: true   # fonte: aluno (compra-teste confirmada em 2026-07-15)
  dominio_verificado: null          # fonte: nao_verificavel_api — pendente, não bloqueia
  pagamento_aprovado: true          # fonte: api
  pagina_vinculada: true            # fonte: api
  api_escrita_habilitada: true      # fonte: api (--testar-escrita, preflight OK)
  status_geral: "PARCIAL"           # só falta dominio_verificado — não bloqueia o Estruturador
  observacoes:
    - "[dominio_verificado] a Graph API v24.0 não expõe verificação de domínio para System User — confira manualmente em Business Manager > Configurações > Segurança da Marca > Domínios."
    - "[evento_compra_deduplicado] confirmado pelo aluno: compra-teste apareceu 1x no Events Manager, com event_id presente nos dois canais (servidor + navegador)."
\`\`\``),

      mdInline("zelador-relatorio", "Relatório da auditoria", "trafego/zelador-relatorio.md", `# Zelador — Auditoria de conta Meta via Graph API v24.0

Data: 2026-07-15

\`\`\`
 ✔ token_valido                  [API] tipo USER, expira em 2026-10-02 (79 dias), 2 escopos
 ✔ bm_ativo                      [API] BM "Academia Fit Treinos" acessível — verificação da empresa: verified
 ✔ conta_anuncios_ativa          [API] "Academia Fit — Ads" — Ativa (BRL, America/Sao_Paulo)
 ✔ pagamento_aprovado            [API] meio de pagamento cadastrado e sem pendência de cobrança
 ✔ pixel_disparando              [API] pixel "Academia Fit — Conversão" (987654321098765) disparou há 5h (último: 2026-07-14T21:12:00+0000)
 ✔ capi_ativo                    [API] 96 eventos de servidor e 141 de navegador na janela 2026-07-08 → 2026-07-15
 △ evento_compra_deduplicado     [API] sinal positivo: eventos chegando por servidor E navegador — a dedup por event_id precisa de teste manual
     → Faça uma compra-teste e confirme no Events Manager que o evento aparece UMA vez, com event_id presente nos dois canais.
 △ dominio_verificado            [manual] a Graph API v24.0 não expõe verificação de domínio para System User
     → Confira manualmente: Business Manager > Configurações > Segurança da Marca > Domínios.
 ✔ pagina_vinculada              [API] página "Academia Fit" (112233445566778) acessível e publicada
 ✔ api_escrita_habilitada        [API] conta aceita escrita deste app — Estruturador pode publicar via API

Eventos recentes no pixel: PURCHASE=14, ViewContent=286, AddToCart=47, PageView=812

STATUS GERAL (API): PARCIAL

Pendências manuais (a skill zelador confirma com você):
 △ evento_compra_deduplicado: Faça uma compra-teste e confirme no Events Manager que o evento aparece UMA vez, com event_id presente nos dois canais.
 △ dominio_verificado: Confira manualmente: Business Manager > Configurações > Segurança da Marca > Domínios.
\`\`\`

Depois que o aluno confirmou a compra-teste (event_id único nos dois canais), o Zelador
atualizou evento_compra_deduplicado para true no Painel — status geral segue PARCIAL só
por causa do domínio (não crítico, não bloqueia o Estruturador).`),
    ],

    "briefista": [
      mdInline("briefista-bateria-md", "painel-briefista.md", "trafego/painel-briefista.md", `# briefista — bateria_gerada (Painel da Semana)

Ângulos herdados da Aula 2, cada um já com \`nivel_consciencia\` declarado — o
Briefista recusa gerar para qualquer ângulo sem esse campo preenchido.

\`\`\`yaml
briefista:
  gerado_em: "2026-07-15"
  bateria_gerada:
    - id: "hook-dor-01"
      angulo: "Cansaço de recomeçar toda segunda-feira"
      nivel_consciencia: "Inconsciente"
      hook: "Você evita foto de corpo inteiro? Não é falta de força de vontade."
      copy: "Não é sobre disciplina. É sobre um ciclo que ninguém te explicou direito."
      formato: "reels 9:16 | feed"
      categoria_hook: "dor"
    - id: "hook-curiosidade-01"
      angulo: "Cansaço de recomeçar toda segunda-feira"
      nivel_consciencia: "Inconsciente"
      hook: "Tem uma coisa que quase toda mulher acima de 35 sente e não fala em voz alta..."
      copy: "Não é frescura. É um padrão que se repete — e tem um motivo por trás dele."
      formato: "reels 9:16 | feed"
      categoria_hook: "curiosidade"
    - id: "hook-historia-01"
      angulo: "Cansaço de recomeçar toda segunda-feira"
      nivel_consciencia: "Inconsciente"
      hook: "Há 6 meses a Fernanda parou de se pesar todo dia. O que ela viu no caminho mudou a relação dela com o espelho."
      copy: "Ela não mudou a dieta primeiro. Mudou outra coisa. Conta aqui."
      formato: "reels 9:16 | feed"
      categoria_hook: "historia"
    - id: "hook-dor-02"
      angulo: "Efeito sanfona: por que a dieta sempre volta"
      nivel_consciencia: "Consciente-do-Problema"
      hook: "Cansada do efeito sanfona? Você recomeça toda segunda e volta ao mesmo peso em semanas."
      copy: "O problema não é a força de vontade da segunda-feira. É o que acontece no resto da semana."
      formato: "reels 9:16 | feed"
      categoria_hook: "dor"
    - id: "hook-curiosidade-02"
      angulo: "Efeito sanfona: por que a dieta sempre volta"
      nivel_consciencia: "Consciente-do-Problema"
      hook: "O motivo real por trás do efeito sanfona não é o que a maioria dos personal trainers costuma dizer."
      copy: "Tem uma peça que quase nunca entra na conversa sobre emagrecimento. Essa é ela."
      formato: "reels 9:16 | feed"
      categoria_hook: "curiosidade"
    - id: "hook-contrarian-01"
      angulo: "Efeito sanfona: por que a dieta sempre volta"
      nivel_consciencia: "Consciente-do-Problema"
      hook: "Pare de contar caloria. O problema nunca foi disciplina."
      copy: "Contar caloria não resolveu da última vez. Talvez o ponto de partida esteja errado."
      formato: "reels 9:16 | feed"
      categoria_hook: "contrarian"
  finalistas_curados:
    - "hook-dor-01"
    - "hook-curiosidade-02"
\`\`\`

Curadoria completa do aluno em \`trafego/curadoria-hooks.md\`.`),

      mdInline("briefista-curadoria-md", "curadoria-hooks.md", "trafego/curadoria-hooks.md", `# Curadoria do aluno — bateria do Briefista

O Briefista gerou 6 variações (3 por ângulo), cobrindo dor, curiosidade,
história e contrarian. A curadoria é decisão humana — o Briefista nunca
escolhe os finalistas sozinho.

## Finalistas escolhidos

| Hook | Ângulo | Nível | Categoria | Por quê |
|---|---|---|---|---|
| \`hook-dor-01\` | Cansaço de recomeçar toda segunda-feira | Inconsciente | Dor | Fala da vergonha de foto de corpo inteiro sem nomear "dieta" — bateu com o comentário mais recorrente nos directs da marca. |
| \`hook-curiosidade-02\` | Efeito sanfona: por que a dieta sempre volta | Consciente-do-Problema | Curiosidade | Nomeia o problema que a audiência já sente, mas segura a solução — bom encaixe pra quem já pesquisa "por que a dieta não pega". |

## Descartados (motivo rápido)
- \`hook-historia-01\`: história boa, mas longa pra 3 segundos de scroll em reels.
- \`hook-contrarian-01\`: tom "pare de fazer X" já saturado no nicho — risco de fadiga rápida.
- \`hook-dor-02\` e \`hook-curiosidade-01\`: variações válidas, guardadas pra próxima leva se os finalistas fadigarem.

## Próximo passo
Os 2 finalistas seguem para \`/ads-creative-factory\` — criativo visual
multi-formato, com a mesma curadoria humana antes do upload.`)
    ],

    "estruturador": [
      mdInline("estruturador-plano", "campanha.json — plano aprovado", "trafego/campanha.json", `\`\`\`json
{
  "nome": "[COHORT1]_[academia-fit]_[2026-07-15]",
  "objetivo": "OUTCOME_SALES",
  "evento_conversao": "PURCHASE",
  "verba_diaria_reais": 30,
  "periodo_dias": 7,
  "pais": "BR",
  "interesse_guarda_chuva": null,
  "link_destino": "https://academiafit.com.br/oferta?utm_source=meta&utm_medium=paid&utm_campaign=cohort1_academia-fit_2026-07-15&utm_content={{ad.name}}",
  "cta": "LEARN_MORE",
  "pixel_id": "987654321098765",
  "page_id": "112233445566778",
  "criativos": [
    {
      "id": "hook-dor-01",
      "titulo": "Chega de recomeçar toda segunda",
      "copy": "Você já tentou de tudo e volta a ganhar o peso de volta? O Método Consistência 90 tira você desse ciclo em 3 fases — sem contar caloria a vida toda.",
      "image_hash": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
    },
    {
      "id": "hook-curiosidade-02",
      "titulo": "O erro que 9 em 10 mulheres cometem na dieta",
      "copy": "Não é falta de força de vontade. É o método errado. Descubra o que muda tudo no Consistência 90.",
      "image_hash": "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3"
    }
  ],
  "aprovado_pelo_aluno_em": "2026-07-15"
}
\`\`\``),

      mdInline("estruturador-painel", "Painel — estruturador (pós --criar)", "trafego/PAINEL-DA-SEMANA.yaml", `\`\`\`yaml
## Bloco escrito pelo Estruturador no PAINEL-DA-SEMANA.yaml
## (gerado por "node scripts/estruturador-publish.mjs --criar" — Gate 2, tudo PAUSED)

estruturador:
  montado_em: "2026-07-15"
  publicada_via: "api"
  campaign_id: "120210000000123"
  adset_id: "120210000000456"
  ad_ids: ["120210000000789","120210000000790"]
  verba_diaria: 30
  periodo_dias: 7
  fim_automatico: "2026-07-22"
  status: "criada_pausada"
  aprovada_pelo_aluno_em: "2026-07-15"
  ativada_em: ""
\`\`\``),

      mdInline("estruturador-criar-log", "Saída do --criar (Gate 2)", "trafego/estruturador-criar.log", `\`\`\`
Plano validado — "[COHORT1]_[academia-fit]_[2026-07-15]"
  OUTCOME_SALES / PURCHASE · R$30/dia × 7 dias (teto total ~R$210.00, com fim automático)
  Público: amplo/frio Advantage+ (BR)
  2 criativos · pixel 987654321098765 · página 112233445566778
  Aprovado pelo aluno em: 2026-07-15

 ✔ pré-flight de escrita passou (o app pode publicar nesta conta)
 ✔ campanha criada (PAUSED): 120210000000123
 ✔ conjunto criado (PAUSED, fim automático em 2026-07-22): 120210000000456
 ✔ anúncio "hook-dor-01" criado (PAUSED): 120210000000789
 ✔ anúncio "hook-curiosidade-02" criado (PAUSED): 120210000000790

TUDO CRIADO EM PAUSED — nada está gastando.
Revise no gerenciador: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=123450000067890&selected_campaign_ids=120210000000123

Para ativar (após revisão do aluno):
  node scripts/estruturador-publish.mjs --ativar --campaign-id=120210000000123 --confirmo-ativacao

Gate 3 é decisão do aluno: sem --confirmo-ativacao, o script recusa ativar.
7 dias sem mexer depois disso — salvo circuit-breaker (gasto ≥ 2× CPA-alvo com 0 conversões e CTR < 0,5%).
\`\`\``),
    ],

    "leitor-de-metricas": [
      mdInline("leitor-painel-md", "leitor-metricas-painel.md", "trafego/leitor-metricas-painel.md", `# Leitor de Métricas — bloco para o PAINEL-DA-SEMANA.yaml

Campanha \`120210000000123\` · Modo API · janela \`last_7d\` (2026-07-15 → 2026-07-19), lida em 2026-07-19.

Todo sinal abaixo veio pronto da Graph API — nada foi calculado ou completado por inferência. O ROAS sai com selo **Estimado** porque é atribuição da própria plataforma, não venda confirmada no caixa.

\`\`\`yaml
leitor:
  modo: "api"
  ultima_leitura: "2026-07-19"
  fonte: "Graph API v24.0 (campanha 120210000000123)"
  janela_atribuicao: "7d clique / 1d view"
  sinais:
    - { metrica: "Gasto (R$)", valor: 118.43, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "Impressões", valor: 41200, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "Alcance", valor: 33900, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "Cliques (todos)", valor: 512, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "Cliques no link", valor: 388, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "CTR (%)", valor: 1.24, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "CPM (R$)", valor: 2.87, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "CPC (R$)", valor: 0.23, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "Frequência", valor: 1.22, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19" }
    - { metrica: "Compras (atribuídas)", valor: 4, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19", premissa: "evento reportado pela plataforma" }
    - { metrica: "CPA compra (R$)", valor: 29.61, selo: "Real", fonte: "API Graph v24.0 em 2026-07-19", premissa: "custo por resultado reportado pela plataforma" }
    - { metrica: "ROAS (omni_purchase)", valor: 1.9, selo: "Estimado", fonte: "API Graph v24.0 em 2026-07-19", premissa: "atribuição da plataforma, NÃO confirmado no caixa — só vira Real com venda conferida pelo aluno" }
  amostra_suficiente_para_cpa: false
  nota_amostra: "amostra insuficiente para CPA (4 conversões < 10) — leia sinal de topo (CTR, CPM, CPC, cliques no link)"
\`\`\`

Handoff: este bloco é o insumo obrigatório do Diagnosticador — sem ele, a skill \`diagnosticador\` para e pede pra rodar o Leitor primeiro.`),

      mdInline("leitor-terminal-md", "leitor-metricas-terminal.md", "trafego/leitor-metricas-terminal.md", `# Leitor de Métricas — saída no terminal (Modo API)

Comando: \`node scripts/leitor-metricas.mjs --campaign-id=120210000000123\`

\`\`\`
Leitor de Métricas — campanha 120210000000123 · janela last_7d · 2026-07-19
Janela de atribuição: 7d clique / 1d view

 ✔ Gasto (R$)               118.43   [Real]
 ✔ Impressões               41200   [Real]
 ✔ Alcance                  33900   [Real]
 ✔ Cliques (todos)          512   [Real]
 ✔ Cliques no link          388   [Real]
 ✔ CTR (%)                  1.24   [Real]
 ✔ CPM (R$)                 2.87   [Real]
 ✔ CPC (R$)                 0.23   [Real]
 ✔ Frequência                1.22   [Real]
 ✔ Compras (atribuídas)      4   [Real] — evento reportado pela plataforma
 ✔ CPA compra (R$)           29.61   [Real] — custo por resultado reportado pela plataforma
 ≈ ROAS (omni_purchase)      1.9   [Estimado] — atribuição da plataforma, NÃO confirmado no caixa — só vira Real com venda conferida pelo aluno

amostra insuficiente para CPA (4 conversões < 10) — leia sinal de topo (CTR, CPM, CPC, cliques no link)

Bloco para o PAINEL-DA-SEMANA.yaml: (ver artefato "leitor-metricas-painel.md")
\`\`\`

✔ = selo Real (dado pronto da API) · ≈ = selo Estimado (premissa declarada). Nenhum valor acima foi calculado pelo Leitor — só traduzido e rotulado.`)
    ],

    "diagnosticador": [
      mdInline("diag-painel-md", "diagnosticador-painel.md", "trafego/diagnosticador-painel.md", `# Diagnosticador — bloco para o PAINEL-DA-SEMANA.yaml

Lido \`leitor.sinais\` (campanha 120210000000123, janela last_7d): CTR 1,24% [Real], \`amostra_suficiente_para_cpa: false\` (4 conversões < 10) — ainda não dá pra diagnosticar em cima de CPA, só sinal de topo.

Passo 0 rodou o circuit-breaker com os dados reais e voltou **NÃO acionado** — a regra dos 7 dias segue de pé, sem furar prazo. Uma alavanca só: o gargalo aqui é o ângulo, não a verba nem a oferta.

\`\`\`yaml
diagnosticador:
  diagnosticado_em: "2026-07-19"
  hipotese: "CTR de 1,24% em público frio (Real, Leitor de Métricas) com amostra insuficiente para CPA (4 conversões) — o ângulo 'hook-curiosidade-02' provavelmente está num nível de consciência alto demais pra esse público frio"
  alavanca_unica: "Trocar a bateria pelo ângulo de dor (nível Inconsciente), via Briefista"
  criterio_sucesso: "CTR sobe para >1,8% em 3 dias após a troca"
  criterio_reversao: "Se CTR continuar <1,2% em 5 dias após a troca, reverter pro ângulo anterior e escalar pra revisão de oferta (A1)"
  aprovado_pelo_aluno: true
  circuit_breaker_acionado: false
\`\`\`

Handoff: com \`aprovado_pelo_aluno: true\`, quem executa é o Briefista — gera a nova bateria no ângulo de dor. O Diagnosticador nunca troca o criativo sozinho.`),

      mdInline("diag-circuit-breaker-md", "circuit-breaker-terminal.md", "trafego/circuit-breaker-terminal.md", `# Diagnosticador — circuit-breaker.mjs (stop-loss)

Comando: \`node scripts/circuit-breaker.mjs --campaign-id=120210000000123 --cpa-alvo=55\`

Único gatilho que autoriza furar a regra dos 7 dias do Estruturador: gasto ≥ 2× CPA-alvo **E** 0 conversões **E** CTR < 0,5%. Aqui só uma das três condições bate — o gatilho fica fora, e o prazo dos 7 dias se mantém.

\`\`\`
Circuit-breaker — campanha 120210000000123 (2026-07-15 → 2026-07-19)

 ⚠ SIM  gasto >= 2x CPA-alvo (R$110.00)
 · não  zero conversões
 · não  CTR < 0.5%

 Gasto: R$118.43 · Conversões: 4 · CTR: 1.24%

🟢 NÃO ACIONADO — Gatilho NÃO acionado: respeite os 7 dias sem mexer. Fora deste gatilho nomeado, edição reseta o aprendizado do algoritmo.
\`\`\`

O Diagnosticador registra \`circuit_breaker_acionado: false\` no Painel e segue com a alavanca de ângulo — nunca trata este relatório como ordem de pausa automática; ele só informa, quem decide é o aluno.`)
    ],

    "ads-creative-factory": [
      mdInline("acf-legendas-md", "legendas.md", "criativos/factory/legendas.md", `# legendas.md — lote final (Ads Creative Factory)

Campanha destino: \`[COHORT1]_[academia-fit]_[2026-07-15]\` · finalistas
curados pelo \`briefista\` (\`hook-dor-01\`, \`hook-curiosidade-02\`).

## hook-dor-01 · arquétipo \`dark_editorial\`

**Caption:**
Você evita foto de corpo inteiro? Não é falta de força de vontade — é um
ciclo que ninguém te explicou direito.

**Link description:**
Descubra por que o "recomeço de segunda" nunca resolveu de verdade.

| Formato | Arquivo |
|---|---|
| feed 4:5 | \`hook-dor-01-feed.png\` |
| story 9:16 | \`hook-dor-01-story.png\` |
| square 1:1 | \`hook-dor-01-square.png\` |

## hook-curiosidade-02 · arquétipo \`didactic_compare\`

**Caption:**
O motivo real por trás do efeito sanfona não é o que a maioria dos personal
trainers costuma dizer.

**Link description:**
✕ Dieta restritiva de novo · ✓ Ciclo de 3 fases — compare o que trava com o
que sustenta.

| Formato | Arquivo |
|---|---|
| feed 4:5 | \`hook-curiosidade-02-feed.png\` |
| story 9:16 | \`hook-curiosidade-02-story.png\` |
| square 1:1 | \`hook-curiosidade-02-square.png\` |

---
Revisão final humana obrigatória antes do upload — arquétipo é a diversidade
(a espécie da peça), nunca o mesmo molde com a frase trocada.`),

      mdInline("acf-manifest-upload-md", "manifest + upload.md", "criativos/factory/manifest-upload.md", `# manifest.json (trecho) + upload — lote academia-fit

Trecho do manifesto que o \`factory.py\` grava para o lote acima (arquétipos
distintos por hook, 3 formatos cada):

\`\`\`json
{
  "campaign": "[COHORT1]_[academia-fit]_[2026-07-15]",
  "brand_id": "brand-academia-fit",
  "output_root": "criativos/factory",
  "hooks": [
    {
      "id": "hook-dor-01",
      "archetype": "dark_editorial",
      "formats": ["feed", "story", "square"],
      "files": [
        "criativos/factory/hook-dor-01-feed.png",
        "criativos/factory/hook-dor-01-story.png",
        "criativos/factory/hook-dor-01-square.png"
      ]
    },
    {
      "id": "hook-curiosidade-02",
      "archetype": "didactic_compare",
      "formats": ["feed", "story", "square"],
      "files": [
        "criativos/factory/hook-curiosidade-02-feed.png",
        "criativos/factory/hook-curiosidade-02-story.png",
        "criativos/factory/hook-curiosidade-02-square.png"
      ]
    }
  ]
}
\`\`\`

Depois da aprovação humana dos PNGs, upload pra biblioteca da conta:

\`\`\`bash
node scripts/acf-upload.mjs --dir=projetos/academia-fit/criativos/factory --json
\`\`\`

\`\`\`json
{
  "enviadas": {
    "hook-dor-01-feed.png": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "hook-curiosidade-02-feed.png": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a1"
  },
  "erros": []
}
\`\`\`

Os \`image_hash\` acima entram em \`criativos[].image_hash\` no plano do
\`estruturador\` (\`node scripts/estruturador-publish.mjs --criar --plano=campanha.json\`).
Upload não é publicação — o anúncio nasce PAUSED mesmo assim.`)
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
