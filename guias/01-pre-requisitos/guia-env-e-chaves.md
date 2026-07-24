# GUIA .ENV E CHAVES — o cofrinho único de todas as senhas de programa

> **Estou perdido em:** "que negócio é esse de .env? é um programa que tem que instalar? / colei a chave e nada funciona".
> **O que você vai ter no final:** o `.env` criado na raiz do projeto, você sabendo colar QUALQUER chave nele do jeito certo e conferir que salvou — o mesmo ritual serve pra Apify, Meta, Hotmart e o que vier.
> **Fontes cruzadas:** super-guia Parte A (repo — o texto-base, agora em guia próprio) · `.env.example` + o jeito como os scripts leem as chaves (código real) · dúvida REAL de aluno na Aula 1 ("É um outro programa que tem que instalar?" — não é!).

## O que é o `.env` (2 frases)

O `.env` **não é programa — é um arquivo de TEXTO** simples, na raiz do projeto, onde vivem as suas chaves (as "senhas de programa"). As skills leem ele automaticamente; você nunca cola chave no chat, em grupo ou em planilha — só ali. *Analogia: o chaveiro da casa — uma argola só, num lugar só.*

## As 4 regras de ouro de TODA chave

1. **A chave aparece UMA vez só** na maioria dos sites (Meta, OpenAI...). Copie na hora, cole no `.env`, salve. Perdeu? Revogue no site e gere outra — nunca "procure onde ficou". *(Exceção boa: o token do Apify fica sempre visível lá.)*
2. **Nunca em lugar público** (grupo, print, planilha). Chave vazou? Revogue na origem e gere outra.
3. **O `.env` nunca sobe pro GitHub** — o `.gitignore` do projeto já garante.
4. **Colou errado é o erro nº 1 do curso inteiro.** Sem espaços em volta do `=`, sem aspas, a chave INTEIRA numa linha:
   - ✅ `APIFY_API_TOKEN=apify_api_abc123`
   - ❌ `APIFY_API_TOKEN = "apify_api_abc123"`

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🧰 Ferramenta | Projeto clonado + terminal abrindo NA raiz | [guia-git-clonar-e-atualizar](guia-git-clonar-e-atualizar.md) · [guia-terminal-e-pastas](guia-terminal-e-pastas.md) |

## Passo a passo (criar 1× na vida)

1. Terminal na raiz do `cohort-de-marketing`.
2. Copie o modelo: Windows `copy .env.example .env` · Mac/Linux `cp .env.example .env`.
3. Abra pra editar: Windows `notepad .env` · Mac `open -e .env` · ou pelo VS Code.
4. ⚠️ **A pegadinha do Windows/Bloco de Notas:** ao salvar, "Tipo" = **Todos os arquivos** e o nome exatamente `.env` — se virar **`.env.txt`, NADA funciona**. Pra enxergar a diferença: Explorador → Exibir → marque **"Extensões de nomes de arquivo"**.
5. Cole cada chave na linha da sua variável (regra 4) e salve.
6. **O jeito mais fácil de todos:** rode `/comecar` no Claude — ele cria o `.env` e cola as chaves COM você, conferindo no final.

## Teste de sucesso

No terminal, na raiz: `findstr "APIFY" .env` (Windows) ou `grep APIFY .env` (Mac/Linux) → **imprime a linha** com a chave. Não imprimiu = não salvou (ou é `.env.txt`). Serve pra qualquer chave: troque o nome da variável.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| Z1 | Salvou e virou **`.env.txt`** (a praga) | o Bloco de Notas acrescentou `.txt` | ligue "Extensões de nomes de arquivo" no Explorador → renomeie pra `.env` exato → confirme o aviso do Windows |
| Z2 | O teste **não imprime a linha** | arquivo na pasta errada, nome errado, ou a linha não foi salva | confira que o `.env` está NA RAIZ (junto do `.env.example`); reabra e salve de novo |
| Z3 | Chave colada mas a skill diz que **falta** | espaço em volta do `=`, aspas, chave quebrada em 2 linhas, ou NOME da variável diferente do esperado | compare com o `.env.example` (o nome literal da variável importa) e aplique a regra 4 |
| Z4 | "**É um programa?** Precisa instalar algo?" | não — é só um arquivo de texto | releia "O que é o `.env`" acima; se o `notepad .env` abriu, você já está editando ele |
| Z5 | Medo de ter **vazado** uma chave | colou em chat público/print | revogue a chave NO SITE de origem e gere outra; troque no `.env`; o `.env` em si nunca sai da sua máquina |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | cole a primeira chave real: [guia-apify](../03-conexoes-e-apis/guia-apify.md) (a da Aula 1, grátis e sem espera) |
| 📖 Ler | quando chegar na Aula 3: [guia-meta-api](../03-conexoes-e-apis/guia-meta-api.md) · Aula 4: [guia-hotmart](../03-conexoes-e-apis/guia-hotmart.md) |
| 🚑 Se travar | o catálogo Z1–Z5 acima (`.env.txt`, linha que não imprime, "é um programa?"...) |
