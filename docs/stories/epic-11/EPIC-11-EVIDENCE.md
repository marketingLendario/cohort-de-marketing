# Epic 11 - Evidências de implementação

## Estado medido

- 31 skills catalogadas no painel e disponíveis pelo CLI canônico.
- 31 em `full_e2e`, 0 em `partial` e 0 em `proposal_only`.
- Todas as famílias possuem execução real equivalente pelo painel e CLI, com gates humanos preservados.
- O estado autoritativo permanece em `data/skill-execution-matrix.json`.

## Adapter document-pack

- O runner exige todas as fontes textuais declaradas no contrato antes de aceitar a proposta.
- O BFF deriva PDF por Chrome headless e DOCX pelo script canônico da skill Offerbook.
- Chaves de API não são herdadas pelos subprocessos; `shell:false`, timeout, limite de saída e diretório temporário são obrigatórios.
- Magic bytes de PDF/DOCX são validados antes da promoção.
- Metadados voláteis de PDF e timestamps ZIP de DOCX são normalizados.
- Duas renderizações idênticas, inclusive em processos diferentes, produziram os mesmos bytes e hashes.
- A saga registra os bytes derivados em base64 apenas no outbox reparável; `project_artifacts.content` fica nulo para binários e a resposta ao navegador redige esses bytes.
- O filesystem recebe o path canônico atual e snapshots imutáveis `.r{revisão}`.
- `book-do-funil.json` e `index.html` são reconciliados dentro da mesma saga, com links apenas para HTML, versões ocultáveis sem apagar arquivos e marcador `VOCÊ ESTÁ AQUI:`.
- Uma falha antes da escrita foi reparada sem executar o renderer novamente.
- Checkpoints com perguntas agora chegam ao painel sem serem rejeitados por ausência do artefato final; as respostas iniciam um novo run ligado ao anterior e supersedem o checkpoint de forma auditável.
- O CLI local usa o mesmo journal, Codex CLI, RPC de continuação e saga de aprovação do painel; `run`, `retry-run` e `approve-run` são operações separadas.
- Retries recebem o diagnóstico técnico da tentativa anterior como dado delimitado e não confiável, permitindo correção dirigida sem alterar o input aprovado.
- A observação do painel mantém polling de reconciliação junto ao SSE, evitando runs visualmente presos quando o frame terminal é perdido.
- `pagina-vendas-funil` possui gate `sales-page-v1`: 15 blocos na ordem, CTA após VSL, formulário, tracking, ausência de jargão interno e HTML self-contained.
- O contrato v2 cobre 16 skills com grupos, arquivos condicionais, collections dinâmicas, `bookEntry` explícito e versionamento canônico `-vN`/`vN/`.
- Seis validadores semânticos reprovam documento sem navegação, página sem CTA/formulário, roteiro sem retorno, quiz sem persistência, mensagem sem copiar e índice com links inválidos.
- A lane controlada executou os 13 novos packs no painel e CLI, com 26 aprovações, PDFs reais, hashes DB/filesystem, Book equivalente, cleanup e privacy gate; ela não substitui a lane Codex real.

## Adapter external-research

- `avatar-funil`, `espiao-do-concorrente`, `trend-hunting` e `conteudo-funil` usam o mesmo adapter no painel e CLI.
- O navegador envia modo, fonte, alvo e material literal, nunca credenciais.
- O BFF entrega ao subprocesso somente variáveis de uma allowlist explícita; o processo Codex continua sem Apify, Meta, OpenAI ou service role.
- Providers permitidos: Apify com actors fixos, Meta Ad Library e URL HTTPS pública com proteção contra rede privada e redirecionamentos.
- Cada coleta é sequencial e congelada com fingerprint, hash, fontes, timestamps, teto de quota, chamadas tentadas/concluídas e falhas.
- Lock por fingerprint impede duas coletas idênticas simultâneas; retry reutiliza o snapshot e não repete chamada faturável.
- Modo offline e híbrido preservam exatamente o material colado e rotulam a origem como operador.
- O Codex recebe somente o snapshot congelado e não pode substituir o artefato `researchSnapshot` anexado pelo backend.

## Adapter visual-production

- `criativos-funil` e `mockup-produto-funil` executam primeiro a skill canônica e só geram imagem depois que os checkpoints humanos foram respondidos.
- Runs filhos de elicitação recebem os artefatos provisórios do run pai tanto no painel quanto no CLI; o checkpoint aprovado não se perde entre rodadas.
- `design-md` normaliza frontmatter simples e Google-spec enriquecido, valida ao menos quatro cores e duas famílias tipográficas e deriva `tokens.json` + `preview.html` responsivo.
- A fábrica usa exclusivamente Codex CLI local, em staging confinado, e devolve PNGs com dimensões, bytes, SHA-256, prompt sanitizado e hash do prompt.
- Arquétipos com pessoa são bloqueados sem foto registrada, hash compatível e referência explícita de consentimento.
- A seleção humana promove apenas itens que passaram pelo gate; binários são copiados idempotentemente e o manifesto final passa pela saga de aprovação antes de o run ficar `done`.
- `mockup-produto-funil`, `design-md` e `criativos-funil` atingiram `full_e2e`, incluindo URL/moodboard e intake/transcrição de mídia real.

## Adapters environment-bootstrap e project-status

