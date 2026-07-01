---
name: pagina-vendas
description: "Monta a estrutura de uma página de vendas de alta conversão pelo método do Alan Nicolas, aplicando a identidade visual da marca DO PRÓPRIO usuário — extraída via um DESIGN.md gerado pela skill design-md (passo anterior). Entrega o mapa completo da página de cima pra baixo: headline (fórmula 'como [resultado] em [tempo] sem [objeção]'), sub-headline, vídeo/VSL, mecanismo único, oferta/stack de valor, ancoragem de preço, prova social casada ao estágio de consciência, benefícios/bullets, bônus, garantia, escassez/urgência, FAQ, CTA repetido e footer — sem nenhuma marca, cor, fonte ou logo embutidos. Use quando quiser estruturar a sua página de vendas no método do Alan. A identidade visual vem do seu DESIGN.md; a copy final é você quem escreve a partir do esqueleto."
user_invocable: true
---

# Página de Vendas — Método do Alan Nicolas (genérica, pra usar no seu projeto)

Skill que monta a **estrutura de uma página de vendas de alta conversão** pelo método do **Alan Nicolas**, e aplica a **identidade visual da sua própria marca** — nada de cor, fonte, logo ou marca de terceiros embutidos aqui. A skill estrutura; **a copy final é você quem escreve**.

> **KB (fonte de verdade):** `KB-pagina-vendas.md` (nesta pasta). Traz os elementos da página com **verbatim real do Alan** e o método dos 3 testes. **Carregue o KB antes de montar a página** — não responda de cabeça.

> **Tese central:** a página não é um modelo bonito que se copia e cola. É uma **sequência de persuasão de cima pra baixo** — cada elemento na ordem certa — e o que **carrega a sua marca** é o DESIGN.md do seu projeto, não a estrutura. *"Esse título no começo é o que faz a pessoa se interessar por continuar a tua página ou não."* (Alan)

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores — a **copy** (skill `/copy-funil`) e o **DESIGN.md** da sua marca (skill `/design-md`). Todo o trabalho de um nicho vive em **`projetos/{slug}/`** (convenção de projeto acima).

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira que os arquivos existem:**

```
ls projetos/{slug}/copy.md projetos/{slug}/DESIGN.md 2>/dev/null
```

- Se existir(em), leia deles — a copy dá o texto real da página, o DESIGN.md dá a identidade visual.
- Se FALTAR, PARE e aponte a skill que gera cada arquivo:

> Pra montar a página eu preciso do `projetos/{slug}/copy.md` (da skill `/copy-funil`) e do `projetos/{slug}/DESIGN.md` (da skill `/design-md`). Rode `/copy-funil` e `/design-md` primeiro e volte.

Não invente o que deveria vir da etapa anterior (a copy, a identidade visual).

## Gate de compliance — nicho sensível

Antes de fechar a headline, a oferta ou a prova social da página, verifique se o nicho é **regulado**: saúde/bem-estar/emagrecimento/estética, finanças/investimento/renda, jurídico, ou autoestima/relacionamento com promessa de resultado.

- **Se for**, evite alegação que vira problema legal: "cura", "garantido", "resultado em X dias", "renda garantida", "sem esforço".
- Use **linguagem de possibilidade**: "pode ajudar", "muitas pessoas relatam", "com dedicação". Todo depoimento na prova social entra com ressalva: *"resultados variam de pessoa pra pessoa"*.
- Recomende ao aluno **conferir as regras e os órgãos reguladores do mercado dele** — este gate só **alerta**, não é aconselhamento jurídico, e validar é responsabilidade do aluno.
- Isto é um **aviso, não um bloqueio**: a skill segue montando a página, só com a headline/oferta calibradas pra não prometer o proibido.

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
4. **Montar a página** seguindo a tabela de elementos (topo → fundo), aplicando a identidade do DESIGN.md em cada bloco.
5. **Você [aluno] revisa e aprova** a estrutura. NUNCA subir/publicar/executar nada — a skill só estrutura.

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

| # | Elemento | O que entra (você escreve a copy) | Identidade visual (do seu DESIGN.md) |
|---|----------|-----------------------------------|--------------------------------------|
| 1 | **Headline** | Fórmula: *"Como [resultado] em [tempo] sem [objeção]"*. Item de maior alavancagem. | fonte de título + cor primária |
| 2 | **Sub-headline** | 1-2 linhas que nomeiam o mecanismo/promessa | fonte secundária |
| 3 | **Vídeo / VSL** | vídeo de vendas no topo (player "vivo" prende) | cor de player / acento |
| 4 | **CTA principal (acima da dobra)** | botão em 1ª pessoa: *"Sim, quero [resultado]"* | cor de botão + contraste do DESIGN.md |
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
2. **Mapa da página** — os 15 elementos topo→fundo, cada um com: o que vai na copy (esqueleto/placeholder pra você preencher) + qual token visual do seu DESIGN.md aplicar.
3. **Headline** passada nos 3 testes (resultado · tempo · objeção).
4. **Plano de teste** — headline primeiro, KPIs por etapa.
5. **Checklist visual** — onde cada cor/fonte/logo do DESIGN.md entra.

> A **copy final é você** quem escreve a partir do esqueleto. A skill estrutura a página e mapeia onde a sua identidade visual entra.

> **Onde salvar:** o mapa/estrutura desta skill sai em **`projetos/{slug}/pagina/index.html`** (+ o mapa em `.md` na mesma subpasta, quando gerar). Mesma pasta do projeto.

---

## Regras

**SEMPRE:** ter o DESIGN.md da sua marca antes (Passo 0 via `/design-md`) · casar a prova social ao estágio de consciência · headline na fórmula "como/em/sem" e passada nos 3 testes · "porquê" em cada mudança de preço · CTA repetido · formulário mínimo pra público quente · você [aluno] revisa antes de qualquer coisa.

**NUNCA:** embutir cor/fonte/logo/marca de terceiros (a identidade é só a sua, via DESIGN.md) · depoimento puro pra público frio · mandar nível 1 pra página completa · testar cor de botão/footer achando que move conversão · decidir teste com < 1.000 views · subir/publicar/executar a página (a skill só estrutura).

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

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
