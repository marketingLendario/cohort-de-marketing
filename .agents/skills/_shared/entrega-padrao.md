# Entrega padrão — 3 formatos, abrir HTML, próximo passo, ferramentas (regra canônica compartilhada)

> Texto integral das regras de entrega que antes viviam duplicadas em cada SKILL.md. As skills carregam a versão compacta e leem ESTE arquivo ao fechar a entrega.

## 1. Output nos 3 formatos (md + html + pdf)

Todo entregável sai em **3 formatos**, mesmo nome-base, salvo na pasta do projeto (`projetos/{slug}/...`):

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto). Legibilidade conforme o público (nichos 50+/acessibilidade → fonte ≥18px, alto contraste). **Contraste por fundo (regra dura):** texto sobre fundo ESCURO usa o token CLARO da marca (ex.: `on-deep`/creme), NUNCA o token `muted` (que é do fundo claro e some no escuro); legenda/microcopy sai MENOR e mais leve (opacidade ~.7) que o corpo. CSS inline, self-contained, sem emoji, português acentuado. Sem `DESIGN.md` → gere com `/design-md` antes.
3. **`.pdf`** — gerado do html com `bash .claude/skills/{skill}/scripts/gerar_pdf.sh <arquivo>.html`.

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

**Exceção — skills de PESQUISA da Aula 1 (avatar, espião, trend, swipe):** podem sair no **tema neutro legível** (o brand-choice `neutro`) quando o `DESIGN.md` ainda não existe — o design nasce só na Aula 2. **Nunca trave a Aula 1 por falta de design:** entregue no neutro e siga. O `DESIGN.md` da marca entra depois; as peças do funil (Aula 2 em diante) é que exigem a identidade aplicada.

## 2. Abra o HTML ao terminar E em todo checkpoint (obrigatório)

Toda entrega — resultado final OU checkpoint de revisão/aprovação — gera um `.html` e termina SEMPRE: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com o comando do sistema do aluno — macOS `open` · Windows `start ""` · Linux `xdg-open` (**detecte o SO antes; NUNCA assuma macOS**). Se o ambiente não abrir sozinho (ex.: Codex), **imprima o caminho absoluto + como abrir com 2 cliques**. NUNCA peça aprovação de algo que o usuário não vê renderizado; nunca encerre entregando só o caminho. A amostra/checkpoint também entra no Book antes (ver `_shared/book-do-funil.md` §4).

## 3. Ao terminar — SEMPRE diga o próximo passo (UM só)

Toda execução termina apontando o próximo passo, consultando o Mapa de Execução do `/metodo-funil` (ordem canônica): *"Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega]."* Aponte **UM comando só** — nada de menu de opções ou alternativas paralelas; se houver mais de um caminho, escolha pela ordem do mapa e aponte só ele.

## 4. Ferramentas — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação (regra `_shared/nunca-travar.md`).

- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDFs. Check macOS: `ls "/Applications/Google Chrome.app"` · Windows (Git Bash): `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"` (no Windows o script usa o Edge como fallback). **Fallback sem Chrome:** entregue md+html, abra o `.html` e oriente imprimir em PDF (Cmd+P no Mac, Ctrl+P no Windows → Salvar como PDF).
- **Apify** (skills de coleta) — é a ferramenta CENTRAL, nunca opcional: check `APIFY_API_TOKEN`/`APIFY_API_KEY` no `.env`; sem chave, ajude a configurar (console do Apify → `.env`); fallback (WebSearch/manual) SÓ quando a cota mensal estourar, avisando.
- **WebSearch/WebFetch** — nativos; se um site bloquear, diga QUAL fonte falhou e o que veio de snippet.

## 5. Processo carregando — narrar coleta longa (skills de coleta)

Ao disparar coleta/pesquisa demorada: anuncie o que foi disparado (quantos coletores, o que cada um faz), dê estimativa honesta de tempo, avise a cada retorno parcial (nunca silêncio até o fim), atualize proativamente se estourar a estimativa, e sempre ofereça seguir com o material parcial.

**Skills de coleta: leiam este §5 ANTES de disparar a coleta, não só ao fechar a entrega.** A narração de processo longo começa no momento do disparo (anúncio do que foi disparado + estimativa), não no fim — quem só lê a regra ao gerar o arquivo já deixou o aluno no escuro durante a espera.
