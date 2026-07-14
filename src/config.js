const required = ['DEVIN_API_KEY', 'DEVIN_ORG_ID', 'GITHUB_TOKEN', 'GITHUB_REPO'];

export function loadConfig() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const repo = process.env.GITHUB_REPO;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error(`GITHUB_REPO must be in "owner/name" format, got: ${repo}`);
  }

  return {
    devinApiKey: process.env.DEVIN_API_KEY,
    devinOrgId: process.env.DEVIN_ORG_ID,
    devinApiBase: process.env.DEVIN_API_BASE ?? 'https://api.devin.ai',
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: repo,
    githubApiBase: process.env.GITHUB_API_BASE ?? 'https://api.github.com',
    triggerLabel: process.env.TRIGGER_LABEL ?? 'devin',
    pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 30_000),
    port: Number(process.env.PORT ?? 3000),
    stateFile: process.env.STATE_FILE ?? 'data/state.json',
  };
}
