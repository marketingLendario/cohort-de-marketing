---
name: offerbook
description: "Preenche o Offerbook (Livro da Oferta — Story Selling) de um produto/oferta. Cria o documento, extrai o avatar de uma fonte de pesquisa real, escreve o conteúdo na voz da marca e organiza em blocos separados. Tudo o que a skill precisa está neste arquivo — nenhum arquivo externo é necessário."
user_invocable: true
---

# Offerbook (Livro da Oferta)

Esta skill produz o **Offerbook** de uma oferta: o brief de Story Selling que fundamenta TODA a copy depois (LP, e-mails, ads). Regra-mãe: **toda oferta nova começa pelo offerbook**, antes de qualquer copy.

Este arquivo é **autossuficiente**: a estrutura completa, o passo a passo, as regras e o checklist estão todos aqui dentro. Não depende de nenhum template, banco de dados ou pasta externa.

---

## Quando usar

- Início de qualquer oferta/produto novo.
- Gatilhos: "offerbook", "livro da oferta", "preencher offerbook", "monta a oferta de [produto]".

## Como ativar

`/offerbook [produto]` — ex.: `/offerbook curso-de-ingles`.
Se não vier o nome do produto, **pergunte qual é a oferta e PARE** até receber a resposta.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho, ex.: `projetos/curso-de-ingles/`). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz — assim você pode tocar vários nichos ao mesmo tempo sem misturar, e as skills seguintes sabem exatamente onde achar cada peça.

**Como descobrir o projeto ativo** (toda skill do funil segue isto):
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, rode `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → é o começo do funil.

**Nomes dentro da pasta** (sem repetir o slug): `offerbook.md`, `avatar.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Sempre nos 3 formatos (md/html/pdf) onde a skill já gera.

> **Esta skill é a primeira do funil:** ela **cria** `projetos/{slug}/` (o `{slug}` sai do nome do produto) e salva tudo dentro. As demais skills leem dessa pasta.

---

## Pré-requisitos (o que você precisa ter à mão)

1. **Um documento de destino** — pode ser um Google Doc, Notion, Word ou Markdown. Use a estrutura de 7 blocos abaixo. (Se tiver um template próprio, duplique-o e preencha a cópia; **nunca edite o template original**.)
2. **Uma fonte de pesquisa de avatar REAL** — formulários, pesquisas, respostas de leads, entrevistas, comentários, depoimentos. O Avatar e a Análise de Cliente saem **daqui**, com número (N), porcentagem e citações literais. Onde não houver dado: escreva **"SEM DADO NA PESQUISA"**.
3. **Materiais já existentes da oferta** — qualquer transcrição, depoimento, grade do produto, hooks, e-mails aprovados, guia de voz da marca. Regra: **não recriar o que já existe, não inventar dado.**

---

## Gate de compliance — nicho sensível

Antes de escrever a promessa, a USP ou a oferta do offerbook, verifique se o nicho é **regulado**: saúde/bem-estar/emagrecimento/estética, finanças/investimento/renda, jurídico, ou autoestima/relacionamento com promessa de resultado.

- **Se for**, evite alegação que vira problema legal: "cura", "garantido", "resultado em X dias", "renda garantida", "sem esforço".
- Use **linguagem de possibilidade**: "pode ajudar", "muitas pessoas relatam", "com dedicação". Todo depoimento entra com ressalva: *"resultados variam de pessoa pra pessoa"*.
- Recomende ao aluno **conferir as regras e os órgãos reguladores do mercado dele** — este gate só **alerta**, não é aconselhamento jurídico, e validar é responsabilidade do aluno.
- Isto é um **aviso, não um bloqueio**: a skill segue montando o offerbook, só com a promessa e a oferta calibradas pra não prometer o proibido.

---

## Pipeline (passo a passo)

1. **Gerar o `briefing-offerbook.md`** — antes de escrever o offerbook, consolidar inputs em 1 arquivo curto (1-2 páginas) que será o checklist de fontes:

   ```markdown
   # Briefing Offerbook — [Produto]

   ## Inputs disponíveis (checklist)
   - [ ] `relatorio-avatar.md` — caminho: ...
   - [ ] `dossie-{concorrente}.md` (1+ concorrentes) — caminhos: ...
   - [ ] `briefing-swipe-file.md` — caminho: ...
   - [ ] Depoimentos/cases (N=?)
   - [ ] Voz da marca / DESIGN.md
   - [ ] Materiais existentes (transcrições, e-mails aprovados, etc.)

   ## Decisões prévias do dono da oferta
   - Promessa central (1 frase): ...
   - Mecanismo único (nome interno): ...
   - Preço-âncora pretendido: ...
   - Garantia: ...
   - Bônus já confirmados: ...

   ## Lacunas conhecidas (vão pra "Lacunas e Próximos Passos")
   - ...

   ## Autorização do dono
   - [ ] Dono da oferta aprovou esse briefing para virar offerbook
   ```

   **Regra:** se o briefing ficar com mais de 30% de campos vazios ou sem `relatorio-avatar.md`, **PARAR e pedir os dados antes** de escrever o offerbook. Offerbook sem briefing aprovado = ficção.

