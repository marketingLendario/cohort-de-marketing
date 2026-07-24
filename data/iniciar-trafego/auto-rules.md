# Regras executáveis — iniciar-trafego

- Bloquear escrita sem `--proposal-id` persistido.
- Bloquear `approve` se `assessmentHash` divergir da proposta.
- Bloquear conclusão com `STUDIO_SYNC_FAILED`.
- Retry Studio sync limitado a 3 tentativas com backoff.
- Lock de escrita concorrente em `.aiox/iniciar-trafego/current-run.json`.
