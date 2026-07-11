---
name: metodo-funil
description: "Estrutura um funil pelo método de elevação de consciência (autoria Alan Nicolas). Dado nicho + produto + público, diagnostica o estágio de consciência (1-5) e prescreve o funil, anúncio e conteúdo certos pra cada estágio; estrutura a oferta (offerbook antes do funil, ancoragem, upsell/OTO/downsell), a página de alta conversão (16 elementos) e o plano de aquisição/recuperação. Use quando precisar montar/diagnosticar funil, decidir que tipo de funil usar, casar anúncio ao público, ou estruturar oferta. Cobre o método amplo de funil, do diagnóstico de consciência à página."
user_invocable: true
---

# Método de Funil — Elevação de Consciência

Skill que estrutura funil pelo **método de elevação de consciência do Alan Nicolas**, com base teórica em Hormozi ($100M Offers / Money Models).

> **KB (fonte de verdade):** `KB-metodo-funil-alan.md` (nesta pasta). Tem os 14 frameworks do método, exemplos numéricos e a seção de elementos de página. **Carregue o KB antes de prescrever** — nunca responda de cabeça.

> **Tese central do método:** funil não é um modelo que se copia e cola. É a **sequência correta de elevação de consciência** do público — e cada estágio exige um funil, anúncio e conteúdo diferentes. *"Para cada estágio de consciência existe um funil ideal. Não adianta pegar aquele funil que eu mostrei e fazer tudinho que nem eu falei e não estar funcionando."*

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou (rode `/offerbook` primeiro).

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

---

## Passo 0 — Checar insumos antes de rodar

Rode `ls projetos/{slug}/` e veja o que já existe. Insumos desta skill:

- **Obrigatório:** `offerbook.md` — sem ele não dá pra prescrever o funil (sai da skill `/offerbook`).
- **Recomendados:** `avatar.md` (dores e público reais), `espiao/dossie-*.md` (brechas do concorrente), `swipe/briefing-swipe-file.md` (referências validadas).

Se faltar um obrigatório, aponte a skill que o gera e **PERGUNTE** se o usuário quer seguir mesmo assim — não trave silenciosamente, não assuma.

---

## Como usar

Quando você precisar montar/diagnosticar um funil ou decidir o tipo de funil/anúncio:

1. **Carregar o KB** (`KB-metodo-funil-alan.md`) pra ter os frameworks na mão.
2. **Ler o offerbook e confirmar os 4 decisores** (detalhados no Gate abaixo) — o offerbook (output da Aula 01, skill `/offerbook`) é a **fonte primária**: dele saem o Perfil do Projeto, nicho/mercado, produto/transformação/ticket e o avatar/público. Se o offerbook existir, **leia de lá e NÃO peça de novo** — só pergunte o que faltar.
   - **Nicho / mercado** (ex.: cursinhos, estética, IA pra marketing)
   - **Produto / transformação** e **ticket** (front-end barato? back-end caro?)
   - **Público a atacar** — de onde ele vem (frio do ads? base quente? orgânico?) → isso define o **estágio de consciência**
3. **Rodar o diagnóstico de consciência** (Passo 1 abaixo) — é o gate que decide tudo.
4. **Prescrever** funil + anúncio + conteúdo + oferta + página, seguindo o método.
5. **Revisar a estrutura antes de executar** — nunca subir/rodar nada sem revisar.
6. **Copy em 2 camadas**: a **fundação** (Big Idea, mecanismos, banco de headlines/bullets) sai da `/copy-funil` e vira a fonte única `copy.md`; a **copy aplicada** de cada peça (página, VSL, quiz, e-mails) é gerada na skill da própria peça, lendo o `copy.md` (não escrever de cabeça). A oferta sai da skill `/offerbook`; os e-mails, da skill `/email-funil`.

---

## Gate de pré-requisito — Offerbook (executar ANTES de qualquer coisa)

