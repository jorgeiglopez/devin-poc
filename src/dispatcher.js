import { listLabeledIssues, commentOnIssue } from './github.js';
import { createSession, getSession, getMessages, sessionUrl } from './devin.js';
import { saveState } from './state.js';

const TERMINAL_STATUSES = new Set(['finished', 'blocked', 'stopped', 'expired', 'exited']);

function buildPrompt(config, issue) {
  return [
    `Work on GitHub issue #${issue.number} in the repository ${config.githubRepo}.`,
    '',
    `Title: ${issue.title}`,
    '',
    'Description:',
    issue.body || '(no description provided)',
    '',
    'Instructions:',
    `- Implement what the issue asks for on a new branch.`,
    `- Open a pull request against the default branch that references issue #${issue.number} (e.g. "Fixes #${issue.number}").`,
    '- Do NOT merge the pull request; a human will review and approve it.',
  ].join('\n');
}

export async function dispatchNewIssues(config, state, log) {
  const issues = await listLabeledIssues(config);
  for (const issue of issues) {
    if (state[issue.number]) continue;
    try {
      const session = { session_id: '123456789', name: 'Test Devin session'}
      // const session = await createSession(config, buildPrompt(config, issue));
      const url = sessionUrl(session.session_id);
      state[issue.number] = {
        sessionId: session.session_id,
        status: 'working',
        updatedAt: new Date().toISOString(),
      };
      await saveState(config.stateFile, state);
      log.info({ issue: issue.number, sessionId: session.session_id }, 'session created');
      await commentOnIssue(
        config,
        issue.number,
        `🤖 Devin is on it — session: ${url}\n\nA pull request referencing this issue will be opened for human review.`
      );
    } catch (err) {
      log.error({ issue: issue.number, err: err.message }, 'dispatch failed');
    }
  }
}

function findPrUrl(config, session, messages) {
  if (session.pull_request?.url) return session.pull_request.url;
  const pattern = new RegExp(`https://github\\.com/${config.githubRepo}/pull/\\d+`);
  for (const msg of [...messages].reverse()) {
    const match = msg.message?.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export async function trackSessions(config, state, log) {
  for (const [issueNumber, entry] of Object.entries(state)) {
    if (entry.status !== 'working') continue;
    try {
      const session = await getSession(config, entry.sessionId);
      const status = (session.status ?? session.status_enum ?? '').toLowerCase();
      if (!TERMINAL_STATUSES.has(status)) {
        log.info({ issue: issueNumber, sessionId: entry.sessionId, status }, 'session still working');
        continue;
      }

      const messages = await getMessages(config, entry.sessionId).catch(() => []);
      const prUrl = findPrUrl(config, session, messages);
      const lastDevinMessage = [...messages].reverse().find((m) => m.source === 'devin')?.message;

      entry.status = status === 'finished' ? 'done' : 'failed';
      entry.sessionStatus = status;
      if (prUrl) entry.prUrl = prUrl;
      entry.updatedAt = new Date().toISOString();
      await saveState(config.stateFile, state);

      const lines = [`🤖 Devin session ended with status: **${status}**`];
      if (prUrl) lines.push('', `Pull request ready for review: ${prUrl}`);
      if (lastDevinMessage) lines.push('', `Devin's last update:\n> ${lastDevinMessage.slice(0, 1000)}`);
      lines.push('', `Session: ${sessionUrl(entry.sessionId)}`);
      await commentOnIssue(config, issueNumber, lines.join('\n'));
      log.info({ issue: issueNumber, status, prUrl }, 'session completed');
    } catch (err) {
      log.error({ issue: issueNumber, err: err.message }, 'tracking failed');
    }
  }
}
