# Devin Event-Driven System (POC)

Label a GitHub issue `devin` → Devin implements it → a PR appears for human review.

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

The orchestrator polls the target repo for open issues carrying the trigger label, starts a Devin session per issue with a prompt built from the ticket, comments the session link on the issue, tracks the session, and comments the outcome (with the PR link) when Devin finishes. Devin itself opens the PR via its GitHub integration; the orchestrator never touches git. Architectural decisions are recorded in [`docs/adr/`](docs/adr/).

## Prerequisites (one-time)

1. **Devin — Service User key**: legacy API keys (`apk_user_...`) are deprecated; the v3 API authenticates as a **Service User** (a non-human principal for automation). In [app.devin.ai](https://app.devin.ai): **Settings → Service users** → create a service user with an appropriate role → generate an API key. It starts with `cog_` and is shown only once — copy it into `DEVIN_API_KEY`. Grab your org ID (`org-...`) from the same settings area into `DEVIN_ORG_ID`. Devin's GitHub integration must also be connected to the target repo so it can push branches and open PRs.
2. **GitHub — fine-grained PAT**: github.com → **Settings → Credentials → Fine-grained tokens → Generate new token**. Resource owner: your user/org; Repository access: *Only select repositories* → the target repo; Permissions: **Issues: Read and write** (Metadata: Read is added automatically). Put it in `GITHUB_TOKEN`. (A classic PAT with `repo` scope also works.)
3. **`GITHUB_REPO`** is `owner/name`, e.g. for `https://github.com/jorgeiglopez/superset` → `jorgeiglopez/superset`.
4. Create the `devin` label in the target repo.

## Run

```bash
cp .env.example .env   # fill in DEVIN_API_KEY, DEVIN_ORG_ID, GITHUB_TOKEN, GITHUB_REPO
docker compose up --build
```

Check it's alive:

```bash
curl localhost:3000/health   # {"ok":true}
curl localhost:3000/status   # config + tracked issues → sessions
```

## Demo (end-to-end)

1. Open an issue in the target repo describing a small task (e.g. "Add a hello.md with a greeting") and add the `devin` label.
2. Within one poll cycle the issue gets a comment with the Devin session link.
3. Devin works the ticket and opens a PR referencing the issue.
4. When the session ends, the issue gets an outcome comment with the PR link.
5. Review and merge the PR — that's the human-in-the-loop step.

State lives in `data/state.json` (mounted volume): restarting the container never re-dispatches an already-handled issue.

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DEVIN_API_KEY` | yes | — | Devin service-user API key |
| `DEVIN_ORG_ID` | yes | — | Devin organization ID |
| `GITHUB_TOKEN` | yes | — | PAT, `repo` scope |
| `GITHUB_REPO` | yes | — | Target repo, `owner/name` |
| `TRIGGER_LABEL` | no | `devin` | Label that opts an issue in |
| `POLL_INTERVAL_MS` | no | `30000` | Poll cadence |
| `PORT` | no | `3000` | Health/status endpoint port |
