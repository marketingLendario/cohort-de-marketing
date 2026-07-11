# Decisao de contrato - Leitor de Metricas

Data: 2026-07-09

O bundle de origem continha uma contradicao:

- o PRD-A3 e o template do Painel diziam que o Leitor nunca calcula;
- a skill e o relatorio E2E permitiam aritmetica deterministica.

O PRD-A3 foi declarado fonte autoritativa. Portanto, a versao promovida para
este repositorio adota o contrato estrito:

- numero literal e confirmado no input: pode ser reportado;
- numero ausente: `nao_fornecido`;
- metrica derivada: nao e calculada pelo Leitor.

Calculos deterministicos continuam permitidos em modulos L0 separados, com
formula, origem e selo proprios. Eles nao sao apresentados como saida do Leitor.

O relatorio E2E importado permanece como evidencia historica do bundle de
origem e nao substitui esta decisao nem o PRD.

