---
name: pagina-vendas
description: "Monta a estrutura de uma página de vendas de alta conversão pelo método do Alan Nicolas, aplicando a identidade visual da marca DO PRÓPRIO usuário — extraída via um DESIGN.md gerado pela skill design-md (passo anterior). Entrega o mapa completo da página de cima pra baixo: headline (fórmula 'como [resultado] em [tempo] sem [objeção]'), sub-headline, vídeo/VSL, mecanismo único, oferta/stack de valor, ancoragem de preço, prova social casada ao estágio de consciência, benefícios/bullets, bônus, garantia, escassez/urgência, FAQ, CTA repetido e footer — sem nenhuma marca, cor, fonte ou logo embutidos. Use quando quiser estruturar a sua página de vendas no método do Alan. A identidade visual vem do seu DESIGN.md; a copy aplicada da página (headline, sub, bullets, oferta, FAQ) é gerada nesta skill a partir da fundação do copy.md (da skill copy-funil) — você revisa e aprova."
user_invocable: true
---

# Página de Vendas — Método do Alan Nicolas (genérica, pra usar no seu projeto)

Skill que monta a **estrutura de uma página de vendas de alta conversão** pelo método do **Alan Nicolas**, e aplica a **identidade visual da sua própria marca** — nada de cor, fonte, logo ou marca de terceiros embutidos aqui. A skill estrutura E **gera a copy aplicada da página a partir da fundação do `copy.md`** (da `/copy-funil`); **você revisa e aprova**.

> **KB (fonte de verdade):** `KB-pagina-vendas.md` (nesta pasta). Traz os elementos da página com **verbatim real do Alan** e o método dos 3 testes. **Carregue o KB antes de montar a página** — não responda de cabeça.

> **Tese central:** a página não é um modelo bonito que se copia e cola. É uma **sequência de persuasão de cima pra baixo** — cada elemento na ordem certa — e o que **carrega a sua marca** é o DESIGN.md do seu projeto, não a estrutura. *"Esse título no começo é o que faz a pessoa se interessar por continuar a tua página ou não."* (Alan)

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

## Passo 0 — Checar insumos antes de rodar

Rode `ls projetos/{slug}/` e veja o que já existe. Insumos desta skill:

- **Obrigatórios:** `offerbook.md` aprovado (sai da skill `/offerbook`) e `DESIGN.md` (sai da skill `/design-md`).
- **Recomendados:** `avatar.md` (dores e objeções verbatim do público), `espiao/dossie-*.md` (brechas do concorrente viram diferenciais e quebra de objeção na página), `swipe/briefing-swipe-file.md` (hooks validados pra headline).

Se faltar um obrigatório, aponte a skill que o gera e **PERGUNTE** se o usuário quer seguir mesmo assim — não trave silenciosamente, não assuma.

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores — a **copy** (skill `/copy-funil`) e o **DESIGN.md** da sua marca (skill `/design-md`). Todo o trabalho de um nicho vive em **`projetos/{slug}/`** (convenção de projeto acima).

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira que os arquivos existem:**

```
ls projetos/{slug}/copy.md projetos/{slug}/DESIGN.md 2>/dev/null
```

- Se existir(em), leia deles — o `copy.md` dá a **fundação da copy** (Big Idea, mecanismos, banco de headlines/bullets), o DESIGN.md dá a identidade visual.
- Se FALTAR, PARE e aponte a skill que gera cada arquivo:

> Pra montar a página eu preciso do `projetos/{slug}/copy.md` (da skill `/copy-funil`) e do `projetos/{slug}/DESIGN.md` (da skill `/design-md`). Rode `/copy-funil` e `/design-md` primeiro e volte.

Não invente o que deveria vir da etapa anterior (a fundação da copy, a identidade visual).

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem travessão (—) na copy (regra dura).** Travessão é cara de texto de IA. Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro), reescreva com ponto, vírgula ou dois-pontos. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo o par de navegação: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — usa o histórico do navegador, com o Book como fallback quando o arquivo foi aberto direto) e **"← Book do Funil"** (link fixo pro hub). Quem clica numa VSL a partir de uma página e volta, volta PRA PÁGINA, não pro Book. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