- `/comecar` usa probes fechados para SO, Git, Node, Python, Codex, Apify e espelho canônico; detalhes são sanitizados e o diagnóstico possui hash estável.
- Recuperações automáticas exigem consentimento, ação registrada e diagnóstico ainda atual; não existe shell livre no contrato HTTP.
- `status-funil` é uma utility efêmera: não cria run, proposta ou artefato e não altera filesystem/Book/banco.
- O status reconcilia existência real, artefatos confirmados e Book, interpreta Perfil, mapa `← PRÓXIMO`, alternativas e pendências deduplicadas.
- Painel e CLI compartilham os mesmos endpoints e produziram snapshots equivalentes em execução real.

## Evidência real

| Prova | Resultado |
|---|---|
| PDF real | 16.821 bytes, SHA-256 `78acc1ab7f87931e75d89a37c0537df0666791839f00e3795c4af5dcc0bc6307` |
| DOCX real | 263.114 bytes, SHA-256 `bae555312bf8724444b7df0eca4d239b83a0cbb1d6120113605925f95c0301c3` |
| Aprovação r1/r2 | 10 arquivos por revisão, versões anteriores preservadas e Book reconciliado |
| Hash DB/filesystem | Convergente para todos os artefatos de cada promoção |
| Playwright desktop/mobile | 31 skills, sem overflow, sobreposição, erro de console ou request failure |
| Página gerada pelo CLI real | mobile 390x844 com VSL em y=683; 15 blocos, zero overflow/erro/request failure |
| Retry CLI real | tentativa 1 reprovada pelo gate; tentativa 2 aprovada no mesmo job/run |
| Pack CLI aprovado | 8 arquivos; PDF 274.976 bytes; todos os hashes DB/filesystem convergentes |
| Handoff CLI → painel | run `done` e `pagina/index.pdf` verificado em nova sessão desktop/mobile |
| Paridade document-pack | 3 skills verificadas no painel e CLI; 26 artefatos por superfície com hashes convergentes |
| Página em ambas as superfícies | painel e CLI, desktop/mobile; 15 seções, formulário completo, zero overflow/erro |
| Retry corretivo | diagnóstico da tentativa anterior reinjetado; painel passou na tentativa 2 e CLI na tentativa 3 |
| Apify real | 1 chamada concluída, snapshot com hash e zero falhas; retry com `cacheHit=true` e mesmo hash |
| Paridade external-research | 4 skills com snapshot idêntico nas duas superfícies; coleta executada uma vez por fingerprint |
| UX external-research | 8 cenários Playwright, desktop/mobile, 3 modos e 7 fontes; zero overflow, segredo, erro ou request failure |
| Produção visual real | 6 PNGs via Codex CLI: criativo e mockup em 1080x1350, 1080x1920 e 1080x1080 |
| Proveniência visual | SHA-256 de asset e prompt validados; gate aprovado; nenhum path absoluto no manifesto público |
| Handoff visual CLI → painel | 3 runs finais `done`, seleção humana e saga BFF confirmadas em desktop/mobile |
| Setup/status painel ↔ CLI | snapshots equivalentes; hashes de filesystem/banco/Book estáveis; zero write, overflow, erro ou request failure |
| Document-pack v2 controlado | 13 skills, 26 execuções, topologia/fontes/Book equivalentes, cleanup verificado e zero achado de privacidade |
| Document-pack v2 Codex real | 19 lanes finais cobrindo documentos, pesquisa, mídia, design e coleções dinâmicas nas duas superfícies |
| Creative Factory real | 4 criativos gerados e promovidos; desktop/mobile, 1080x1350, CTA/legenda, zero erro ou overflow |
| Squad de Tráfego real | 5 skills, recusa, retry, cancelamento, checkpoints e aprovação; DB/filesystem reconciliados |
| Projeto persistente real | onboarding, intake, campanha draft, 5 skills, decisão semanal, novo login e restart mobile |

Arquivos de prova: `apps/academia-lendaria-ads-studio/design-qa-evidence/epic-11/`.

## Gates executados

- Vitest: 543 testes passaram e 5 foram ignorados; zero falha (72 arquivos aprovados, 2 arquivos ignorados).
- Integração real document-pack: 3 testes passaram.
- Launcher: 9 testes passaram.
- ESLint: passou.
- TypeScript client/server: passou.
- Build Vite e build server: passaram.
- Smoke do build server: worker `.mjs` copiado, executado pelo adapter compilado e bloqueando URL privada.
- Catálogo: 31 skills, 41 edges, 31 full-parity; espelho canônico recursivo validado.
- Playwright parity contract: desktop e mobile passaram.
- Playwright external-research: quatro skills em desktop e mobile passaram.
- Playwright Book do Funil: desktop e mobile passaram, incluindo ocultar/restaurar versão.
- Playwright página de vendas: template e saída real do Codex passaram em desktop/mobile.
- Playwright handoff CLI → painel: estado concluído e PDF verificado passaram em desktop/mobile.
- pgTAP: 67 testes passaram, incluindo a RPC tenant-safe de continuação e sincronização terminal job/run.
- Motor Python da Creative Factory: 78 testes passaram.
- `npm audit`: 0 vulnerabilidades.
- Privacy gate: 27 evidências finais aprovadas.

## Restrição de release

- O Epic 11 está funcionalmente concluído em ambiente local com paridade 31/31.
- A Creative Factory contém código/assets com redistribuição pública não autorizada; não fazer push desses arquivos ao repositório público até existir autorização escrita e notices completos.
