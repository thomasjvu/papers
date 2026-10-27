import { spawnSync } from 'node:child_process';

/** Run a command synchronously and return stdout; throw with both streams on failure. */
export function runCommand(command, args, { cwd = process.cwd(), env = {} } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed:\n${result.stdout || ''}\n${result.stderr || ''}`
    );
  }
  return result.stdout;
}

/** npm may print notices before `--json` output; parse from the first array bracket. */
export function parseNpmPackJson(output) {
  const jsonStart = output.indexOf('[');
  if (jsonStart < 0) {
    throw new Error(`npm pack did not return JSON:\n${output}`);
  }
  return JSON.parse(output.slice(jsonStart));
}

export function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/** Collect a child's recent stdout, stderr and spawn errors; returns a trimmed-log getter. */
export function captureProcessOutput(child, limit = 4_000) {
  let logs = '';
  const capture = (chunk) => {
    logs = `${logs}${chunk.toString()}`.slice(-limit);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  child.on('error', capture);
  return () => logs.trim();
}