> **Rastreamento: a página nasce PIXEL-READY; os IDs entram na Aula 3 (Tráfego).** Nenhuma página do funil nasce cega, mas esta etapa também não cria fricção: **NÃO mande o aluno pro Gerenciador de Eventos agora.** Toda página gerada já sai com os snippets de **Meta Pixel** (recomendado: é o que constrói a audiência de remarketing) e **GTM** (opcional: gerencia tags sem mexer em código; junto com o Pixel dá o melhor rastreamento) **prontos porém COMENTADOS** no `<head>` (+ `<noscript>` após `<body>`), com placeholders `[PLUG: SEU_PIXEL_ID]` / `[PLUG: GTM-XXXXXXX]` e os eventos-padrão da peça já ligados no código. Diga ao aluno em 1 linha: *"a página já nasce pronta pra rastreamento; os IDs a gente cria e pluga na Aula 3 (Tráfego): é colar 2 códigos e descomentar"*. Exceção: se o aluno JÁ tiver Pixel/GTM, pergunte os IDs e entregue plugado. Lembrete de LGPD: aviso de cookies/consentimento é responsabilidade do aluno. Os eventos alimentam a planilha de KPIs do `/cro-funil`. Eventos desta peça: PageView · ViewContent · clique no CTA principal · Lead (envio do formulário) · **chegou_na_oferta** (IntersectionObserver no bloco de oferta/preço: é o 'pixel na oferta' do método, a audiência de remarketing mais quente).

> **SEM barra de revisão dentro da página (a navegação mora no Book).** A página do lead NÃO leva barra de revisão, atalhos internos nem elemento de bastidor: a navegação entre as peças (copy, mapa, quiz, e-mails, pendências) fica no **Book do Funil** (`projetos/{slug}/index.html`), fora da página. Página de venda só carrega o que o LEAD deve ver.

> **O slot de vídeo nasce com roteiro (copy aplicada do vídeo).** O elemento 3 (vídeo/VSL) NUNCA fica só com placeholder: esta skill gera também o **roteiro do vídeo** (2-3 min: gancho, espelho, mecanismo do problema, inversão, convite, fecho; com fala pronta, texto na tela e notas de gravação) a partir do `copy.md`, salvo em `pagina/video-roteiro.html`. E o slot de vídeo na página inclui um botão **"Ver roteiro do vídeo"** DENTRO do próprio slot, apontando pro roteiro. O dono grava a partir dele e troca o slot pelo player.

> **Layout da página do lead (regra dura).** Vale pra TODA página voltada ao lead gerada por esta skill: **(1) quando a página tem vídeo, o botão de CTA fica SEMPRE ABAIXO do vídeo, nunca acima** — a ordem do topo é headline → sub-headline → vídeo → CTA (badges, selos e números de credibilidade vêm DEPOIS do CTA, nunca entre a headline e o vídeo); **(2) o botão de CTA é sempre centralizado** na página, em toda dobra em que aparecer; **(3) no mobile, o vídeo aparece assim que a página abre** — visível na primeira dobra, sem rolar; se não couber, enxugue o que vem antes dele (headline mais curta, sub de 1 linha), nunca empurre o vídeo pra baixo; **(4) jargão interno do método NUNCA vira texto visível na página do lead** — nada de "Big Idea", "mecanismo único", "ancoragem", "stack de valor", "prova social", "escassez" como eyebrow/rótulo/título de seção em NENHUMA página. Esses nomes vivem nos documentos internos do dono; na página, cada seção mostra só a copy real que o lead deve ler.

> **Seção "Quem será seu mentor" (obrigatória quando a oferta é pessoa: mentoria, consultoria, serviço 1-a-1).** Nessas ofertas, quem conduz é metade da decisão de compra e a página NÃO pode pular isso. Gerar a seção (posição: depois da jornada/benefícios, antes do investimento) com: foto real (placeholder `[DONO: FOTO]` com a direção "ambiente de trabalho, sem palco"), nome e credencial em 1 linha (`[DONO PREENCHE, sem inflar]`), bio curta na voz da marca gerada do `copy.md` (por que o método existe, o que faz diferente) e o bloco "o que você pode verificar sobre mim" (só fatos verificáveis). **Nunca inventar credencial, número ou história do mentor**: a estrutura e o ângulo saem da skill; os fatos, só do dono (regra de honestidade de prova).

A copy do funil tem 2 camadas: a **fundação** (Big Idea, mecanismos, voz/léxico, banco de headlines/bullets) vive no `projetos/{slug}/copy.md`, gerado pela `/copy-funil`; a **copy aplicada da página** nasce **aqui**.

