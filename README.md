# Devin Event-Driven System (POC)

Label a GitHub issue `devin` → Devin implements it → a PR appears for human review.

## Quick start

```bash
cp .env.example .env         # fill in the 4 required vars (see Setup)
docker compose up --build

curl localhost:3000/health   # {"ok":true}
curl localhost:3000/status   # tracked issues → sessions
```

Then open an issue in the target repo, add the `devin` label, and watch it get a session comment within one poll cycle.

## How it works

```
GitHub issue (label: devin)
        │  polled every 30s
        ▼
devin-orchestrator (Docker)
        │  POST /v3/organizations/{org}/sessions
        ▼
Devin session ──▶ branch + pull request ──▶ human approves & merges
        │
        └──▶ progress/outcome commented back on the issue
```

The orchestrator polls for open issues with the trigger label, starts a Devin session per issue (prompt built from the ticket), comments the session link on the issue, then comments the outcome + PR link when the session ends. Devin opens the PR itself via its GitHub integration — the orchestrator never touches git; a human merges. State lives in `data/state.json` (mounted volume), so restarts never re-dispatch an issue. Architectural decisions: [`docs/adr/`](docs/adr/).

## Setup (one-time)

1. **Devin Service User key** (`DEVIN_API_KEY`): legacy `apk_user_...` keys are deprecated. In [app.devin.ai](https://app.devin.ai): **Settings → Service users** → create one → generate an API key (`cog_...`, shown once). Org ID (`org-...`) → `DEVIN_ORG_ID`.
2. **Connect Devin's GitHub integration** to the target repo (so it can push branches and open PRs).
3. **GitHub fine-grained PAT** (`GITHUB_TOKEN`): github.com → **Settings → Credentials → Fine-grained tokens**. Repository access: *Only select repositories* → the target repo. Permissions: **Issues: Read and write**. (Classic PAT with `repo` scope also works.)
4. **`GITHUB_REPO`** = `owner/name`, e.g. `https://github.com/jorgeiglopez/superset` → `jorgeiglopez/superset`.
5. **Create the `devin` label** in the target repo.

## Demo (end-to-end)

1. Open an issue describing a small task (e.g. "Add a hello.md with a greeting") and label it `devin`.
2. Within one poll cycle the issue gets a comment with the Devin session link.
3. Devin opens a PR referencing the issue; on completion the issue gets an outcome comment with the PR link.
4. Review and merge the PR — the human-in-the-loop step.

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DEVIN_API_KEY` | yes | — | Devin Service User API key (`cog_...`) |
| `DEVIN_ORG_ID` | yes | — | Devin organization ID (`org-...`) |
| `GITHUB_TOKEN` | yes | — | PAT with Issues read/write on the target repo |
| `GITHUB_REPO` | yes | — | Target repo, `owner/name` |
| `TRIGGER_LABEL` | no | `devin` | Label that opts an issue in |
| `POLL_INTERVAL_MS` | no | `30000` | Poll cadence |
| `PORT` | no | `3000` | Health/status endpoint port |
