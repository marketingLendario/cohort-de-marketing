# GUIA GERENCIADOR DE ANÚNCIOS — tudo que você precisa saber da ferramenta

> **Estou perdido em:** "abri o Gerenciador e não sei onde estou, o que cada status significa, nem que números olhar".
> **O que você vai ter no final:** você navega o Ads Manager sem medo — sabe onde cada coisa fica, o que cada status quer dizer, que colunas configurar e o que NUNCA tocar.
> **Fontes:** Gerenciador real (`adsmanager.facebook.com`) · método do curso (default sagrado + regra dos 7 dias) · Central de Ajuda da Meta · pesquisa web 22/07 (análise travada >48 h, conta restrita ao publicar — Central de Ajuda + blogs de tráfego BR) · referências de mercado reescritas. Conceitos dos termos: [guia-conceitos-trafego.md](guia-conceitos-trafego.md).

---

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | Você sabe o que é BM, conta de anúncios, pixel, campanha/conjunto/anúncio | leia [guia-conceitos-trafego.md](guia-conceitos-trafego.md) (15 min) |
| 🔑 Conta | Fundação pronta: conta de anúncios ativa (sem ela não há Gerenciador) | siga [guia-meta-fundacao.md](../03-conexoes-e-apis/guia-meta-fundacao.md) |
| 🧰 Ferramenta | `adsmanager.facebook.com` aberto do lado deste guia (é um tour guiado — clique junto, ~10 min) | faça login no perfil que é admin do BM |

## 1. Entrar e se localizar (o mapa da tela)

1. `adsmanager.facebook.com` → **primeiro reflexo SEMPRE: conferir o seletor de conta** no topo esquerdo (quem tem acesso de agência vê várias contas — metade dos "cadê minha campanha?!" é conta errada selecionada).
2. A tela tem **3 abas-andares** (a hierarquia): **Campanhas → Conjuntos de anúncios → Anúncios**. Clicar no NOME de uma campanha "entra" nela (as outras abas passam a mostrar só o conteúdo dela — repare no filtro azul que aparece em cima; clique no X do filtro pra "sair").
3. **Seletor de período** (topo direito): os números mostrados são SÓ do período selecionado. Segunda regra de ouro: antes de ler qualquer número, confira o período ("Últimos 7 dias" pro ritual semanal; "Máximo" pro histórico).
4. **Toggle azul** ao lado de cada nome = liga/desliga (Ativo/Pausado). É o botão mais importante e o mais perigoso — pausar reseta ritmo; use só nas situações do método.
5. Passar o mouse sobre o nome revela os atalhos: **Ver gráficos · Editar · Duplicar**. "Duplicar" é como você cria variações sem recomeçar do zero.

## 2. Os STATUS — o que cada um significa (e o que fazer)

| Status | Significa | Ação |
|---|---|---|
| **Em análise** | a Meta está revisando (minutos a ~24 h) | esperar. Não editar (reinicia a análise) |
| **Ativo** | rodando e gastando | seguir o método: 7 dias sem mexer |
| **Pausado** (toggle cinza) | desligado por você | religar quando quiser |
| **Programado** | aguardando a data de início | nada |
| **Rejeitado** | reprovou na política de anúncios | ler o motivo (e-mail + aviso no anúncio) → corrigir OU **"Solicitar outra análise"** (Account Quality) se achar injusto — muita rejeição é automática e cai na revisão |
| **Aprendizado** | fase de calibragem do algoritmo | normal nos primeiros dias — NÃO mexa |
| **Aprendizado limitado** | poucas conversões pra calibrar (evento raro/verba baixa) | não entre em pânico na semana 1; se persistir semanas: assunto do `/diagnosticador` (evento mais frequente ou verba maior) |
| **Veiculação com problemas / Não veiculando** | algo trava a entrega (pagamento, público pequeno, rejeição parcial) | abrir o aviso vermelho e seguir o que ele diz |
| **Limite de gastos atingido** | teto da conta/campanha bateu | Configurações de pagamento → ajustar limite |

## 3. As COLUNAS — configurar uma vez, ler pra sempre

Padrão "Desempenho" esconde o que importa. Configure a sua visão:
1. Botão **"Colunas: Desempenho" → "Personalizar colunas"**.
2. Monte com estas (as 8 do Painel da Semana): **Veiculação · Gasto · Impressões · CTR (taxa de cliques no link) · CPM · Resultados · Custo por resultado (CPA) · Frequência**. *(ROAS de compra se o evento for Purchase — lembrando: é atribuição, Estimado.)*
3. **"Salvar como predefinição"** com um nome (ex.: `Cohort`) → vira 1 clique pra sempre.
4. ⚠️ Pegadinha clássica: "Cliques (todos)" ≠ **"Cliques no link"** — o primeiro conta like/comentário/foto; o CTR que importa é **no link**.
5. Menu **"Detalhamento"** (ao lado de Colunas): quebra os números por idade, gênero, região, posicionamento, dia — é onde você VÊ quem está respondendo (a Aula 4 automatiza isso).

## 4. Onde ficam as outras telas que você vai precisar

