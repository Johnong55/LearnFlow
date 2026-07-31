import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commands = [
  {
    name: 'API',
    command: 'npm',
    args: ['run', 'start:dev'],
    cwd: projectRoot,
  },
  {
    name: 'WORKER',
    command: 'npm',
    args: ['run', 'start:worker:dev'],
    cwd: projectRoot,
  },
  {
    name: 'FRONTEND',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(projectRoot, 'frontend'),
  },
];

const children = new Map();
let shuttingDown = false;

function terminate(child, signal) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') console.error(`Could not stop process ${child.pid}:`, error);
  }
}

function shutdown(signal, exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[DEV] Stopping API, worker, and frontend (${signal})...`);
  for (const child of children.values()) terminate(child, signal);

  const forceTimer = setTimeout(() => {
    for (const child of children.values()) terminate(child, 'SIGKILL');
  }, 5_000);
  forceTimer.unref();

  Promise.allSettled(
    [...children.values()].map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) resolve();
          else child.once('exit', resolve);
        }),
    ),
  ).then(() => process.exit(exitCode));
}

for (const item of commands) {
  const child = spawn(item.command, item.args, {
    cwd: item.cwd,
    env: process.env,
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });
  children.set(item.name, child);

  child.on('error', (error) => {
    console.error(`[${item.name}] Could not start: ${error.message}`);
    shutdown('SIGTERM', 1);
  });
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    const reason = signal ? `signal ${signal}` : `exit code ${code ?? 1}`;
    console.error(`[${item.name}] stopped unexpectedly (${reason}).`);
    shutdown('SIGTERM', code && code > 0 ? code : 1);
  });
}

console.log('[DEV] API:      http://localhost:3000');
console.log('[DEV] Swagger:  http://localhost:3000/docs');
console.log('[DEV] Frontend: http://localhost:3001');
console.log('[DEV] Press Ctrl+C once to stop everything.\n');

process.once('SIGINT', () => shutdown('SIGINT', 0));
process.once('SIGTERM', () => shutdown('SIGTERM', 0));
