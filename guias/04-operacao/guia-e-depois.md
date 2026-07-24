# GUIA — Campanha no ar... e DEPOIS? O que fazer?

> **Estou perdido em:** "subiu, está rodando. E agora, eu fico olhando? Mexo? Quando? No quê?"
> **A resposta curta (o que você vai ter no final):** dias 1–7 você NÃO mexe. Dia 7 você lê, decide UMA coisa e registra. Toda semana repete — e o `PAINEL-DA-SEMANA.yaml` vira o histórico que a Aula 4 usa. É isso.
> **Fontes cruzadas:** SKILL.md do `/leitor-de-metricas` e do `/diagnosticador` + circuit breaker (código real) · `aula-03/exemplos/painel-semana-exemplo.yaml` (repo) · referências de mercado reescritas (regra dos 7 dias, escala gradual, erros clássicos de otimização) · pedidos reais de PS ("uma alavanca por vez").

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📄 Artefato | Campanha ATIVA no Gerenciador (criada pelo default sagrado) | siga [guia-campanha-no-ar.md](guia-campanha-no-ar.md) |
| 📄 Artefato | `PAINEL-DA-SEMANA.yaml` do projeto com a subida registrada (data, verba, critérios de sucesso e reversão) | registre agora — é a seção "Registre" do [guia-campanha-no-ar.md](guia-campanha-no-ar.md) |
| 🔑 Chave | `META_ACCESS_TOKEN` no `.env` (OPCIONAL — sem ele o ritual funciona colando os números do Gerenciador) | quiser automatizar: [guia-meta-api.md](../03-conexoes-e-apis/guia-meta-api.md) |

## Dias 1 a 7 — NÃO MEXA (sério)

- Não edite copy, não troque público, não "dê uma ajustadinha", não pause "só pra ver". **Cada edição reseta o aprendizado da Meta** e você joga fora os dias já pagos.
- Pode (e deve): olhar o Gerenciador 1× por dia só pra confirmar que está **veiculando** e **gastando** (~R$30/dia). **Analisar ≠ otimizar** (referência de mercado): na olhada diária, só a veiculação e a métrica principal — decisão é só no dia 7. Não veiculou em 24–48 h? Aí sim investigue: anúncio reprovado (a Meta avisa no Gerenciador), pagamento recusado, ou campanha que não gasta (erro S2 abaixo).
- **A ÚNICA exceção (circuit breaker):** se o gasto passar de **2× o seu CPA-alvo com 0 conversões E o CTR estiver abaixo de 0,5%** → pode trocar criativo/ângulo antes do dia 7. Fora isso, mãos longe. *(Numa campanha fria, que é o seu caso, esse é o único gatilho; campanhas de remarketing morno/quente ganham um segundo, de saturação — assunto da Aula 4.)*

## Dia 7 — o ritual semanal (3 comandos, ~30 min)

1. **`/leitor-de-metricas`** — lê a semana. Com `META_ACCESS_TOKEN` no `.env`, puxa sozinho; sem, você copia os números do Gerenciador e cola. Toda métrica sai com selo: `Real` (confirmado), `Estimado` (plataforma — todo ROAS é Estimado) ou `não fornecido` (ausente ≠ zero). **Ele não opina — só lê.**
2. **`/diagnosticador`** — aponta **UMA alavanca** (nunca duas): a hipótese, o critério de sucesso e o critério de reversão. Exemplos do que ele pode apontar: trocar o criativo perdedor · ajustar a headline da página · nada a fazer, continue. **Você decide** se acata.
3. **Registre no `PAINEL-DA-SEMANA.yaml`**: o que leu, o que decidiu, o que espera. Nunca apague a semana anterior — o histórico é a memória do projeto.
   - **Nunca viu um preenchido? Veja o exemplo pronto:** `aula-03/exemplos/painel-semana-exemplo.yaml` (e a decisão semanal correspondente em `aula-03/exemplos/decisao-semanal-exemplo.md`). É assim que o seu deve ficar ao fim de cada semana — o template em branco que as skills reconhecem é o `.claude/skills/_shared/squad-trafego/painel-da-semana-tmpl.yaml` (copie-o para `projetos/{seu-slug}/trafego/PAINEL-DA-SEMANA.yaml`; ⚠️ há um template mais antigo em `aula-03/templates/` com outra estrutura — não use esse).

Depois da decisão: aplica a mudança (UMA), e recomeça o ciclo de 7 dias sem mexer.

## Teste de sucesso

No fim do dia 7, o seu `PAINEL-DA-SEMANA.yaml` tem: (1) as métricas da semana com selo Real/Estimado/não fornecido, (2) UMA decisão registrada com critério de sucesso E de reversão, (3) a semana anterior intacta (histórico append-only). Os três presentes = o ciclo está rodando do jeito certo — compare com o exemplo preenchido `aula-03/exemplos/painel-semana-exemplo.yaml`.

## Regras de bolso pra não se enganar