- **Se `projetos/{slug}/copy.md` existe** (fundação aprovada): esta skill gera a copy final da página — **headline, sub-headline, bullets, oferta/stack, ancoragem, FAQ e CTAs** — A PARTIR do banco do `copy.md` (a headline sai das aprovadas na Fase 3 da `/copy-funil`, os bullets do banco Bencivenga) — o aluno **não volta pro `/copy-funil`** pra escrever a copy da página.
- **Se não existe:** aponte a `/copy-funil` (é ela que constrói a fundação) e **PERGUNTE** se o aluno quer seguir só com a estrutura (esqueleto com placeholders) ou rodar a fundação antes.
- **A copy aplicada obedece:** a Big Idea e os mecanismos do `copy.md` · a voz/léxico do avatar (palavras reais, não as suas) · a honestidade de prova (sem prova real → `[SEM PROVA AINDA]`) · o gate de compliance de nicho regulado.
- **Depois de aplicada**, a página pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman). O aluno revisa e aprova antes de qualquer protótipo/publicação.

## Gate de compliance — nicho sensível

Antes de fechar a headline, a oferta ou a prova social da página, verifique se o nicho é **regulado**: saúde/bem-estar/emagrecimento/estética, finanças/investimento/renda, jurídico, ou autoestima/relacionamento com promessa de resultado.

- **Se for**, evite alegação que vira problema legal: "cura", "garantido", "resultado em X dias", "renda garantida", "sem esforço".
- Use **linguagem de possibilidade**: "pode ajudar", "muitas pessoas relatam", "com dedicação". Todo depoimento na prova social entra com ressalva: *"resultados variam de pessoa pra pessoa"*.
- Recomende ao aluno **conferir as regras e os órgãos reguladores do mercado dele** — este gate só **alerta**, não é aconselhamento jurídico, e validar é responsabilidade do aluno.
- Isto é um **aviso, não um bloqueio**: a skill segue montando a página, só com a headline/oferta calibradas pra não prometer o proibido.

## Regra de honestidade de prova

- **Nunca inventar** depoimento, número, case ou citação na página. Toda prova social vem do offerbook ou de pesquisa real.
- **Sem prova disponível** → use estratégia alternativa no bloco de prova (garantia forte, bastidor, transparência) e marque `[SEM PROVA AINDA]`.
- **Nicho regulado** → linguagem de possibilidade, sem "resultado garantido" (respeite o gate de compliance do offerbook).

## Como usar

### Passo 0 (pré-requisito) — Ter o DESIGN.md da SUA marca

Antes de montar a página, você precisa do manual visual da **sua própria marca** em um `DESIGN.md`. Gere ele com a skill **`/design-md`** apontando pra uma URL da sua marca (seu site, sua landing atual, sua referência visual):

```bash
node .claude/skills/design-md/run.cjs --url https://SUA-MARCA.com/
```

Isso produz `DESIGN.md` + `tokens.json` (cores, fontes, espaçamento, raio de borda) extraídos da SUA marca. **É esse arquivo que dá identidade à página.** Se você ainda não tem, rode a `/design-md` primeiro.

> **Sem DESIGN.md → a skill monta a estrutura mesmo assim, mas deixa a parte visual como placeholder (`{{cor-primaria}}`, `{{fonte-titulo}}`, `{{logo}}`)** pra você preencher depois com o seu manual. Nenhuma cor/fonte é inventada.

### Passos seguintes — Coletar os inputs DO SEU projeto e montar

1. **Carregar o KB** (`KB-pagina-vendas.md`) pra ter os elementos e o verbatim na mão.
2. **Carregar o DESIGN.md da sua marca** (Passo 0) — cores, fontes, logo, tom visual.
3. **Coletar os inputs do seu projeto** (preencher os placeholders abaixo):
   - **Nicho / mercado** — `{{nicho}}` (ex.: o seu mercado)
   - **Produto / transformação** + **ticket** — `{{produto}}`, `{{ticket}}`
   - **Público + estágio de consciência (1-5)** — `{{publico}}`, `{{estagio}}` (de onde ele vem: frio de ads? base quente? orgânico? — isso decide a prova social que entra na página)
   - **Oferta** — `{{oferta}}` (entregáveis, preço-âncora, bônus, garantia)
