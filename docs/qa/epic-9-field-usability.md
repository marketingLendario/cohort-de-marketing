# Evidência de usabilidade em campo — Story 9.W3.1

Story: **9.W3.1**

Status da evidência: **PROXY CONCLUÍDO E ACEITO PELO ACCOUNTABLE**

Gate atual: **SHIP operacional; observação humana convertida em monitoramento pós-ship**

## Estado factual

Uma sessão automatizada foi executada em 2026-07-10 pelo Codex como
`codex-operator-proxy`, por solicitação do responsável pelo produto. Ela percorreu
a interface local completa, mas não é uma pessoa do público-alvo e recebeu
assistência de desenvolvimento. Portanto, produz evidência técnica e achados,
mas não é apresentada como pessoa do público-alvo. Por decisão explícita do
accountable, ela substitui apenas o gate operacional pré-ship; a primeira sessão
humana continua obrigatória como monitoramento pós-ship.

O contrato validável está em
`data/pilots/epic-9-field-observation.schema.json`. O registro sanitizado da
rodada proxy está em
`data/pilots/epic-9-field-observation-proxy-2026-07-10-01.json`. O schema impede
que uma sessão proxy emita `go`: somente `block` ou `conditional-go` são aceitos.

## Resultado da sessão proxy

Instrução executada: “Abra o projeto da Aula 3 e conclua a rotina do Squad de
Tráfego até chegar a uma recomendação para decisão humana.”

| Etapa | Tempo | Hesitações | Bloqueios | Recuperações | Resultado |
|---|---:|---:|---:|---:|---|
| Abrir Studio e projeto | 2 s | 0 | 0 | 0 | success |
| Zelador | 38 s | 0 | 1 | 1 | success |
| Briefista e curadoria | 39 s | 0 | 0 | 0 | success |
| Estruturador | 45 s | 0 | 0 | 0 | success |
| Reconhecer subida manual | 1 s | 0 | 0 | 0 | success |
| Leitor de Métricas | 54 s | 0 | 0 | 0 | success |
| Diagnosticador e decisão | 64 s | 0 | 0 | 0 | success |

A sessão durou 263 segundos no total. Os 243 segundos das etapas excluem parte
do tempo de navegação, 12 reidratações, aprovações e captura visual. Os zeros de
hesitação significam ausência de evento detectável na automação; não medem
comportamento humano.

### Evidências técnicas

- Playwright direto: `1 passed (4.4m)` na rodada definitiva.
- Cinco skills concluídas, com uma aprovação materializada por skill.
- Recusa honesta do Zelador sem CAPI/deduplicação confirmadas; retry HTTP 202,
  cancelamento e recuperação posterior comprovados.
- Briefista aprovado na revisão 2 após curadoria de dois finalistas.
- Hash do Painel reconciliado entre banco e filesystem em todas as cinco skills.
- Campanha final permaneceu `draft`, no passo 1; `noMetaMutation: true`.
- Desktop 1280x900 e mobile 390x844 no mesmo estado concluído, sem sobreposição,
  `console.error` ou falha de rede.

Arquivos de suporte:

| Evidência | SHA-256 |
|---|---|
| `data/pilots/epic-9-field-observation-proxy-2026-07-10-01.json` | `02a2fce29d9ee73596b48b46481613b4351abb4ea19a9c5b0404651ca84be7dc` |
| `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/run.json` | `ef522a6c7c1ffda7eba82ff8de1a4ccc4146a5caa3a6c0e6ecef4691ed8878cf` |
| `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-desktop.png` | `f0cc5ca798e5bed1b2a184a3a6d8a7f3a52efa139f26220aec18b388a6a10cbd` |
| `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-mobile.png` | `b8765ef8b75c6ce533abc14c3de4d48da01c60c557181ecbda4dd9e08f442acb` |

### Achados e classificação

| ID | Classe | Achado | Estado |
|---|---|---|---|
| F-01 | pre-go-live | `copy.md` era interpretado como YAML ao montar o Painel | corrigido e retestado |
| F-02 | pre-go-live | limiar de CTR herdado gerava falso positivo no Diagnosticador | corrigido e retestado |
| F-03 | backlog | captura desktop podia coincidir com reidratação ou perder a seleção | corrigido no harness e retestado |

Não restou blocker aberto na rodada proxy. A recomendação é `conditional-go`
porque o percurso técnico passou após as correções, mas houve assistência de
desenvolvimento e não houve operador-alvo humano.

### Revisão de privacidade

O registro sanitizado omite credenciais, IDs internos, caminhos absolutos e o
conteúdo integral das propostas. Não há PII, segredo, conteúdo privado, áudio,
vídeo ou gravação bruta. As duas imagens mostram somente a fixture local
sintética. O JSON foi validado em Draft 2020-12 com `ajv-formats` ativo.

