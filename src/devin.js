async function devinRequest(config, method, path, body) {
  const res = await fetch(`${config.devinApiBase}/v3/organizations/${config.devinOrgId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.devinApiKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Devin ${method} ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function createSession(config, prompt) {
  return devinRequest(config, 'POST', '/sessions', { prompt });
}

export async function getSession(config, sessionId) {
  return devinRequest(config, 'GET', `/sessions/${sessionId}`);
}

export async function getMessages(config, sessionId) {
  const page = await devinRequest(config, 'GET', `/sessions/${sessionId}/messages?first=200`);
  return page.items ?? [];
}

export function sessionUrl(sessionId) {
  return `https://app.devin.ai/sessions/${sessionId.replace(/^devin-/, '')}`;
}
