# GUIA MARKETING STUDIO — o painel completo, tela por tela (lido direto do código do app)

> **Estou perdido em:** "abri o Studio e não sei o que cada tela faz, o que preencher, nem o que ele decide sozinho".
> **O que você vai ter no final:** o mapa COMPLETO do app — cada tela, cada campo, cada botão e cada trava (gate), com a regra que o código aplica. E as 3 leis que valem no painel inteiro.
> **Fontes cruzadas:** o CÓDIGO real do app (rotas e componentes em `apps/academia-lendaria-ads-studio/src/` — verificado tela a tela em 22/07) · o catálogo de skills embutido nele (as mesmas do chat) · o schema oficial do briefing do projeto.
> Nota de versão: este guia descreve o app como está no código de 22/07 — recurso que não aparecer pra você é sinal de versão anterior: atualize o repo do Studio (`git pull`) e suba de novo.

## As 3 leis do Studio (valem em TODAS as telas)

1. **Ele nunca decide sozinho.** Toda skill que roda no app devolve uma PROPOSTA — você lê e clica **Aprovar** ou **Rejeitar**. Só o aprovado vira artefato.
2. **Ele nunca publica na Meta.** A subida é 100% sua, no Gerenciador — o app só registra que VOCÊ confirmou ("Confirmar que publiquei na Meta"). Não existe botão de publicação automática.
3. **É o mesmo motor do chat.** As skills do app são as mesmas do Claude Code (`/briefista`, `/estruturador`, `/diagnosticador`...). Tudo que o painel faz, o chat faz — use o que preferir; um banner avisa quando o app está em **modo simulação** (sem o executor local conectado).

## Subir e encerrar

- **Subir:** pasta `apps/academia-lendaria-ads-studio` do repo do Studio (é OUTRO repo) → `npm run studio` (Docker Desktop aberto antes) → abra o endereço que o terminal mostrar.
- **Encerrar SEMPRE:** `node scripts/marketing-studio.mjs stop` + fechar o Docker — rodando esquecido, consome muita memória.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🧰 Ferramenta | Docker Desktop instalado e aberto | docker.com |
| 🧰 Ferramenta | Repo do Ads Studio clonado e atualizado (`git pull`) | link no material da aula do Studio |
| 📖 Conhecimento | O método das skills (o app é a versão visual dele) | [roteador de guias](../README.md) |

## Tela 1 — Login

E-mail e senha. Sem conta configurada, o app oferece o **modo demo local** — as credenciais de demonstração aparecem escritas NA PRÓPRIA tela de login (é treino: dados locais, nada vai pra nuvem).

## Tela 2 — Seus projetos (home)

- **"Novo projeto"**: dê um nome (ex.: "Nova oferta 2026") → ele cria o projeto e o briefing vazio.
- A lista mostra seus projetos; clicar em um abre o workspace com as abas: **Visão geral · Artefatos · Briefing · Jornada · Campanhas · Semanas**.

## Tela 3 — Visão geral (a "home" do projeto)

O painel de orientação: **"Próximo passo do projeto"** (a ação recomendada = a próxima skill da jornada) · o estado das próximas etapas · os artefatos recentes · e o status de **prontidão de campanha** ("Pronta para criar" ou "Ainda bloqueada" — com o que falta). É o `/status-funil` em versão visual.

## Tela 4 — Artefatos (o registro de fontes)

Cada arquivo do seu projeto vira um card com **verificação**: `Verificado · Pendente · Ausente`.
- **Registrar artefato** (botão): título + tipo (ex.: `offerbook`) + caminho (`projetos/meu-projeto/arquivo.md`) + formato (markdown/html/pdf/imagem/json/yaml) → entra como *pendente*.
- No detalhe: caminho, estado, origem, **"Produzido por"** (qual skill gera aquele tipo), hash — e os botões **"Confirmar existência"** (vira Verificado), **"Marcar desatualizado"** e **Baixar** (quando o conteúdo está no app).
- Busca + filtro por verificação no topo.
- Regra prática: artefato **Verificado** é o que conta pros gates das outras telas.