4. **Montar a página** seguindo a tabela de elementos (topo → fundo), gerando a copy aplicada de cada bloco a partir do `copy.md` e aplicando a identidade do DESIGN.md.
5. **Você [aluno] revisa e aprova** a estrutura e a copy aplicada. NUNCA subir/publicar/executar nada — quem publica é você.

---

## Estágio de consciência decide a prova social

O **estágio de consciência do seu público (1-5)** muda principalmente **qual prova social** entra na página. Regra do Alan:

| Estágio | Estado do público | Prova que converte na página |
|---------|-------------------|------------------------------|
| **5 — Inconsciente** | não te conhece, nem sabe que tem o problema | estudo de caso (converte pouco aqui); foco em educar |
| **4 — Consciente do problema** | sente a dor, não sabe que há solução | **estudo de caso** |
| **3 — Consciente da solução** | conhece categorias, não seu produto | **estudo de caso** |
| **2 — Consciente do produto** | já sabe que seu produto existe | **depoimento** ("corredor polonês" de depoimentos) |
| **1 — Mais consciente** | já viu seu pitch, só falta empurrão | página **simplificada** / direto pro checkout, vídeo de **2 min** |

**Regra de ouro:** *"Anúncio de depoimento tem que ser pra quem está consciente do produto."* Depoimento puro converte no **nível 2**; estudo de caso no **3+**. Mandar nível 1 pra página completa **gera objeção** — simplifica.

---

## Elementos da página (topo → fundo)

Monte nesta ordem. Cada elemento recebe a identidade visual do **seu DESIGN.md** (cores, fontes, logo). Detalhe e verbatim no KB §Elementos.

| # | Elemento | O que entra (copy aplicada, gerada do `copy.md`) | Identidade visual (do seu DESIGN.md) |
|---|----------|-----------------------------------|--------------------------------------|
| 1 | **Headline** | Fórmula: *"Como [resultado] em [tempo] sem [objeção]"*. Item de maior alavancagem. | fonte de título + cor primária |
| 2 | **Sub-headline** | 1-2 linhas que nomeiam o mecanismo/promessa | fonte secundária |
| 3 | **Vídeo / VSL** | vídeo de vendas no topo (player "vivo" prende); no mobile, visível assim que a página abre (primeira dobra, sem rolar) | cor de player / acento |
| 4 | **CTA principal (abaixo do vídeo)** | botão centralizado, SEMPRE abaixo do vídeo (nunca acima), em 1ª pessoa: *"Sim, quero [resultado]"* | cor de botão + contraste do DESIGN.md |
| 5 | **Mecanismo único** | nome do seu método/sistema proprietário | destaque tipográfico |
| 6 | **Oferta / stack de valor** | core + entregáveis listados um a um, cada um com valor | grid/cards na sua paleta |
| 7 | **Ancoragem de preço** | âncora estabelecido → percebido → final, com "porquê" | hierarquia de preço (cor de destaque) |
| 8 | **Prova social** | casada ao estágio (tabela acima): depoimento=2, estudo de caso=3+ | cards de depoimento na sua marca |
| 9 | **Benefícios / bullets** | resultado, não recurso (move desejo/tempo/esforço) | ícones/lista no seu estilo |
| 10 | **Bônus** | extras cujo valor supera o core; com escassez embutida | selos/cards de bônus |
| 11 | **Garantia** | reversão de risco (condicional/incondicional) | selo de garantia na sua paleta |
| 12 | **Escassez / urgência** | escassez = nº de vagas; urgência = tempo. Reais e com "porquê" | contador/alerta na cor de destaque |
| 13 | **FAQ** | quebra de objeções (preço, "serve pra mim?", tempo, garantia) | acordeão no seu estilo |
| 14 | **CTA repetido + checkout** | botão repetido após cada bloco; formulário mínimo (nome, e-mail, telefone) | cor de botão do DESIGN.md |
| 15 | **Footer** | termos, contato, política, logo | logo + cores neutras do DESIGN.md |

> O footer **não move conversão** — Alan usa ele como exemplo de "elemento secundário". Importa por credibilidade/compliance, não por alavancagem.

---

## Os 3 testes que movem o ponteiro (headline primeiro)