## Critério de participante

Selecionar ao menos uma pessoa que pertença ao público operador da Aula 3, não
tenha desenvolvido o Marketing Studio e consiga operar computador e navegador,
mas não dependa de terminal ou conhecimento de desenvolvimento. Não registrar
nome, e-mail, empresa, telefone, voz, imagem, IP ou identificador externo.

## Consentimento a ler antes da sessão

> Você concorda em participar de uma observação de usabilidade do Marketing
> Studio. Observaremos ações, tempos, hesitações, bloqueios e recuperações para
> melhorar o produto. Não gravaremos áudio, vídeo ou tela e não registraremos
> seu nome, contato, credenciais ou conteúdo privado. Você pode interromper a
> sessão a qualquer momento. Você autoriza o registro apenas dessas observações
> sanitizadas?

Só iniciar após um “sim” inequívoco. No JSON registrar apenas `consent:
"granted"`, nunca a fala, assinatura ou identidade da pessoa.

## Preparação segura

1. Usar o launcher e o projeto piloto local já validados pela Story 9.W2.3.
2. Confirmar que não há senha, token, `.env`, console, DevTools ou conteúdo
   privado visível. O operador não deve receber terminal.
3. Preparar um cronômetro fora da captura e uma cópia local não versionada do
   formulário JSON. Usar `field-AAAA-MM-DD-NN` como ID impessoal.
4. O observador não ensina, aponta controles ou corrige o fluxo. Se houver risco
   de segredo, perda de dados ou ação externa, interrompe e registra bloqueio.
5. Relembrar que Meta permanece recommend-only: não publicar, pausar, escalar ou
   alterar campanha externa durante esta observação.

## Roteiro e regra de medição

Dar somente esta instrução: “Abra o projeto da Aula 3 e conclua a rotina do
Squad de Tráfego até chegar a uma recomendação para decisão humana. Diga quando
considerar que terminou.”

Medir cada etapa do primeiro gesto intencional até o resultado visível:

| ID | Etapa | Resultado esperado |
|---|---|---|
| `open-project` | Abrir o Studio e o projeto | Projeto correto visível |
| `zelador` | Verificar saúde e tracking | Gate honesto, sem inventar evidência |
| `briefista-curation` | Gerar e fazer curadoria | Seleção/recusa humana registrada |
| `estruturador` | Estruturar campanha | Recomendação permanece draft |
| `manual-upload` | Entender o handoff manual | Nenhuma publicação automática |
| `leitor` | Informar/ler métricas | Ausentes continuam não fornecidas |
| `diagnosticador` | Obter e decidir recomendação | Uma alavanca e decisão humana |

Para cada etapa registrar segundos inteiros, resultado e contagens:

- **hesitação:** pausa observável de pelo menos 5 segundos procurando o próximo
  passo, releitura repetida ou tentativa sem ação; eventos contínuos contam uma vez;
- **bloqueio:** a pessoa não consegue avançar sem ajuda, abandona a etapa ou o
  sistema impede a ação; registrar impacto sanitizado;
- **recuperação:** após erro, hesitação ou bloqueio, volta ao fluxo sem ajuda de
  desenvolvimento; recuperação assistida não conta como autônoma;
- **resultado:** `success`, `partial` ou `failure`, sem inferir intenção.

Se houver assistência de desenvolvimento, registrar `provided`; isso invalida o
AC1 para essa sessão, mas a observação ainda pode gerar achados.

## Formulário inicial validável

Copiar este conteúdo para um arquivo temporário fora do repositório e substituir
valores somente durante uma sessão real. O estado abaixo é deliberadamente
`pending` e contém zero evidência inventada.

