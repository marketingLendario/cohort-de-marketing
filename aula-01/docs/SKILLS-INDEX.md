# SKILLS-INDEX — Mapa de nomes das skills

> Este documento existe por um motivo: o material da live, as gravações antigas, as anotações dos alunos e o repo evoluíram em ritmos diferentes. Algumas skills mudaram de nome. Outras ainda são chamadas pelo nome antigo em vídeos/transcrições.
>
> **Regra:** o nome **canônico** é o que está no `.claude/skills/` deste repo. Se o aluno perguntar por um nome alternativo, redirecionar pro canônico.

---

## Como ler esta tabela

- **Nome canônico** → é o que existe hoje em `.claude/skills/` (digite `/` no Claude Code e aparece)
- **Aliases** → nomes antigos, nomes da live, nomes em PT-BR ou EN que apontam pra mesma skill
- **O que faz** → 1 linha pra confirmar que é a skill certa
- **Status** → ativa | descontinuada | renomeada

---

## Aula 01 — Pesquisa, Concorrentes & Ofertas

| Nome canônico | Aliases (não use, mas é a mesma coisa) | O que faz |
|---|---|---|
| `/avatar-funil` | `/pesquisa-de-avatar`, `/pesquisa-icp`, `/icp`, `/persona`, `pesquisa-de-avatar` | Pesquisa de avatar em 7 dimensões com focus group sintético. Gera MD + HTML + PDF. |
| `/espiao-do-concorrente` | `/competitor-analysis`, `/concorrentes`, `/spy-competitor`, `/analise-concorrencia` | Dossiê multi-fonte de 1 concorrente (Meta Ad Library + Google Ads + redes + site + reviews). |
| `/trend-hunting` | `/trends`, `/tendencias`, `/o-que-ta-bombando` | Identifica tendências emergentes em 4 fontes antes da saturação. |
| `/swipe-file` | `/swipefile`, `/biblioteca-criativos`, `/winners` | Organiza criativos winners categorizados por tipo/formato/padrão. Gera `briefing-swipe-file.md`. |
| `/offerbook` | `/livro-da-oferta`, `/story-selling`, `/oferta` | Livro da Oferta em 7 blocos. Gera `briefing-offerbook.md` + MD + DOCX. |

---

## Apoio e Aula 02 — identidade, funil e peças

| Nome canônico | Aliases | O que faz |
|---|---|---|
| `/design-md` | `/design`, `/brand`, `/visual` | Cria o `DESIGN.md` da marca e salva em `projetos/{slug}/` quando há projeto ativo. |
| `/metodo-funil` | `/funil`, `/mapa-funil`, `/diagnostico-funil` | Diagnostica estágio de consciência e grava o mapa de execução em `funil.md`. |
| `/copy-funil` | `/copy`, `/copywriting`, `/big-idea` | Cria a fundação da copy em `copy.md`; as peças aplicam essa copy depois. |
| `/pagina-vendas-funil` | `/pagina-vendas`, `/sales-page`, `/lp` | Monta a página de vendas em `pagina/` usando `copy.md` + `DESIGN.md`. |
| `/email-funil` | `/emails`, `/email-marketing` | Gera trilhas de e-mail em HTML copiável na pasta `emails/`. |
| `/whatsapp-funil` | `/whatsapp`, `/dm-funil` | Gera mensagens de WhatsApp/DM por momento do funil. |
| `/conteudo-funil` | `/conteudo`, `/reels`, `/carrossel` | Gera roteiros e carrosséis orgânicos na voz da marca. |
| `/recuperacao-funil` | `/recuperacao`, `/carrinho-abandonado` | Estrutura recuperação por comportamento e canal. |
| `/backend-funil` | `/back-end`, `/upsell`, `/oto` | Estrutura upsell, OTO, downsell, order bump e LTV. |
| `/cro-funil` | `/cro`, `/kpis`, `/teste-ab` | Monta KPIs e plano de otimização/testes. |
| `/quiz-funil` | `/quiz`, `/diagnostico` | Estrutura quiz/diagnóstico segmentado. |
| `/webinario-funil` | `/webinario`, `/masterclass` | Estrutura webinário/aula ao vivo ou evergreen. |
| `/vsl-funil` | `/vsl` | Estrutura funil de VSL Direct Response. |
| `/advertorial-funil` | `/advertorial`, `/pre-venda` | Estrutura advertorial/página editorial de pré-venda. |
| `/lancamento-funil` | `/lancamento`, `/plf` | Estrutura lançamento estilo PLF. |
| `/mockup-produto-funil` | `/mockup`, `/produto-visual` | Gera prompts e estrutura de mockups do produto/bônus. |
| `/bonus-funil` | `/bonus`, `/entregaveis-bonus` | Gera os entregáveis reais dos bônus aprovados no offerbook. |
| `/criativos-funil` | `/criativos`, `/ads` | Modela criativos pagos a partir de anúncios/concorrentes. |
| `/status-funil` | `/status`, `/onde-estou` | Lê `projetos/{slug}/` e mostra o próximo passo. |

---

## Skills NÃO instaladas no cohort (não pergunte ao suporte)

Aparecem em outros materiais da Academia Lendária mas **não fazem parte deste repo**:

| Skill | Onde existe | Por que não está aqui |
|---|---|---|
| `/diagnostico-de-oferta-em-60-seg` | Repo `live-vendas-cohort-marketing` | É bônus da live de vendas (lead capture), não material de aluno |
| `/pesquisa-de-avatar` (versão antiga) | Removida deste repo | Substituída pela evolução `/avatar-funil` |
| `/competitor-analysis` | Nunca existiu como skill | Era nome interno de planejamento — virou `/espiao-do-concorrente` |

---

## Fluxo de suporte (quando o aluno perguntar)

```
Aluno: "como rodo /pesquisa-de-avatar?"
   ↓
Suporte: "Essa skill foi renomeada pra /avatar-funil. Faz a mesma coisa
         (pesquisa em 7 dimensões) mas evoluiu pra gerar HTML e PDF
         além do MD. Comando: /avatar-funil [negocio]"
```

```
Aluno: "tinha uma skill de spy do concorrente, qual é?"
   ↓
Suporte: "/espiao-do-concorrente. Comando: /espiao-do-concorrente [nome-do-concorrente]"
```

```
Aluno: "no vídeo aparece /diagnostico-de-oferta — tá faltando aqui?"
   ↓
Suporte: "Esse era bônus da live de vendas, não entra no cohort.
         Você tem o equivalente conceitual dentro do /offerbook (Bloco 2 — Posicionamento)."
```

---

## Regra de manutenção

Quando uma skill for renomeada ou descontinuada, **atualizar este arquivo no mesmo PR**. Sem essa atualização, suporte vira telefone-sem-fio.

**Última atualização:** 2026-07-07
