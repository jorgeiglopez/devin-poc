import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { loadState } from './state.js';
import { dispatchNewIssues, trackSessions } from './dispatcher.js';

const config = loadConfig();
const app = Fastify({ logger: true });
const log = app.log;

const state = await loadState(config.stateFile);
log.info({ tracked: Object.keys(state).length, repo: config.githubRepo }, 'state loaded');

app.get('/health', async () => ({ ok: true }));
app.get('/status', async () => {
  const entries = Object.values(state);
  const count = (status) => entries.filter((e) => e.status === status).length;
  return {
    repo: config.githubRepo,
    triggerLabel: config.triggerLabel,
    pollIntervalMs: config.pollIntervalMs,
    summary: {
      totalDispatched: entries.length,
      working: count('working'),
      done: count('done'),
      failed: count('failed'),
      prsOpened: entries.filter((e) => e.prUrl).length,
      acusConsumed: entries.reduce((sum, e) => sum + (e.acusConsumed ?? 0), 0),
    },
    issues: state,
  };
});

let polling = false;
async function pollCycle() {
  if (polling) return; // never overlap cycles
  polling = true;
  try {
    await dispatchNewIssues(config, state, log);
    await trackSessions(config, state, log);
  } catch (err) {
    log.error({ err: err.message }, 'poll cycle failed');
  } finally {
    polling = false;
  }
}

await app.listen({ port: config.port, host: '0.0.0.0' });
log.info({ intervalMs: config.pollIntervalMs }, 'poll loop starting');
pollCycle();
setInterval(pollCycle, config.pollIntervalMs);
