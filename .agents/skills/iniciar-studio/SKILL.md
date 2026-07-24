---
name: iniciar-studio
description: Worker interno do lifecycle do Marketing Studio — discovery, download, Docker, Supabase, BFF e abertura opcional. Invocado por /iniciar-trafego; o aluno nunca precisa digitar este comando na jornada A2→A3.
user_invocable: true
---

# Iniciar Studio — runtime interno

Esta skill **não faz parte da jornada do aluno** durante `/iniciar-trafego`. O worker `scripts/iniciar-studio.mjs` é chamado internamente após a aprovação.

## Responsabilidades

- Garantir runtime headless (`traffic-sync`): Supabase + migrations + BFF, sem Codex, sem Vite, sem browser
- Abrir projeto (`open`): Vite + deep link somente após resposta **sim**
- Liberar lease (`release`): encerra processos do lease atual

## Comandos internos

```bash
node scripts/iniciar-studio.mjs ensure --purpose=traffic-sync --project=projetos/{slug} --proposal-id=... --proposal-hash=... --json
node scripts/iniciar-studio.mjs open --project=projetos/{slug} --lease=<id> --deep-link=<url>
node scripts/iniciar-studio.mjs release --project=projetos/{slug} --lease=<id>
```

## Vetos

- Nunca instruir o aluno a rodar `/iniciar-studio` no meio de `/iniciar-trafego`
- Nunca abrir browser antes da pergunta exata **Quer abrir?**
- Nunca depender de memória da conversa para retomada — estado persiste em `.aiox/`