Esta skill **parte do offerbook** (a oferta que você montou na Aula 01). Antes de diagnosticar ou prescrever qualquer funil:

1. **Descubra o projeto ativo e leia o offerbook dele** — NÃO peça o nome do produto, ele já está dentro do offerbook. Primeiro descubra o projeto (`ls projetos/ 2>/dev/null`: uma pasta → use-a; várias → pergunte qual), depois leia o offerbook em `projetos/{slug}/offerbook.md`:

   ```
   ls projetos/ 2>/dev/null                        # descobre o(s) projeto(s)
   ls projetos/{slug}/offerbook.md 2>/dev/null     # o offerbook real; ignore briefing-offerbook.md (é só o checklist de fontes)
   ```

   - Se achar **um** projeto com `projetos/{slug}/offerbook.md`, confirme com o aluno: *"Encontrei o offerbook `projetos/{slug}/offerbook.md`. Uso esse?"* e **leia dele** o nicho, o produto/transformação, o ticket e o público.
   - Se achar **vários** projetos, liste-os e **pergunte qual usar**.
   - Se o aluno apontar um projeto específico, use esse.

2. **Se NÃO existir nenhum `projetos/{slug}/offerbook.md`**, antes de parar, procure o offerbook no formato da Aula 1 (que salva na raiz): `ls offerbook-*.md 2>/dev/null`. Se achar, confirme com o aluno e — **antes de mover, confirme com o dono que TODO o pack da raiz é do MESMO cliente/projeto** (agência com 2+ clientes: mova só o que for deste projeto; o resto migra no projeto certo) — **migre o PACK INTEIRO da Aula 1, em TODOS os formatos (md + html + pdf)** — não só o offerbook, senão as pesquisas/identidade ficam pra trás e o e-mail/página travam depois. Crie `projetos/{slug}/` (slug derivado do nicho) e traga cada peça pra sua posição, mantendo os 3 formatos:
   - offerbook: `offerbook-*.{md,html,pdf,docx}` → `projetos/{slug}/offerbook.{md,html,pdf,docx}`
   - avatar: `relatorio-avatar.{md,html,pdf}` → `projetos/{slug}/avatar.{md,html,pdf}`
   - pesquisa de avatar: `pesquisa-avatar-*/` → `projetos/{slug}/pesquisa-avatar-*/`
   - design: `DESIGN.md` → `projetos/{slug}/DESIGN.md` · `.cohort-brand-choice` → `projetos/{slug}/.cohort-brand-choice`
   - espião: `dossie-*.{md,html,pdf}` → `projetos/{slug}/espiao/`
   - trends: `trends-*.{md,html,pdf}` + `variacoes-*.{md,html,pdf}` → `projetos/{slug}/trends/`
   - swipe: `briefing-swipe-file.{md,html,pdf}` + `swipe-file-index.{md,html,pdf}` → `projetos/{slug}/swipe/`
   Copie SEMPRE o `.html` e o `.pdf` junto do `.md` (o `.md` é fonte; o dono abre o `.html`). Depois siga normal. Só se não achar offerbook em lugar nenhum, PARE e exiba este aviso:

   > Pra montar o funil eu preciso do seu **offerbook** — é nele que está a oferta (dor, mecanismo, entregáveis, preço-âncora, bônus, garantia), e é dele que eu leio o produto e o público (você não precisa redigitar nada).
   >
   > O offerbook é a **última etapa da Aula 1**. Se ainda não fez, rode a Aula 1 até o `/offerbook`; quando o `projetos/{slug}/offerbook.md` existir, volte e rode `/metodo-funil` de novo.

   **Não prossiga sem offerbook. Não invente a oferta de cabeça.**

   **Exceção — Perfil = afiliado:** não há offerbook próprio; o gate se satisfaz com o **Registro da Oferta do Produtor** (`projetos/{slug}/offerbook.md` no formato do afiliado — a comunicação oficial do produtor: promessa, mecanismo, preço, checkout). Leia dele o que o produtor já comunica; não invente promessa que o produtor não faz.

