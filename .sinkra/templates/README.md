# .sinkra/templates/

Templates JSON Schema (draft-2020-12) + Markdown referenciados pelas 22 tasks REAL V5 canon do `/sinkra-pipeline`.

## Catalog (9 templates)

| Template | Used by | Tipo |
|----------|---------|------|
| `state-detection-report-v1.json` | tsk01_detectar_estado_existente | JSON Schema |
| `company-snapshot-v1.json` | tsk02_capturar + tsk03_completar_gaps | JSON Schema |
| `ajv-validation-report-v1.json` | tsk01_executar_ajv_strict + tsk02_ajv_strict_final | JSON Schema |
| `meta-axiomas-scores-v1.json` | tsk02_scorar_meta_axiomas | JSON Schema |
| `compliance-report-v1.json` | tsk03_validar_compliance_v5 | JSON Schema |
| `compliance-score-v1.json` | tsk04_calcular_compliance_score | JSON Schema |
| `axioma-report-tmpl.md` | tsk05_gerar_axioma_report | Markdown template |
| `sinkra-output-analysis-v1.json` | tsk04_emitir_companions (D6 companion) | JSON Schema |
| `session-v1.json` | tsk04_emitir_companions (B1 companion) | JSON Schema |

## Convenções

- **JSON Schema templates:** draft-2020-12, `additionalProperties: false` strict, used via AJV validator.
- **Markdown templates:** `{{var}}` placeholders, renderizado por tsk task body MD.
- **IDs:** `https://sinkra-hub/templates/{slug}-v{N}.json` — preparado para Hub migration (PV_KE_130).

## Sync with synkra-hub (PV_KE_130)

Estes templates são framework artifacts (Hub SOT). Deadline sync 2026-06-12 para PR no synkra-hub.

---

*V5 Templates v1 — Sprint 3.2 materialização (Pedro 2026-06-05)*
