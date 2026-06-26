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

## Aula 02 — Funil e Páginas

| Nome canônico | Aliases | O que faz |
|---|---|---|
| `/metodo-funil` | `/funil`, `/funnel-method`, `/alan-nicolas` | Método de construção de funil (Alan Nicolas). |
| `/pagina-vendas` | `/lp`, `/landing-page`, `/sales-page`, `/pagina-de-vendas` | Página de vendas estruturada. |
| `/vsl-funil` | `/vsl`, `/video-sales-letter` | Video Sales Letter. |
| `/copy-funil` | `/copy`, `/copywriting` | Copy específica pro funil. |
| `/criativos-funil` | `/criativos`, `/anuncios`, `/ads` | Criativos para anúncios. |
| `/email-funil` | `/email`, `/email-marketing`, `/sequencia-email` | Email marketing do funil. |
| `/whatsapp-funil` | `/whatsapp`, `/wpp`, `/zap` | WhatsApp marketing do funil. |
| `/recuperacao` | `/cart-recovery`, `/carrinho-abandonado`, `/recuperar-carrinho` | Recuperação de carrinho abandonado. |
| `/cro-funil` | `/cro`, `/otimizacao-conversao`, `/conversion-optimization` | Otimização de conversão. |
| `/back-end` | `/backend`, `/integracoes`, `/integrations` | Backend e integrações. |
| `/conteudo-funil` | `/conteudo`, `/content` | Conteúdo para LP e VSL. |
| `/design-md` | `/design`, `/brand`, `/visual` | Design system markdown que renderiza HTML com brand. |

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

**Última atualização:** 2026-06-26
