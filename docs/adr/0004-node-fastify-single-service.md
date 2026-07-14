# ADR 0004: Single Node.js service with Fastify

**Status:** Accepted (2026-07-14)

## Context

The stack choice was Node.js (owner preference). With polling (ADR 0001) there is no inbound HTTP requirement, which raised the question of whether a web framework is needed at all.

## Consequences of one process doing everything

Poller, dispatcher, and session tracker run in a single `setInterval` loop inside one container. No queue, no workers.

## Decision

One Node 22 service. Fastify is kept but minimal: it serves `GET /health` and `GET /status` (live view of tracked issues → sessions) and is the ready-made seam for a webhook route if ADR 0001 is ever revisited. Only production dependency is Fastify; GitHub and Devin are called with built-in `fetch`.

## Consequences

- Smallest possible moving-parts count for the POC; one Dockerfile, one compose service.
- An overlapping-cycle guard (skip a tick if the previous one is still running) replaces a real job queue.
- Per-issue errors are caught and logged so one bad ticket cannot kill the loop.
