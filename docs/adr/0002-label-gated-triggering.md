# ADR 0002: Only issues labeled `devin` trigger a session

**Status:** Accepted (2026-07-14)

## Context

Devin sessions cost ACUs. If every new issue woke Devin, discussion tickets, duplicates, and vague reports would burn budget and produce noise PRs.

## Decision

Only open issues carrying the trigger label (default `devin`, configurable via `TRIGGER_LABEL`) are dispatched. Humans opt a ticket in by adding the label.

## Consequences

- Explicit human intent gates every Devin run — natural cost control and a first HITL checkpoint before work even starts.
- Adding the label to an existing issue also triggers it (the poll queries by label, not creation time).
- The label must exist in the target repo (one-time setup step).