3. Com o offerbook em mãos, leia o nicho, o produto, o mecanismo, a dor e o público. **Antes de prescrever, confira os 4 decisores do funil — e pra cada um que estiver `[A DEFINIR]` ou ausente no offerbook, PERGUNTE. Não crave o funil sem eles:**

   - **Tipo de oferta** — leia do offerbook (Bloco 2): especialista/infoproduto · produto físico · SaaS/app · serviço · B2B/high-ticket. NÃO assuma "curso com especialista". O tipo muda o funil e a prova (produto/SaaS/app → voz do cliente e prova de uso, não depoimento de aluno; B2B → jornada longa com qualificação, não checkout direto).
   - **Origem do público** — de onde ele vem? (frio de ads · base quente · orgânico/lista) → decide o **nível de consciência** (o Gate de diagnóstico).
   - **Valor: ticket + formato** — quanto custa o produto principal? tem entrada mais barata? formato (varia com o tipo: curso gravado · cohort ao vivo · comunidade · assinatura de SaaS · pacote de serviço · produto físico)? → decide o **tipo de funil** (ticket baixo → venda direta tipo VSL/quiz; ticket médio-alto → webinário/aquecimento; B2B high-ticket → diagnóstico/qualificação + call).
   - **Prova disponível** — já tem depoimento/estudo de caso/review real, ou ainda vai coletar? → **molda** o funil: sem prova, ele ganha uma fase pra construí-la antes de vender (crítico pra público cético).

   Faça de uma vez as perguntas que faltarem, de forma objetiva. Só com os 4 decisores em mãos (do offerbook ou da resposta) siga pro **Gate de diagnóstico**.

   **Leia o Perfil do Projeto (topo do offerbook) e adapte a prescrição — não force "funil de infoproduto de especialista":**

   | Perfil | Como o funil muda |
   |--------|-------------------|
   | **Situação = afiliado** | Não há offerbook próprio: o funil é **página-ponte/advertorial + criativo + tráfego** pra oferta do produtor. Pule offerbook/back-end próprios; foco em pré-venda e clique pro checkout do produtor. |
   | **Situação = sem-projeto** | PARE: mande pro `/avatar-funil` (research-first) achar a oportunidade antes de prescrever funil. |
   | **Tipo = físico / varejo local** | Não é funil de checkout online. Prescreva **marketing local/regional**: presença (Google Perfil da Empresa/Maps), WhatsApp, promoção/oferta local, captação no ponto. Quiz/página só se houver venda online real. |
   | **Tipo = SaaS/app** | Funil de trial/demo + onboarding; prova = voz do cliente e caso de uso, não depoimento de aluno. |
   | **Tipo = serviço / B2B alto** | Webinário/quiz de maturidade → **marcar reunião** (nunca venda direta por e-mail). Ver `/webinario-funil` e `/quiz-funil` (destino = reunião). |
   | **Quem opera = agência** | 1 cliente = 1 projeto/pasta; a voz e a oferta são do CLIENTE; ofereça "versão cliente" do Book (sem bastidor) no fecho. |
   | **Nicho regulado** | Liga o Gate de compliance (saúde/médico/jurídico/psico/financeiro): linguagem de possibilidade, regras do conselho, sem promessa garantida; em saúde, triagem de risco antes de captar. |

---

## Gate de diagnóstico (OBRIGATÓRIO antes de prescrever)

**Diagnosticar o estágio de consciência do público é o passo que decide funil, anúncio e conteúdo.** Pular isso = funil que não converte.

