# QA — Onboarding e recuperação do aluno

Story: **9.W3.2**  
Status: **PASS**  
Data: **2026-07-10**

## Jornada entregue

O primeiro acesso, a criação do primeiro projeto, a entrada de materiais e a
próxima ação agora formam uma sequência contínua. A interface usa nomes de
tarefa e não apresenta comandos, configuração, banco de dados ou formatos
internos ao aluno.

## Recuperações cobertas

| Bloqueio observado | Resposta na própria tela |
|---|---|
| Nenhum projeto criado | Convite “Começar meu projeto”, com foco direto no nome |
| Falha ao criar projeto | Nome preservado e botão “Tentar novamente” |
| Nenhuma pasta encontrada | Orientação curta e “Procurar novamente” |
| Pasta com arquivo privado | Explicação segura, sem revelar detalhes internos, e nova tentativa |
| Materiais alterados durante revisão | Pedido para revisar novamente antes de confirmar |
| Serviço local indisponível | Orientação por tarefa e “Verificar novamente” |
| Estado exige reabertura | Instrução para reabrir pelo mesmo atalho de início |

## Checklist de aceite

- [x] Fluxo principal tem uma próxima ação explícita em cada etapa.
- [x] Falhas preservam o trabalho já digitado.
- [x] Nenhum comando interno, YAML ou jargão técnico aparece nas superfícies alteradas.
- [x] Diálogo de estado recebe foco e devolve foco ao fechar com Escape ou clique externo.
- [x] Layout mobile empilha campos e mantém alvos de toque de pelo menos 44 px nas recuperações.
- [x] Testes focados, lint e typecheck.
- [x] Inspeção visual desktop e mobile com Playwright.

## Evidência executada

- 15 testes focados em primeiro acesso, login, projetos, retries por etapa, conflito de manifesto, próxima ação e linguagem do estado do sistema: PASS.
- ESLint: PASS.
- TypeScript client/server: PASS.
- Playwright direto em `1280x900` e `390x844`: conteúdo presente, sem overlay,
  sem erro de página e sem overflow horizontal.
- O servidor visual foi iniciado em modo demonstrativo sem o serviço de apoio;
  as respostas esperadas `502` da verificação de estado foram convertidas pela
  própria interface no caminho “Verificar novamente”. Não houve outro erro de console.
- Capturas locais: `/tmp/story-9-w3-2-evidence/desktop-readiness.png` e
  `/tmp/story-9-w3-2-evidence/mobile-readiness.png`.

## Revisão independente

O review pós-merge encontrou que o CTA de recuperação da importação sempre
recarregava as pastas. O fluxo agora repete o preview ou a confirmação conforme
a etapa que falhou. Conflito de manifesto volta ao preview para obter o hash
atual usando o código estável `manifest-stale`; falha transitória de confirmação
mantém a revisão e repete a confirmação, sem inferência pelo texto da mensagem.

A inspeção do launcher integrado também eliminou os últimos nomes de
infraestrutura do painel de estado. Todos os checks oficiais agora aparecem
como tarefas do Marketing Studio, inclusive no mobile.