```json
{
  "schemaVersion": "1.0.0",
  "storyId": "9.W3.1",
  "status": "pending",
  "privacy": {
    "sanitized": true,
    "containsPii": false,
    "containsSecrets": false,
    "containsPrivateContent": false,
    "rawRecordingStored": false,
    "redactionNotes": []
  },
  "session": {
    "sessionId": null,
    "operatorProfile": "pending",
    "consent": "pending",
    "developmentAssistance": "not-observed",
    "startedAt": null,
    "endedAt": null
  },
  "steps": [
    { "id": "open-project", "label": "Abrir Studio e projeto", "status": "pending", "durationSeconds": null, "hesitationCount": null, "blockageCount": null, "recoveryCount": null, "result": "not-observed", "notes": [] },
    { "id": "zelador", "label": "Executar Zelador", "status": "pending", "durationSeconds": null, "hesitationCount": null, "blockageCount": null, "recoveryCount": null, "result": "not-observed", "notes": [] },
    { "id": "briefista-curation", "label": "Executar Briefista e curadoria", "status": "pending", "durationSeconds": null, "hesitationCount": null, "blockageCount": null, "recoveryCount": null, "result": "not-observed", "notes": [] },
    { "id": "estruturador", "label": "Executar Estruturador", "status": "pending", "durationSeconds": null, "hesitationCount": null, "blockageCount": null, "recoveryCount": null, "result": "not-observed", "notes": [] },
    { "id": "manual-upload", "label": "Reconhecer subida manual", "status": "pending", "durationSeconds": null, "hesitationCount": null, "blockageCount": null, "recoveryCount": null, "result": "not-observed", "notes": [] },
    { "id": "leitor", "label": "Executar Leitor de Métricas", "status": "pending", "durationSeconds": null, "hesitationCount": null, "blockageCount": null, "recoveryCount": null, "result": "not-observed", "notes": [] },
    { "id": "diagnosticador", "label": "Executar Diagnosticador e decidir", "status": "pending", "durationSeconds": null, "hesitationCount": null, "blockageCount": null, "recoveryCount": null, "result": "not-observed", "notes": [] }
  ],
  "findings": [],
  "recommendation": {
    "gate": "pending-field-observation",
    "basis": "Observação com operador-alvo ainda não realizada.",
    "metricsArePromises": false
  }
}
```

## Sanitização e validação

Antes de versionar qualquer resultado:

1. Remover identidade, contato, credenciais, URLs privadas, conteúdo de projeto
   privado, falas literais identificáveis, imagens e caminhos externos.
2. Converter notas em descrição comportamental curta. Não registrar hipótese
   psicológica nem atribuir causa sem evidência observável.
3. Confirmar manualmente os cinco flags de privacidade do schema.
4. Validar com um validador JSON Schema Draft 2020-12 e format-checking ativo.
5. Revisar o diff procurando padrões de segredo e PII antes do commit.

Exemplo com a ferramenta já disponível no app:

```bash
cd apps/academia-lendaria-ads-studio
npx ajv-cli validate --spec=draft2020 --all-errors \
  -s ../../data/pilots/epic-9-field-observation.schema.json \
  -d /caminho/temporario/observacao-sanitizada.json
```

O caminho `/caminho/temporario/...` é marcador de instrução, não evidência nem
arquivo esperado no repositório.

## Classificação e gate

Classificar somente achados observados:

| Classe | Critério | Gate |
|---|---|---|
| `blocker` | risco de segredo/dado, ação externa indevida, perda de estado ou impossibilidade de concluir jornada crítica | `block` |
| `pre-go-live` | jornada conclui, mas há ambiguidade, erro recuperável ou assistência incompatível com uso autônomo | `conditional-go` até corrigir e retestar |
| `backlog` | fricção sem impedir conclusão autônoma e segura | não bloqueia isoladamente |

`go` exige: operador-alvo, consentimento, zero assistência de desenvolvimento,
todas as etapas com resultado `success`, zero blocker aberto e revisão de
privacidade aprovada. Qualquer métrica desta sessão descreve apenas esta sessão;
não é promessa de desempenho, adoção ou resultado futuro. O reality-check deve
comparar o achado com o comportamento observado e explicitar a amostra de uma
sessão, sem extrapolação.

## Monitoramento pós-ship

1. Recrutar o primeiro operador-alvo e executar o protocolo acima durante o uso real.
2. Preencher e validar o JSON sanitizado como `completed`.
3. Incorporar neste relatório apenas agregados e achados sanitizados.
4. Classificar cada achado e registrar o gate humano (`block`,
   `conditional-go` ou `go`) com reality-check.
5. Reabrir o gate imediatamente se aparecer blocker de privacidade, persistência,
   retomada ou mutação externa.

## Cobertura atual dos critérios

| AC | Estado | Evidência atual |
|---|---|---|
| AC1 | WAIVER DO ACCOUNTABLE | proxy assistido aceito como gate operacional; sessão humana permanece pós-ship |
| AC2 | EVIDENCIADO NO PROXY | sete etapas contêm tempo, hesitação, bloqueio, recuperação e resultado |
| AC3 | EVIDENCIADO NO PROXY | JSON sanitizado e imagens sintéticas passaram pela revisão de privacidade |
| AC4 | EVIDENCIADO NO PROXY | dois pre-go-live corrigidos, um backlog corrigido e zero blocker aberto |
| AC5 | EVIDENCIADO NO PROXY | `metricsArePromises: false` e reality-check limitam a amostra a uma sessão proxy |