| O quê | Onde |
|---|---|
| **Pagamentos/faturas** | menu ☰ (canto sup. esquerdo) → Cobrança/Configurações de pagamento |
| **Events Manager (pixel)** | menu ☰ → Gerenciador de Eventos |
| **Account Quality (rejeições/restrições)** | `facebook.com/accountquality` |
| **Regras automatizadas** | menu ☰ → Regras (NÃO usar no método — decisão é sua+diagnosticador) |
| **Preview do anúncio** | passar o mouse no anúncio → Visualizar (vê Feed/Stories/Reels) |
| **Exportar dados** | botão Exportar (topo direito) — CSV pra colar no `/leitor-de-metricas` sem API |

## 5. O que VOCÊ vai fazer no Gerenciador neste curso (e SÓ isso)

1. Conferir conta e período (sempre).
2. Subir a campanha do default sagrado ([guia-campanha-no-ar](../04-operacao/guia-campanha-no-ar.md)) — ou só REVISAR a que o `/estruturador` criou pausada via API. Dica que evita dor futura: **nomeie a campanha com a DATA** (`[MARCA] Oferta X - Vendas - 2026-07`) — daqui a 3 meses você agradece (referência de mercado: "esqueci a data e fiz besteira").
3. Ativar/pausar pelo toggle nos momentos do método (ativação pós-revisão; pausa por reversão/circuit breaker).
4. Ler as 8 colunas no dia 7 (ou exportar CSV pro leitor).
5. Solicitar outra análise quando rejeitar injustamente.
**E o que NÃO fazer:** editar campanha ativa fora do ritual · criar campanha por "Impulsionar" · ligar regras automatizadas · duplicar dez variações por ansiedade · confiar em "Cliques (todos)".

## Teste de sucesso
Você consegue, em menos de 1 minuto: achar a conta certa → setar "Últimos 7 dias" → aplicar a predefinição de colunas `Cohort` → dizer o status e o gasto de cada campanha. Conseguiu = pronto pra Aula 3.

## POSSÍVEIS ERROS

| # | Sintoma | Causa | O que fazer |
|---|---|---|---|
| G1 | "Minha campanha SUMIU" | conta errada no seletor, filtro ativo, ou período curto demais | conferir seletor → limpar filtros (X no topo) → período "Máximo" |
| G2 | Números daqui ≠ números do painel/planilha | período diferente, atribuição diferente, fuso da conta | iguale o período; lembre: Gerenciador = atribuição da Meta (Estimado), caixa = Hotmart |
| G3 | Anúncio **Rejeitado** | política (promessa de resultado, antes/depois, atributos pessoais "você está acima do peso") | ler o motivo → ajustar copy/criativo → ou "Solicitar outra análise" no Account Quality (rejeição automática erra bastante) |
| G4 | **Aprendizado limitado** eterno | evento raro (Purchase caro) + verba baixa | semana 1: ignore — 1–2 conjuntos limitados é NORMAL; se TODOS estiverem limitados, o problema é verba/estrutura (referência de mercado); persistindo: leve pro `/diagnosticador` — nunca resolva editando todo dia |
| G5 | "Em análise" há mais de 24–48 h | fila da Meta; edição no meio reiniciou a análise; ou a Meta está revisando também a PÁGINA de destino do anúncio (faz parte da análise, não só o criativo) | não edite (reinicia); confira que a URL de destino abre; passou de ~2 dias úteis → Account Quality → suporte da Meta com print |
| G6 | Coluna que você via sumiu | predefinição voltou pro padrão | aplicar sua predefinição salva (passo 3.3) |
| G7 | Não consegue ativar: aviso de pagamento | cartão recusado/limite (ver F5 do guia-fundação) | Configurações de pagamento → resolver → o aviso some |
| G8 | Gasto passou do diário num dia | normal: a Meta flutua até ~25% no dia (compensa na semana) | só agir se a MÉDIA semanal estourar o combinado |
| G9 | **Conta RESTRITA na hora de publicar a 1ª campanha** ("restringimos sua conta de anúncios") | antifraude da Meta com conta/atividade nova, ou suspeita de violação de política | 1) NÃO crie outra conta (vira padrão de evasão — mesmo espírito do F1); 2) `facebook.com/accountquality` → leia o motivo exato → **"Solicitar análise"** (revisão manual; horas a dias); 3) confira o e-mail cadastrado (a Meta manda o detalhe por lá); 4) complete verificação de identidade/empresa se pedida ([guia-meta-fundacao](../03-conexoes-e-apis/guia-meta-fundacao.md) passo 5); 5) aprovou → comece com verba baixa e constante |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | monte e salve a predefinição de colunas `Cohort` (seção 3) — é 1× na vida e você usa toda semana |
| 📖 Ler | ainda sem token/pixel? [guia-meta-api.md](../03-conexoes-e-apis/guia-meta-api.md) primeiro. Tudo conectado? [guia-criativos.md](../04-operacao/guia-criativos.md) → [guia-campanha-no-ar.md](../04-operacao/guia-campanha-no-ar.md) |
| 🚑 Se travar | o catálogo G1–G9 acima (campanha "sumiu", rejeição, aprendizado limitado, conta restrita...) |
