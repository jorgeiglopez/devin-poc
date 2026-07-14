# ADR 0001: Poll GitHub instead of receiving webhooks

**Status:** Accepted (2026-07-14)

## Context

The system must react to new GitHub issues. GitHub's push mechanism is webhooks, but a webhook receiver needs a publicly reachable URL. This POC runs in local Docker, so a webhook would require a tunnel (smee.io, ngrok) plus webhook registration and secret management.

## Decision

Poll the GitHub Issues API on an interval (default 30s) instead of receiving webhooks. In the owner's words: "for a POC I don't wanna get in the hustle of setting up a public URL."

## Consequences

- No public exposure, no tunnel, no webhook registration — `docker compose up` is the whole setup.
- Trigger latency is up to one poll interval instead of instant.
- Polling consumes GitHub API quota (trivial at 30s: ~2,880 requests/day vs 5,000/hour PAT limit).
- Upgrade path: add a Fastify webhook route (the HTTP server already exists for `/health`) and a smee.io proxy container; the dispatcher is event-source-agnostic.