| Nível | Estado do público | Funil ideal | Anúncio | Conteúdo orgânico |
|-------|-------------------|-------------|---------|-------------------|
| **5 — Inconsciente** (80-90% do mercado) | não te conhece, nem sabe que tem o problema | lançamento/PLF, **VSL + advertorial**, ou conteúdo grátis (YouTube) | hook de captação (não depoimento) | Reels / Shorts / vídeo viral |
| **4 — Consciente do problema** | sente a dor, não sabe que há solução | webinário/aula, palestra, **diagnóstico** | estudo de caso (a partir daqui) | carrossel |
| **3 — Consciente da solução** | conhece categorias, não seu produto | **estudo de caso**, webinário da solução, página | estudo de caso | Reels + carrossel |
| **2 — Consciente do produto** | já sabe que seu produto existe | **página + depoimento** ("corredor polonês") | **depoimento** (só aqui!) | stories + post |
| **1 — Mais consciente** | já viu seu pitch, só falta empurrão | **checkout direto** / página simplificada / vídeo de **2 min** | remarketing, hook | stories |

**Regra de ouro do casamento:** depoimento só converte no **nível 2**; estudo de caso no **3+**. *"Anúncio de depoimento pra público frio? Burrice total."*

**Cada funil prescrito tem uma skill que o constrói:**

| Funil prescrito | Skill | Nível |
|-----------------|-------|-------|
| VSL | `/vsl-funil` | 5 |
| Advertorial | `/advertorial-funil` | 5 |
| Lançamento / PLF | `/lancamento-funil` | 5 |
| Webinário / aula | `/webinario-funil` | 4 e 3 |
| Quiz / diagnóstico | `/quiz-funil` | 4 |
| Página de vendas | `/pagina-vendas-funil` | 2 e 1 |

---

## Gate de compliance — nicho sensível

Antes de prescrever a oferta, a headline ou a página, verifique se o nicho é **regulado**: saúde/bem-estar/emagrecimento/estética, finanças/investimento/renda, jurídico, ou autoestima/relacionamento com promessa de resultado.

- **Se for**, evite alegação que vira problema legal: "cura", "garantido", "resultado em X dias", "renda garantida", "sem esforço".
- Use **linguagem de possibilidade**: "pode ajudar", "muitas pessoas relatam", "com dedicação". Todo depoimento entra com ressalva: *"resultados variam de pessoa pra pessoa"*.
- **Exceção dura — médico (CFM) / psicologia (CRP) / jurídico (OAB):** depoimento de paciente/cliente **NÃO entra** (nem com ressalva — é vedação do conselho). A prova vira **credencial** (nome + registro no conselho), **método** e **conteúdo educativo**.
- Recomende ao aluno **conferir as regras e os órgãos reguladores do mercado dele** — este gate só **alerta**, não é aconselhamento jurídico, e validar é responsabilidade do aluno.
- Isto é um **aviso, não um bloqueio**: a skill segue prescrevendo o funil, só com a oferta e a headline calibradas pra não prometer o proibido.

---

## Regra de honestidade de prova

- **Nunca inventar** depoimento, número, case ou citação. Toda prova prescrita (depoimento, estudo de caso) vem do offerbook ou de pesquisa real.
- **Sem prova disponível** → prescreva a estratégia alternativa (garantia forte, bastidor, transparência) e marque `[SEM PROVA AINDA]` no mapa.
- **Nicho regulado** → linguagem de possibilidade, sem "resultado garantido" (respeite o gate de compliance do offerbook).

---

## Sequência de montagem (11 passos)

Reconstruída da aula (ordem que o Alan crava, incluindo "offer book ANTES do funil"):

