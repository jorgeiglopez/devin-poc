# ADR 0003: JSON file on a Docker volume as the state store

**Status:** Accepted (2026-07-14)

## Context

The system must remember which issues were already dispatched (dedupe across restarts) and which Devin sessions are in flight. A POC does not justify running a database.

## Decision

Persist state as `data/state.json` — a map of issue number → `{ sessionId, status, prUrl?, updatedAt }` — written atomically (write tmp file, then rename) and mounted as a compose volume.

## Consequences

- Zero infrastructure; state survives container restarts; human-inspectable with `cat`.
- Atomic rename prevents a crash mid-write from corrupting state.
- Not concurrent-safe and unbounded growth — fine for one process and POC issue volumes. Swap for SQLite/Postgres if this graduates.