## Tela 5 — Briefing (7 seções + revisão)

As seções, na ordem do schema oficial: **Projeto · Mercado · Oferta · Marca · Funil · Canais · Dados** — e a **Revisão** no final.
- Cada campo tem validação em tempo real (obrigatório, mínimo/máximo de caracteres, URL http/https, número inteiro, faixa de valores) e cada seção mostra o **progresso** (preenchidos/total).
- Campos-chave que as campanhas herdam depois: nicho, público-alvo, temperatura de tráfego (Mercado) · nome e preço exato da oferta (Oferta) · voz (Projeto) · URL de destino do CTA (Canais).
- Importar `project-brief.json` é aceito (o app converte formatos antigos); o preenchido na mão sempre pode revisar por cima.

## Tela 6 — Jornada

O passo a passo visual guiado pelo **catálogo de skills** (por fase do método): cada etapa mostra a skill, o estado (feita/pendente), e permite **rodar a skill dali mesmo** → a proposta volta pra sua revisão → aprovou, vira artefato registrado (lei nº 1). É onde o projeto anda etapa por etapa sem terminal.

## Tela 7 — Campanhas (o coração: 9 estágios com trava)

**"+ Nova campanha"** cria o plano e abre a trilha. Cada estágio só destrava quando o anterior cumpre a regra — os números viram cadeado até lá:

| # | Estágio | O que tem na tela | A trava (regra do código) |
|---|---|---|---|
| 1 | **Fundamentos** | os valores herdados do briefing (oferta, preço, público, temperatura, voz, URL de destino) + o que é DESTA campanha: objetivo (**Vendas/Cadastro**), **verba diária**, período | verba < R$20/dia = aviso e bloqueio: "O Estruturador bloqueia campanhas abaixo de R$20 por dia" |
| 2 | **Zelador** (gate bloqueante) | o checklist de tracking, item a item, cada um com Sim/Não **+ o campo "O que apareceu na tela?"** (evidência literal obrigatória): BM ativo · conta ativa · pixel disparando · CAPI ativo · compra deduplicada · domínio verificado · pagamento aprovado | todos os CRÍTICOS "Sim" com evidência = **OK**; só o domínio pendente = **PARCIAL** (segue); qualquer crítico falhando = **CRÍTICO** (trava tudo adiante) |
| 3 | **Briefista** | os ângulos do projeto (com nível de consciência) + **"Gerar bateria"** — a skill roda no app e devolve a proposta | precisa do gate 2 em OK/PARCIAL; a bateria só existe depois que VOCÊ aprova |
| 4 | **Curadoria** | a lista de finalistas + formulário pra adicionar (hook, copy, formato Feed/Reels 9:16) | **decisão 100% humana**: 2–3 finalistas, máximo 3; "o Estruturador não recebe itens fora desta lista" |
| 5 | **Estrutura** | o resumo do default sagrado (tipo, público amplo/frio + Advantage+, criativos, verba) + **"Gerar plano campo a campo"** (estruturador) | exige finalistas curados; "nenhuma publicação será executada" |
| 6 | **Criativos** | a Creative Factory dentro do app (gera o pacote criativo pra promover ao plano) | precisa da estrutura aprovada; o pacote precisa ser **aprovado** pra liberar o estágio 7 |
| 7 | **Subida manual** | o checklist final (estrutura ✔ tracking ✔ pacote ✔ + "nenhuma publicação automática disponível") e UM botão: **"Confirmar que publiquei na Meta"** | quem publica é VOCÊ no Gerenciador ([guia-campanha-no-ar](../04-operacao/guia-campanha-no-ar.md)); o app só registra a sua confirmação |
| 8–9 | **Leitura · Alavanca** | atalho pra aba **Semanas** (é lá que a operação semanal vive) | só depois da subida confirmada |