1. **Descobrir o 0,8 / a dor** — clareza absoluta da dor e do público.
2. **Preencher o Offer Book (oferta) ANTES do funil** — *"não adianta ir pro funil se não tiver o offer book"*. Usar o checklist de ingredientes (garantia, entregáveis, preço-âncora, bônus, dores).
3. **Definir o nível de consciência** a atacar (1-5) → decide tudo.
4. **Escolher o formato de funil** correto pro nível (tabela acima).
5. **Montar as páginas** com os 16 elementos (KB §8) — modelando do **swipe file**, não do zero.
6. **Gerar hooks a partir do offer book** → criativos casados ao nível de consciência.
7. **Sequência de mensagens** (e-mail + WhatsApp + SMS + remarketing).
8. **Back-end e ticket** — upsell/OTO (janela de 4h) e downsell; estruturar LTV.
9. **Funil de recuperação** — carrinho abandonado / cartão recusado / boleto → re-elevar pro nível 4.
10. **Instrumentar e testar** — pixel na oferta; planilha de KPIs por etapa; A/B contínuo da **headline** (mín. 1.000 views únicos).
11. **Iterar modelando** — começar copiando o que converte, depois otimizar.

---

## Blocos do método (resumo — detalhe + verbatim no KB)

- **Oferta & ancoragem** (KB §2.8): preço âncora **estabelecido → percebido → final**; empilhamento plausível; **regra do "porquê"** em toda mudança de preço. Ancoragem funciona mais em consciência baixa.
- **Upsell / OTO / Downsell** (KB §2.7): janela de **4h**; OTO tem que ser *realmente* única; melhores funis têm 2º upsell.
- **Front-end / Back-end / LTV** (KB §2.6): front-end financia o tráfego e captura lead; o lucro está no back-end.
- **Oferta de entrada que financia o tráfego** (KB §2.5): zoom de R$48 ≠ lucro — filtra cartão e banca os ads. Convertendo demais e barato → **bota mais dinheiro em ads**.
- **Página de alta conversão** (KB §8): 16 elementos topo→fundo (headline → sub → vídeo → CTA abaixo do vídeo, centralizado (nunca acima) → mecanismo único → stack/ancoragem → prova → benefícios → bônus → garantia → escassez/urgência → naming → FAQ → CTA repetido → footer). Headline = item de maior alavancagem. No mobile, o vídeo aparece assim que a página abre (primeira dobra). Jargão interno do método ("Big Idea", "mecanismo único", "ancoragem", "prova social") NUNCA aparece como rótulo/eyebrow visível na página do lead.
- **Apresentação que vende** (KB §2.10): estrutura do workshop Hormozi (US$100M); **script é lei**, slides feios e densos de propósito, escassez plausível, reforço pós-oferta.
- **Swipe file** (KB §2.11): modelar do comprovado, nunca do zero. Ferramentas: GoFullPage, SiteSucker/HTTrack, Claude Code.
- **Aquisição** (KB §2.13): reduzir **percepção de esforço** entre a pessoa e o que ela **quer**; mostrar poucos caminhos (2); hook tem que conectar com contexto.
- **Onde a IA entra** (KB §5): pesquisa de ICP/hooks, offerbook assistido por IA, persona sintética pra QA de copy, páginas visuais, swipe file/download, diagnóstico de venda. *"A magia da IA é quanto menos você vê a IA."*

---

## Regras de ouro

**SEMPRE:** casar funil↔anúncio↔conteúdo ao nível de consciência · offer book antes do funil · modelar do swipe file · A/B da headline (mín. 1.000 views) · "porquê" em cada preço · seguir 100% do script · desenhar/mostrar o que entrega · vender na janela de 4h · poucos caminhos.

**NUNCA:** depoimento pra público frio · mandar lead consciente pra funil de nível baixo · mandar nível 1 pra página completa · achar que "copiei o funil todo" basta · obsessão por página bonita vs sequência · testar cor de botão/footer achando que move conversão · oferta de entrada pra dar lucro · decidir teste com < 1.000 views · querer fazer tudo (só o 0,8 essencial).

---

## Os 3 testes que movem o ponteiro

1. **Headline** (verbatim, "o ouro") — A/B contínuo, toda semana.
2. **Oferta / preço** (síntese) — stack, ancoragem, ponto de preço.
3. **Prova / criativo-hook** casado ao nível de consciência (síntese).
Metodologia: só A/B por vez · mín. 1.000 views únicos · planilha de KPIs por etapa (visitas→cadastros→participantes→oferta→checkout→compras).