2. **Criar o documento** "Offerbook — [Produto]" (cópia de um template, ou do zero usando a estrutura abaixo).
3. **Checar o que já existe** antes de produzir (materiais da oferta, pesquisas, depoimentos, voz da marca). Não inventar.
4. **Avatar e Análise de Cliente vêm da pesquisa real** (obrigatório). Trazer N, % e citações literais dos leads/clientes. Onde faltar dado: "SEM DADO NA PESQUISA".
5. **Escrever o conteúdo** (Oferta, História, Copy) com dados reais + a voz da marca.
6. **Organizar em blocos/guias separadas**, uma por bloco: Capa e Materiais · Posicionamento (Oferta) · Avatar · História · Análise de Cliente · Copy · Lacunas.
7. **Lacunas:** o que não dá pra inventar (datas, stack oficial, bônus da turma, garantia, links) vai numa seção "Lacunas e Próximos Passos", separado **por quem resolve** (dono da oferta vs. equipe de marketing).
8. **Apresentar e conferir campo a campo** contra a estrutura antes de declarar "completo".

> Só depois do offerbook aprovado é que se escreve LP, e-mails e ads.

---

## Estrutura completa (os 7 blocos)

Preencher TODOS os campos. Não reorganizar, não resumir, não pular campo.

### 1. Materiais
- Links de Social Media / URLs (Instagram, Página de vendas, Checkout)
- Materiais de apoio
- Conteúdos de referência
- *(Materiais = links que a equipe abre. Sem link ainda → "A ADICIONAR".)*

### 2. Posicionamento › Oferta
- Nome do produto
- Promessa
- USP (proposta única de venda)
- Valor, ancoragem e bônus (responder as 9 perguntas de valor)
- Conteúdo do treinamento (módulos + a técnica de cada um)
- Autoridade (Especialista + Depoimentos)

### 3. Avatar  *(da pesquisa real)*
- Cliente ideal
- Desejo
- Problema
- Erros (o que ele já tentou e errou)
- Solução (Solução técnica + Mecanismo único + "Bambu chinês")
- Objeções
- Benefícios diretos
- Benefícios profundos

### 4. História
- Promessa · estilo · bambu chinês
- Problema · o "porquê" do problema · erros · porque não funciona
- Nome da situação do problema
- Contexto da solução · mecanismo
- Nome da situação do resultado
- Exemplo (gancho para a oferta + USP)

### 5. História v2 (versão expandida)
- [Atenção] · Boas-vindas · Promessa · Lead
- Problema (mundo atual) e consequências · porque acontece
- Como tentam resolver (erros) · porque não funciona · o que pode piorar
- Tirar a culpa · inimigo comum
- "Porquê" é outra solução · provas · mecanismo único
- Exemplo / big idea · mundo ideal
- Bônus com escassez · objeções

### 6. Análise de Cliente  *(da pesquisa real)*
- Demográfico
- Personalidade
- Armadilhas
- Dores · Dores escondidas
- Medos
- Desejos · Desejos profundos
- Vida Perfeita
- Objeções (Da promessa + Do produto)

### 7. Copy
- Ads
- Landing Page (Versão A, B, C)
- E-mails

---

## Output (3 arquivos)

A skill **sempre** entrega 3 arquivos dentro de **`projetos/{slug}/`** (cria a pasta se não existir):

1. **`projetos/{slug}/briefing-offerbook.md`** — gerado no Passo 1 do Pipeline. Consolida inputs (avatar + concorrentes + swipe-file + decisões do dono) e serve de gate: sem briefing aprovado, não escreve offerbook.
2. **`projetos/{slug}/offerbook.md`** — fonte de verdade (Markdown com os 7 blocos completos). *(o `{slug}` já é a pasta; o arquivo não repete o slug no nome.)*
3. **`projetos/{slug}/offerbook.docx`** — gerado a partir do MD com `python scripts/gerar_docx.py projetos/{slug}/offerbook.md` usando o `Template-Offerbook.docx` oficial.

