# EPIC-10 - Creative Factory real no Marketing Studio

## Status

ImplementedLocalReleaseBlocked

## Objetivo

Integrar ao Marketing Studio o motor `ads-creative-factory` amadurecido no
`sinkra-hub`, preservando o Codex CLI local, a revisão humana e os boundaries de
segurança já entregues. A Tela de Criativos deixa de simular imagens estáticas e
passa a produzir, revisar, versionar e empacotar imagens e legendas reais.

## Escopo

- Portar o motor para `.claude/skills/ads-creative-factory/` e refletir o mesmo
  conteúdo em `.agents/skills/ads-creative-factory/`.
- Executar geração pelo Codex CLI autenticado localmente, sem chave OpenAI.
- Transformar finalistas do Briefista em campanha da fábrica com headline,
  legenda, descrição de link, CTA, formatos, arquétipos e variantes.
- Reusar o journal durável de jobs para progresso, cancelamento, retry e retomada.
- Manter imagens geradas como propostas até aprovação humana explícita.
- Promover somente peças aprovadas para o pacote final do projeto.
- Entregar PNGs, manifesto e `legendas.md`, todos rastreáveis por lote.
- Integrar a fábrica à campanha unificada entre Estrutura e Subida manual.

## Fora de escopo

- Publicar, pausar ou alterar campanhas na Meta.
- Gerar ou substituir likeness de pessoa sem foto real fornecida.
- Aceitar caminhos absolutos ou saída fora das raízes locais autorizadas.
- Declarar as demais skills do Cohort como E2E sem suas matrizes próprias.

## Invariantes

1. O navegador nunca recebe token local, chave de API ou caminho absoluto.
2. O subprocesso recebe somente ambiente allowlisted e autenticação da sessão Codex.
3. A geração ocorre em lote versionado e não sobrescreve versão aprovada.
4. Somente itens com gate aprovado e decisão humana entram no pacote final.
5. Caption, link description, headline, CTA e imagem permanecem associados.
6. Cancelamento encerra a árvore Python/Codex e mantém estado tratável.
7. A campanha permanece `draft` até confirmação manual externa ao sistema.

## Stories

| Story | Entrega | Status |
|---|---|---|
| 10.W1.1 | Portabilidade da skill e assets | Done local / publicação bloqueada |
| 10.W1.2 | Runner seguro, manifesto e promoção | Done |
| 10.W2.1 | Tela real de criativos e integração da campanha | Done |
| 10.W3.1 | E2E real, QA visual e gate de go-live | Done |

## Gate de conclusão

O epic só pode ficar `Done` após um lote real gerado via `image_gen`, retomado
pela interface, aprovado parcialmente e empacotado com hashes, PNGs e legendas,
em desktop e mobile, sem segredo/path absoluto e sem mutação Meta.

O gate funcional local foi atendido. A publicação permanece bloqueada pelos
direitos de redistribuição registrados em `EPIC-10-EVIDENCE.md`.
