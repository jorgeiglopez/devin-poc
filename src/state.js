import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// State shape: { "<issueNumber>": { sessionId, status, prUrl?, updatedAt } }
// status: "working" | "done" | "failed"

export async function loadState(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

export async function saveState(file, state) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2));
  await rename(tmp, file);
}