1. **Headline** (verbatim, "o ouro") — A/B contínuo, toda semana. É o teste de maior alavancagem. *"Reduzi em 100 reais o meu custo por MQL. Só mudamos a headline."* Não desperdiçar teste em cor de botão/footer.
2. **Oferta / preço** — stack de valor, ancoragem e ponto de preço.
3. **Prova / criativo-hook** casado ao estágio de consciência.

**Metodologia:** só um A/B por vez · mínimo **1.000 views únicos** antes de decidir · planilha de KPIs por etapa (visitas → cadastros → oferta → checkout → compras).

---

## Os 3 testes da headline (gate antes de cravar a headline)

Antes de fechar a headline, ela tem que passar nos 3 testes (KB §3 testes da headline):

1. **Teste do resultado específico** — a headline promete um resultado **concreto e mensurável**, não vago?
2. **Teste do tempo** — tem um **prazo** ("em 90 dias", "em 30 dias")?
3. **Teste da objeção** — derruba a **maior objeção** do público ("sem [o que ele mais teme/rejeita]")?

A fórmula *"Como [resultado] em [tempo] sem [objeção]"* só está completa quando os 3 estão preenchidos.

---

## Output (o que a skill entrega)

Pra cada pedido, entregar o **mapa estruturado da página**:
1. **Estágio de consciência** do público (1-5) + qual prova social entra.
2. **Mapa da página** — os 15 elementos topo→fundo, cada um com: a copy aplicada gerada a partir do `copy.md` (ou placeholder marcado, se a fundação ainda não existir) + qual token visual do seu DESIGN.md aplicar.
3. **Headline** passada nos 3 testes (resultado · tempo · objeção).
4. **Plano de teste** — headline primeiro, KPIs por etapa.
5. **Checklist visual** — onde cada cor/fonte/logo do DESIGN.md entra.

> A skill estrutura a página, **gera a copy aplicada a partir da fundação do `copy.md`** e mapeia onde a sua identidade visual entra. **Você revisa e aprova** — a copy aplicada só é final com o seu OK.

> **Onde salvar:** o mapa/estrutura desta skill sai em **`projetos/{slug}/pagina/index.html`** (+ o mapa em `.md` na mesma subpasta, quando gerar). Mesma pasta do projeto.

---

## Regras

**SEMPRE:** ter o DESIGN.md da sua marca antes (Passo 0 via `/design-md`) · casar a prova social ao estágio de consciência · headline na fórmula "como/em/sem" e passada nos 3 testes · "porquê" em cada mudança de preço · CTA repetido · formulário mínimo pra público quente · você [aluno] revisa antes de qualquer coisa.

**NUNCA:** embutir cor/fonte/logo/marca de terceiros (a identidade é só a sua, via DESIGN.md) · botão de CTA acima do vídeo · jargão do método ("Big Idea", "mecanismo único", "prova social" etc.) como texto visível na página · depoimento puro pra público frio · mandar nível 1 pra página completa · testar cor de botão/footer achando que move conversão · decidir teste com < 1.000 views · subir/publicar/executar a página (a skill só estrutura).

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Não tenho o DESIGN.md da marca | Rodar `/design-md` antes — ou montar com placeholders visuais marcados |
| Não sei o estágio de consciência do público | Definir primeiro (decide a prova social) |
| Oferta não existe | Construir a oferta antes (entregáveis, preço-âncora, bônus, garantia) |
| Pediram pra publicar/subir | PARAR — a skill só estrutura; você [aluno] publica |

---

*Skill pagina-vendas v1 — estrutura genérica pelo método do Alan Nicolas. Toda montagem calibra no KB-pagina-vendas.md. A identidade visual vem do DESIGN.md gerado pela skill /design-md. Zero marca embutida.*

---

## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check — macOS: `ls "/Applications/Google Chrome.app"` · Windows (Git Bash): `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"`; no Windows o script também usa o Edge como fallback (já vem instalado). **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P no Mac, Ctrl+P no Windows > Salvar como PDF).

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo. E aponte **UM comando só**: NADA de "alternativas paralelas", menu de opções ou lista de skills pra escolher — isso enche o aluno de dúvida e quebra o fluxo. Se existir mais de um caminho possível, escolha você (pela ordem do mapa) e aponte só ele; as outras peças continuam no mapa/Book e chegam na vez delas.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com o comando do sistema do aluno — macOS: `open <arquivo>.html` · Windows: `start "" <arquivo>.html` · Linux: `xdg-open <arquivo>.html` (detecte o SO antes; NUNCA assuma macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
