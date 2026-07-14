# ADR 0005: Devin opens the pull request, not the orchestrator

**Status:** Accepted (2026-07-14)

## Context

Someone has to turn Devin's work into a PR. The orchestrator could clone the repo, manage branches, and open PRs itself — or delegate all git work to Devin, whose native GitHub integration already handles cloning, branching, pushing, and PR creation.

## Decision

The orchestrator never touches git. The session prompt instructs Devin to implement the issue on a branch and open a PR referencing the issue ("Fixes #N"), and explicitly not to merge. The orchestrator only observes: it polls session status and comments the outcome (including the PR link) back on the issue.

## Consequences

- The orchestrator needs no repo checkout, no git credentials, no write access to code — its PAT only reads issues and writes comments.
- Human-in-the-loop is enforced by GitHub itself: the PR sits unmerged until a human approves.
- Prerequisite: Devin's GitHub integration must be connected to the target repo (one-time setup in Devin settings).
- PR-link discovery is best-effort: taken from session detail if present, else regexed out of Devin's messages.
