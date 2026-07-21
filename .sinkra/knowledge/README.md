# .sinkra/knowledge/

Consolidated knowledge base for the SINKRA framework.

## Purpose

Stores indexed knowledge artifacts — extracted patterns, validated heuristics,
decision precedents, and framework documentation that agents consume at runtime.

## Structure

```
knowledge/
  patterns/      — Validated architectural and process patterns
  precedents/    — Decision precedents from roundtables
  indexes/       — Search indexes for agent knowledge retrieval
```

## Lifecycle

- Created by: heuristic-ops, roundtable consolidation, knowledge extraction pipelines
- Consumed by: All agents (via SYNAPSE context resolution)
- TTL: 365 days (knowledge is long-lived)
- Port target: W0-T7 KB port (1130 entities from deprecated .aios/)

---

*Boundary: LOCAL (development tooling)*