Se uma skill for barrada antes de rodar (pré-requisito faltando), o app diz O QUE falta e te leva pra tela certa (briefing/jornada) — mesma lógica das recusas no chat.

## Tela 8 — Semanas (o Painel da Semana visual)

Por campanha, semana a semana:
1. **Leitor de métricas:** tabela com cada métrica → valor · **selo** (`Real / Estimado / Não fornecido`) · fonte (Meta, checkout...) · "confirmado por humano" — e no ROAS o checkbox extra **"venda confirmada no caixa"**. Botão **"Confirmar leitura literal"** grava a leitura como artefato.
2. **Diagnosticador:** botão **"Rodar Diagnosticador"** → devolve hipótese + **alavanca ÚNICA** + critério de sucesso + critério de reversão → você **aprova ou rejeita**, com campo de observação do operador.
3. **Histórico append-only:** todos os eventos da semana, com data e autor — nada se apaga.
4. **Importar/Exportar** o `PAINEL-DA-SEMANA-{data}.yaml` — é o MESMO painel do fluxo por chat: dá pra levar e trazer entre o app e o terminal.

## Teste de sucesso

Suba o app, entre (demo serve), crie um projeto e uma campanha e percorra os estágios 1–2: se você entende por que o estágio 3 está com cadeado (e o que o destrava — o checklist do Zelador com evidência), você entendeu o Studio inteiro: **gates + proposta + aprovação humana**.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| ST1 | `npm run studio` falha / página não abre | Docker fechado, ou pasta errada | abra o Docker → rode DENTRO de `apps/academia-lendaria-ads-studio` do repo do Studio → recarregue |
| ST2 | Estágio de campanha com **cadeado** que "não abre" | é um gate de propósito (verba <R$20, zelador CRÍTICO, sem finalistas, pacote não aprovado...) | leia a coluna "trava" da tabela do estágio anterior — o cadeado abre cumprindo a regra, nunca clicando mais forte |
| ST3 | Banner de **simulação** apareceu | o executor local de skills não está conectado nesta sessão | as telas continuam navegáveis; pra rodar skill de verdade dali, suba o app pelo caminho completo — ou rode a skill equivalente no chat |
| ST4 | Skill barrada com aviso de pré-requisito | falta briefing/artefato que ela exige (mesma recusa que existiria no chat) | siga o link que o próprio aviso oferece (briefing/jornada) e complete o que falta |
| ST5 | "A tela que eu vi na aula era diferente" (wizard de 8 passos) | esse é o fluxo LEGADO — o app te mostra um aviso "etapa legada" com o botão pro fluxo atual | clique em "Ir para campanha unificada"; o fluxo atual é o dos 9 estágios deste guia |
| ST6 | Recurso deste guia **não aparece** na sua tela | versão anterior do app | `git pull` no repo do Studio → suba de novo; persistiu, print + PS |
| ST7 | Computador lento depois de usar | app rodando em segundo plano | `node scripts/marketing-studio.mjs stop` → fechar Docker → (Windows) `wsl --shutdown` |

> A qualquer momento, tudo tem o equivalente no chat: visão geral/jornada = `/status-funil` · gate 2 = `/zelador` · estágios 3–5 = `/briefista` + `/estruturador` · criativos = `/criativos-funil` ou factory · semanas = `/leitor-de-metricas` + `/diagnosticador`.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | suba o app e percorra o teste de sucesso (projeto → campanha → estágios 1–2) — 15 min e o painel vira mapa conhecido |
| 📖 Ler | a subida real da campanha é sua: [guia-campanha-no-ar](../04-operacao/guia-campanha-no-ar.md) · a leitura da semana: [guia-como-ler-os-numeros](../05-metricas/guia-como-ler-os-numeros.md) |
| 🚑 Se travar | o catálogo ST1–ST7 acima — e lembre a lei nº 3: tudo tem o comando equivalente no chat |
