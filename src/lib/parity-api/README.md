# Parity API Layer

This folder defines the thin compatibility contract used during the Rust frontend parity phase.

Goals:
- Provide stable `/api/v1/*` endpoint contracts.
- Keep parity clients decoupled from React/Convex hook usage.
- Allow backend internals to evolve without changing frontend contract types.