---

## Output (o que a skill entrega)

Pra cada pedido de funil, entregar em duas partes:

### Parte 1 — Diagnóstico
1. **Estágio de consciência** do público (nível 1-5 + justificativa de por que esse nível).
2. **Funil prescrito** (formato exato + por quê é o certo pra esse estágio).
3. **Anúncio que converte** (depoimento vs estudo de caso vs hook — casado ao nível).
4. **Conteúdo orgânico** que alimenta esse funil (por plataforma).
5. **Esqueleto da oferta** (dor, mecanismo, entregáveis, ancoragem, bônus, garantia).

### Parte 2 — Mapa de Execução (OBRIGATÓRIO — entrega sempre)

Ao final do diagnóstico, entregar o **mapa completo das peças a construir**, em ordem, com a skill responsável por cada uma. Formato exato:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAPA DE EXECUÇÃO — [nome do produto]
Estágio [N] → Funil: [tipo de funil]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PEÇA            SKILL             O QUE ENTREGA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
01 Offerbook    (pré-requisito)   oferta, mecanismo, ancoragem, bônus ← precisa existir antes
02 Design       /design-md        identidade visual da sua marca
03 Formato      (DECISÃO — só     o formato de funil de topo casado ao estágio; NÃO rode
   do funil     anote, NÃO rode   a skill da peça agora (ela precisa do copy.md do 04 e
                agora)            do DESIGN.md do 02):
                nível 5 → /advertorial-funil ou /lancamento-funil (+ /vsl-funil)
                nível 4 → /webinario-funil ou /quiz-funil
                nível 3 → /webinario-funil
                nível 2-1 → /pagina-vendas-funil
04 Copy         /copy-funil       fundação da copy (Big Idea, mecanismos, banco de
                                  headlines/bullets) → copy.md, a fonte única; a copy
                                  APLICADA de cada peça é gerada na skill da própria
                                  peça a partir do copy.md
05 Peça do      (a skill anotada  estrutura da peça + copy aplicada (do copy.md)
   funil        no 03)
   + página     /pagina-vendas-funil    estrutura da página/checkout + copy aplicada (do copy.md)
                /mockup-produto-funil   mockups dos produtos/bônus na identidade da marca
                ← ordem é lei: a página/peça SÓ se monta com a FUNDAÇÃO da
                  copy aprovada (copy.md, do 04); a copy aplicada da peça
                  nasce na própria skill da peça, a partir dessa fundação.
                  Nunca montar peça sem copy.md aprovado.
