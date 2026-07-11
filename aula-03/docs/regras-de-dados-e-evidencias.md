# Regras de dados e evidências

## Selos

- **Real:** valor literal confirmado e acompanhado da fonte;
- **Estimado:** número da plataforma ou projeção que não representa necessariamente caixa confirmado;
- **Não fornecido:** campo ausente no input, sem preenchimento por inferência.

## Não inferir

O Leitor não calcula CTR, CPM, CPC, CPA, frequência ou ROAS a partir de campos relacionados. Se o gerenciador não entregou o campo pronto, registre `não fornecido`.

## ROAS

ROAS vindo do gerenciador é atribuição da plataforma. Só pode ser tratado como resultado confirmado quando houver correspondência com venda, checkout, extrato ou CRM.

## Evidência mínima

Toda leitura deve registrar:

- fonte;
- data da coleta;
- período analisado;
- janela de atribuição, quando disponível;
- conta, campanha ou nível da consulta;
- campos ausentes;
- confirmação humana quando a origem for colada manualmente.

Não versionar tokens, cookies, payloads com PII ou exports brutos sem necessidade didática.
