---
name: conteudo-funil
description: "Modela os Reels virais de um criador de referência e gera roteiros de conteúdo na SUA voz (ou na voz da sua marca). Pipeline: coletar Reels com uma ferramenta de scraping de Instagram à sua escolha (vídeo + métricas reais) -> baixar -> transcrever -> analisar hooks/estrutura/viralização -> amostra -> gerar roteiros na sua voz -> exportar. Use quando quiser criar conteúdo orgânico modelado em um criador de referência, ou roteiros de Reels para o seu negócio a partir de uma referência do Instagram. Método de conteúdo baseado em modelagem de criadores (autoria Alan Nicolas)."
user_invocable: true
---

# Criação de Conteúdo Modelado (referência → a SUA voz)

Pega os Reels virais de um criador de referência e gera roteiros de conteúdo na SUA voz (ou na voz da sua marca), para o seu negócio.

> **Skill irmã:** `/criativos-funil` é para ADS pagos (Biblioteca de Anúncios). Esta é para CONTEÚDO ORGÂNICO (Reels de criador → conteúdo na sua voz).

## Ativação
1. Defina qual criador de referência (@username do Instagram) e qual a VOZ/alvo.
2. Confira a afinidade: a referência deve ser um player grande que viraliza, com afinidade temática com o seu nicho.

## A SUA voz (serve para você e para a sua marca)
Escolha a voz conforme o tema da referência e o alvo. O conteúdo é gerado na SUA voz — a voz que representa você ou a sua marca. Calibre a voz em transcrições reais suas (falas, lives, vídeos que você já gravou), nunca em uma descrição genérica. Case o TEMA da referência com a voz/posicionamento certo (ex.: referência de mentalidade → tom mais reflexivo; referência de tráfego → tom mais técnico).

## Execução (resumo)
1. **Coletar** — rode um scraper de Reels com a ferramenta de scraping de Instagram da sua escolha (use a sua própria conta/token; traz vídeo + views/likes/caption) para o perfil do criador de referência.
2. **Baixar** os vídeos a partir das URLs coletadas (URLs do Instagram EXPIRAM rápido — baixe logo).
3. **Transcrever** com whisper (no idioma do criador).
4. **Analisar** — VIEWS = vencedor; identifique famílias de hook, estrutura e mecanismos de viralização. Consolide num arquivo de análise.
5. **Amostra** — gere 1 roteiro na SUA voz e revise ANTES de produzir o lote.
6. **Gerar** — cada roteiro modela 1 reel (hook + estrutura), com o tema adaptado ao seu negócio e a SUA voz calibrada na transcrição bruta das suas falas reais.
7. **Entregar** — exporte os roteiros (ex.: para documento ou para o seu drive).

## A SUA voz (NON-NEGOTIABLE)
- Gere o conteúdo na SUA voz real, calibrada em transcrições suas (não em descrição genérica).
- Mantenha o seu jeito de falar: vocativos, expressões e ritmo que são de fato seus.
- Inglês adaptado, nunca traduzido literal.
- Sem emoji, sem cara de IA (evite aforismos artificiais e o padrão "não é X, é Y").
- Frases curtas; hook nos primeiros 3 segundos; fecho consistente com o seu estilo.

## Gates
- Valide 1 amostra antes do lote.
- Checagem antes de exportar: voz consistente, sem emoji, sem cara de IA, contagem de roteiros conferida, português correto (ortografia, acento, pontuação).
- Roteiros de notícia: confirme o fato e a data em fontes confiáveis antes de gravar.

## Como funciona o método
O método (autoria Alan Nicolas) é simples e replicável: você escolhe um criador grande que já viralizou no seu tema, coleta os Reels com as métricas reais, descobre os padrões de hook e estrutura que fizeram cada vídeo bombar e, em vez de copiar, recria esses padrões com o SEU tema e a SUA voz. Modelar o que já deu certo encurta o caminho — você não inventa do zero, parte de um formato comprovado e o traduz para a sua linguagem.

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/conteudo-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.