06 Email        /email-funil      sequência nutrição → venda → recuperação
07 Conteúdo     /conteudo-funil   Reels + carrosséis + stories por estágio
08 Recuperação  /recuperacao-funil      carrinho / cartão recusado / boleto / re-elevação
09 Back-end     /backend-funil         upsell / OTO / downsell / janela 4h / LTV
10 Teste        /cro-funil        KPIs por etapa + A/B headline + quando escalar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Execute nessa ordem (a mesma do gate N12). O "← PRÓXIMO" cai sempre no primeiro
item ainda faltante pela ordem N12 — pule o que já existe no projeto. Cada skill
usa o output da anterior.
```

> **Regra:** o mapa de execução é o entregável mais importante desta skill. Sem ele, o usuário não sabe o que construir. Sempre entregar — mesmo que o pedido seja só um diagnóstico rápido.

> **O mapa sempre diz qual é o PRÓXIMO comando.** Ao entregar o mapa, feche dizendo explicitamente qual comando o aluno roda em seguida — o **primeiro item ainda faltante pela ordem N12** (normalmente `/design-md` ou, se o DESIGN.md já existe, `/copy-funil`) — nunca deixe o aluno deduzir. A skill do formato (02) é uma DECISÃO anotada, não o próximo passo: apontá-la como próximo comando antes da fundação da copy existir contradiz o guia do aluno e gera retrabalho.

## Gate — ORDEM CANÔNICA do "Próximo passo:" (N12, determinística)

> **O "Próximo passo:" segue UMA ordem fixa — nunca improvisada.** Pra o próximo comando nunca sair não-determinístico (ex.: mandar mockup antes do e-mail), o "Próximo passo:" respeita SEMPRE esta ordem canônica, pulando o que já existe no projeto:
>
> **offerbook → design → metodo (esta skill) → copy → peça-do-funil → página → email → conteúdo → recuperação → back-end → cro**
>
> Aponte como próximo o **primeiro item da fila que ainda não existe** em `projetos/{slug}/` (leia `.claude/skills/_shared/perfil.md` e o Passo 0 pra saber o que já está pronto). Um comando só, nunca um menu.

> **Ramo físico/local (Tipo = físico):** o funil é **página local + WhatsApp** — `/whatsapp-funil` **assume o slot do e-mail na fila** (o WhatsApp é o canal principal; o e-mail vira apoio). Na ordem N12, onde leria "email → `/email-funil`", leia "**`/whatsapp-funil`**". Isso resolve o beco do negócio local: não mande o físico pro `/email-funil` (que devolve "e-mail é secundário") — mande pro `/whatsapp-funil`.

> **MOCKUP, BÔNUS e CRIATIVOS são OPCIONAIS e TARDIOS (bônus) — fora da fila do "próximo passo".** `/mockup-produto-funil`, `/bonus-funil` e `/criativos-funil` **nunca** são apontados como o próximo passo enquanto houver peça-núcleo (copy, página, email, conteúdo, recuperação, back-end, cro) por fazer. Eles entram só depois que o núcleo do funil está pronto, e só se o aluno pedir — são reforço de valor percebido, não etapa obrigatória da espinha. `/bonus-funil` gera os entregáveis dos bônus curados no offerbook (ebook, workbook, checklist, guia, voucher, calculadora, roteiro de áudio) e roda depois do offerbook + design; como mockup e criativo, não fura a fila da copy nem vem antes do e-mail.

> **Guard de perfil (antes de apontar qualquer peça):** leia `.claude/skills/_shared/perfil.md` — se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é proibido enquadrar o próximo passo como "curso/especialista/depoimento-de-aluno"; a peça apontada usa voz de marca e prova de uso/cliente. E siga `.claude/skills/_shared/nunca-travar.md`: pré-requisito/ferramenta sempre em linguagem de leigo, com glossário inline; nunca prometa que o HTML "abre sozinho" — dê o caminho + como abrir.

> **Lacunas conhecidas** (KB §7): os "17 elementos" originais e KPIs de aquisição/CAC e recorrência/MRR não estavam na transcrição — a skill cobre a espinha (consciência→funil→oferta→página) e os elementos de página são reconstrução fiel Hormozi+Alan (marcada no KB). Sinalizar isso quando o pedido cair nessas áreas.

---

## Veto conditions (NÃO prescrever se…)

| Situação | Ação |
|----------|------|
| Não sei o nível de consciência do público | PARAR → diagnosticar primeiro (é o gate) |
| Oferta/offerbook não existe | PARAR → construir a oferta ANTES do funil (skill `/offerbook`) |
| Pediram copy pronta | Escrever com a sua skill de copy, não de cabeça |
| Vão subir sem revisar | PARAR → revisar a estrutura primeiro |

---

*Skill metodo-funil — método de elevação de consciência (autoria Alan Nicolas), com base teórica em Hormozi ($100M Offers / Money Models). Toda prescrição calibra no KB.*

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

> **Onde salvar:** o diagnóstico + mapa de execução desta skill saem em **`projetos/{slug}/funil.md`** (+ `.html`/`.pdf`), na pasta do projeto ativo (o mesmo de onde você leu o `projetos/{slug}/offerbook.md`).

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