Regras de geração:
- MD é a fonte de verdade. Nunca editar só o DOCX; corrigir o MD e regenerar.
- Template original do DOCX NUNCA é modificado — o script faz cópia.
- Se faltar campo no MD, o DOCX gera com `[A PREENCHER]` no lugar (não falha).
- Pré-requisito DOCX: `pip install python-docx` (uma vez).
- **Material visual usa o `DESIGN.md` da marca:** qualquer versão visual (HTML/PDF) do offerbook é renderizada JÁ com os tokens do `projetos/{slug}/DESIGN.md` — cores, fontes, borda/raio, tamanho, logo. NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto). Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). O `Template-Offerbook.docx` (estrutura do documento) permanece intacto. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.

---

## Regras

- **Idêntico à estrutura:** todas as seções e campos exatos, inclusive os campos específicos da História (estilo, "porquê" do problema, nome da situação do problema/resultado). Não reorganizar nem resumir.
- **Blocos separados** (guias/tabs), um por bloco.
- **Materiais = links que a equipe abre, NUNCA caminhos de arquivo local.** Sem link → "A ADICIONAR".
- **Avatar e Análise de Cliente vêm da pesquisa real**, nunca de inferência.
- **Texto limpo:** nada de markdown cru no documento final (sem `##`, `**`, `===`).
- **Substituir** qualquer texto residual de template (exemplos de outro projeto) pelo conteúdo da oferta atual.
- **Só depois do offerbook aprovado** o copywriter escreve LP/e-mails/ads.

---

## ✅ Checklist de qualidade (conferir antes de entregar)

**Fundação**
- [ ] Nome do produto a partir do argumento/briefing (não inventado)
- [ ] Documento criado como CÓPIA — template original intacto
- [ ] Materiais já existentes foram checados antes de produzir
- [ ] Nenhum dado inventado

**Avatar e Análise de Cliente**
- [ ] Avatar saiu da pesquisa REAL (não de inferência)
- [ ] Tem N (número de respostas), % e citações literais dos leads
- [ ] Campos sem dado estão marcados como "SEM DADO NA PESQUISA"

**Estrutura (campo a campo)**
- [ ] Bloco 1 — Materiais completo (links, não caminhos de arquivo)
- [ ] Bloco 2 — Posicionamento/Oferta (nome, promessa, USP, 9 perguntas de valor, módulos, autoridade)
- [ ] Bloco 3 — Avatar (8 campos)
- [ ] Bloco 4 — História (todos os campos, inclusive nomes da situação problema/resultado)
- [ ] Bloco 5 — História v2 (versão expandida completa)
- [ ] Bloco 6 — Análise de Cliente (demográfico → objeções)
- [ ] Bloco 7 — Copy (Ads, LP A/B/C, E-mails)

**Forma**
- [ ] Cada bloco em sua guia/seção separada
- [ ] Texto limpo, sem markdown cru
- [ ] Nenhum texto residual de outro projeto
- [ ] Guia "Lacunas e Próximos Passos" separada por quem resolve (dono da oferta vs. equipe)

**Gate final**
- [ ] Conferido campo a campo contra esta estrutura
- [ ] Apresentado para aprovação
- [ ] Só liberar copy (LP/e-mails/ads) depois do offerbook aprovado

---

## Limitação conhecida

Se for usar um conector de Google Docs: alguns conectores só aplicam formatação (heading/negrito) na guia padrão; nas guias novas o texto entra limpo, sem hierarquia visual. Se a formatação idêntica ao template for prioridade, usar um documento único formatado (perde a separação em guias).

---

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo um link fixo **"← Book do Funil"** de volta pro hub — de qualquer peça se volta pro Book com 1 clique. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **python-docx** — gera o `.docx` do template oficial. Check: `pip3 show python-docx`. Instalar: `pip3 install python-docx`. **Fallback:** entregar o `.md` (fonte de verdade) e gerar o docx quando a lib existir.
- **Transcrição de áudio (whisper)** — a IA NÃO escuta áudio sozinha. Check: `which whisper-cli` ou `pip3 show mlx-whisper` (+ `which ffmpeg` pra converter). Tendo, transcreva pelo terminal (`whisper-cli -m <modelo> -l pt -f audio.wav -otxt` ou `mlx_whisper audio.wav --language pt`). Faltando: ofereça `brew install whisper-cpp ffmpeg` e PERGUNTE antes de instalar. **Fallback sem instalar nada:** o WhatsApp transcreve áudio (segurar a mensagem > transcrever > colar aqui), ditado do celular, ou colar transcrição de qualquer ferramenta. O que importa é a fala real chegar em texto.
- **WebSearch / WebFetch** — pesquisa aberta na internet. Já vem no Claude Code, sem instalação. Se um site bloquear (login wall/Cloudflare), diga QUAL fonte falhou e o que veio de snippet.

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com `open <arquivo>.html` (macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
