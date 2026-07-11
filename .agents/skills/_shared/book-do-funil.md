# Book do Funil + pendências + versões — regra canônica compartilhada

> Texto integral das regras que antes viviam duplicadas em cada SKILL.md. As skills carregam a versão compacta e leem ESTE arquivo quando forem fechar a peça (atualizar o Book, gravar pendência, criar versão nova).

## 1. Recriar NUNCA apaga o que existe (regra dura)

Se a peça que você vai gerar JÁ EXISTE no projeto (arquivo, lote de PNGs, pasta), o novo sai como **versão nova** (sufixo `-v2`, `-v3`… ou subpasta `v2/`) e o antigo fica intocado. Apagar ou sobrescrever trabalho existente SÓ com ordem explícita do dono nesta conversa ("pode apagar", "substitui"). O dono compara as versões e decide qual usar; índices, galerias e o Book mostram as duas, com a mais nova primeiro, e **cada versão antiga leva um botão ✕ "Excluir esta versão"**: o ✕ NUNCA apaga arquivo do disco — ele só tira a versão da visualização, pra não poluir o Book/galeria. Ao clicar, abre a confirmação: *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* Confirmou, a seção some (persistido em `localStorage`) e um link discreto **"Mostrar versões ocultas (N)"** no rodapé traz de volta quando quiser. Apagar do disco de verdade continua exigindo ordem explícita do dono no chat.

## 2. Pendências do dono em UM lugar só (com chave por decisão)

Sempre que a skill deixar um placeholder pro dono (`[DONO ...]`, `[A PREENCHER]`, `[PLUG ...]`, `[SEM PROVA AINDA]`, `[N]`), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável, campo de resposta em cada item e o botão "Copiar respostas pro Claude"; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. **Dedup por CHAVE** (regra completa em `_shared/pendencias.md`): cada decisão tem um slug estável; re-run atualiza a entrada existente, nunca soma. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez, marcar o item, REGENERAR o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRIR o html atualizado — o dono precisa VER o que continua pendente. O `/status-funil` lê esse arquivo.

## 3. Book do Funil (o hub do projeto) + fecho obrigatório

O projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e cada card linka SEMPRE o `.html` da peça (o `.md` e o `.docx` são fonte interna; o que o dono abre pelo Book é o `.html`) — **NUNCA linke `.md` no Book** — e a seção de **pendências + mapa NO FINAL** do Book.

**Navegação dos documentos internos:** todo DOCUMENTO interno gerado (mapas, docs de copy, índices, checklists, roteiros — tudo que é do dono, nunca as páginas do lead) leva no topo o par: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — histórico do navegador, com o Book como fallback) e **"← Book do Funil"** (link fixo pro hub). **Página de roteiro/VSL leva DOIS botões explícitos:** "← Voltar pra [a página a que pertence]" (link DIRETO pro arquivo, ex.: `index.html` da própria pasta) E "← Book do Funil". **O fallback do "← Voltar" resolve pro caminho relativo REAL** conforme a profundidade da pasta (`../index.html`, `../../index.html`…), nunca um `index.html` fixo que não existe naquele nível.

**Formato canônico do marcador de progresso (padronizar — nunca inventar um terceiro):**
- **No Book** (`projetos/{slug}/index.html`): o rodapé traz o bloco literal **"VOCÊ ESTÁ AQUI:"** apontando o estado atual e o **próximo comando** a rodar.
- **No mapa** (`funil.md` + `funil.html`): a peça concluída vira **"(feito ✓)"** e a próxima da fila leva o marcador **"← PRÓXIMO"** na própria linha.

**Ao terminar a skill:** (1) **atualize o card da sua peça no Book** E o status no mapa (`funil.md` + `funil.html`) — atualize OS DOIS marcadores acima (o "VOCÊ ESTÁ AQUI:" do Book e o "(feito ✓)" / "← PRÓXIMO" do mapa), sempre apontando pro ponto real do dono, nunca pra etapa vencida (crie o Book se não existir, na identidade do DESIGN.md). Se o projeto usar outro formato legado do marcador, **converta pro canônico** em vez de criar um terceiro; (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html`. Instrua: preencher os campos, Copiar respostas, colar no chat.

**Versão cliente (agência):** se o Perfil do Projeto tiver "Quem opera = agência", ofereça no fecho gerar uma **versão cliente** do Book — HTML sem etapas internas/pendências/bastidor, preservando o Book de trabalho.

## 4. Amostra/checkpoint também entra no Book (regra dura)

Toda peça mostrada pro dono — mesmo 1 amostra antes do lote — PRIMEIRO entra no Book (card na fase certa, badge "em revisão", apontando pra galeria/HTML da peça, NUNCA pro arquivo solto) e SÓ ENTÃO é aberta e enviada renderizada. Nunca mande PNG/arquivo solto no chat sem a peça registrada no Book. Ao aprovar e escalar o lote, o card vira "feito".
