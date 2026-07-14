async function githubRequest(config, method, path, body) {
  const res = await fetch(`${config.githubApiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`GitHub ${method} ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function listLabeledIssues(config) {
  const path = `/repos/${config.githubRepo}/issues?labels=${encodeURIComponent(config.triggerLabel)}&state=open&per_page=100`;
  const issues = await githubRequest(config, 'GET', path);
  // The issues endpoint also returns PRs; PRs carry a `pull_request` key.
  return issues.filter((issue) => !issue.pull_request);
}

export async function commentOnIssue(config, issueNumber, body) {
  return githubRequest(config, 'POST', `/repos/${config.githubRepo}/issues/${issueNumber}/comments`, { body });
}