- **Menos de ~10 conversões na janela, nada de conclusão sobre CPA** (é o limiar que o leitor usa pra marcar `amostra_suficiente_para_cpa`); com 3 vendas não existe "criativo vencedor" — existe acaso. E escalar de verdade pede ~50 conversões/semana — conversa da Aula 4.
- **ROAS "bom" no Gerenciador ≠ dinheiro no bolso**: todo ROAS chega Estimado (atribuição da plataforma); só vira Real se você confirmar a venda no caixa. O caixa real é a Hotmart (Aula 4 cruza os dois).
- **Campanha morreu de vez** (reversão atingida)? Pause, e volte ao [guia-criativos.md](guia-criativos.md) com o que aprendeu: qual hook teve o melhor CTR? Esse ângulo é a semente da próxima.
- **Deu certo e quer aumentar a verba?** Suba **20–30% por vez**, no máximo 1× por semana — nunca dobre de um dia pro outro (escala brusca joga a campanha de volta pro aprendizado; referência de mercado).
- **Quer testar uma variação?** Duplique o VENCEDOR e mude UMA variável só — nunca mexa no original que está rodando (referência de mercado: muito dinheiro já se perdeu "melhorando" o original).

## Depois de 2–4 semanas de ciclo — feche o loop (Aula 4, modo simples)

Rode **`/analista-de-dados`** (um comando; ele orquestra tudo):
1. Coleta o histórico (com as chaves) ou roda em Modo Exemplo (sem).
2. Board de especialistas lê os números e dá vereditos.
3. Gera o `painel-trafego.html` — seu painel, abre offline.
4. `/retroalimentacao` devolve o que os dados ensinaram pro avatar e pra copy → a **próxima** campanha nasce melhor que a primeira. *(É o "brainstorm mensal de mercado" que gestor profissional faz na mão — aqui a IA faz pra você.)*
5. `/gestor-de-campanhas` — o hub te **oferece** essa etapa no final; aceite, pra comparar o que você planejou no PAINEL-DA-SEMANA com o que aconteceu (7/30 dias).

## O ciclo inteiro num parágrafo

Subiu (R$30/dia, 7 dias) → não mexeu → leu (`/leitor-de-metricas`) → decidiu UMA coisa (`/diagnosticador`) → registrou (PAINEL-DA-SEMANA) → repetiu → a cada mês, fechou o loop (`/analista-de-dados` + `/retroalimentacao`) → recomeçou melhor. Isso é gestão de tráfego. O resto é adaptação ao seu contexto.

## POSSÍVEIS ERROS — catálogo (os clássicos da semana 1)

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| S1 | Vontade de PAUSAR o anúncio campeão ("o CPA dele subiu um pouco hoje") | pânico com flutuação normal do dia | não pause: a Meta redistribui a verba pros anúncios PIORES e o custo geral SOBE (referência de mercado) — segure até o ritual do dia 7 |
| S2 | Campanha ativa que NÃO GASTA (ou gasta centavos) | público minúsculo (interesses/exclusões empilhados), evento de conversão que nunca disparou, ou teto de gasto da conta | 1) confira o limite de gastos (G7/F4); 2) confira o evento escolhido (está cinza/inativo?); 3) volte o público pro amplo do default; 4) persiste → leve pro `/diagnosticador` |
| S3 | "Achei um posicionamento MAIS BARATO — vou concentrar tudo nele" | CPM baixo ≠ resultado; concentrar encarece o conjunto inteiro (referência de mercado) | mantenha os posicionamentos Advantage+ automáticos; "barato" só vale se o CPA/ROAS do dia 7 confirmar |
| S4 | Mexeu "só uma ajustadinha" no dia 3 e os números pioraram | toda edição reseta a fase de aprendizado | pare de editar; deixe os 7 dias correrem de novo do zero; anote no PAINEL o que mexeu (o histórico explica a piora) |
| S5 | Dobrou a verba de um dia pro outro e o CPA explodiu | escala brusca reinicia o aprendizado | volte à verba anterior; quando subir de novo: +20–30% por vez, 1× por semana |

> Fora do catálogo? Print do Gerenciador + "estou nesta situação na semana X da campanha, o que o método manda fazer?" na conversa — e a resposta vira registro no PAINEL.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | anote no calendário o DIA 7 da sua campanha — o ritual são 3 comandos (~30 min): `/leitor-de-metricas` → `/diagnosticador` → registrar no PAINEL |
| 📖 Ler | fechando 2–4 semanas de ciclo: [guias de métricas (Aula 4)](../05-metricas/) — comece pelo [guia-o-que-e-coletado.md](../05-metricas/guia-o-que-e-coletado.md) |
| 🚑 Se travar | os clássicos da semana 1 → catálogo S1–S5 acima · campanha não veicula/rejeitada → G1–G9 do [guia-gerenciador](../02-conhecimento-minimo/guia-gerenciador-de-anuncios.md) · criativo morreu → [guia-criativos.md](guia-criativos.md) com o aprendizado da semana |
