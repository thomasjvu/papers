import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

import { chromium } from 'playwright';

const cwd = process.cwd();
const require = createRequire(import.meta.url);
const config = require(resolve(cwd, 'lighthouserc.cjs'));
const collect = config?.ci?.collect ?? {};
const assertions = config?.ci?.assert?.assertions ?? {};
const urls = Array.isArray(collect.url) ? collect.url : [collect.url];
const outputDirectory = resolve(cwd, '.lighthouseci');
const serverReadyTimeoutMs = 120_000;
const requestTimeoutMs = 1_500;

if (collect.numberOfRuns !== undefined && collect.numberOfRuns !== 1) {
  throw new Error('lighthouse-check requires numberOfRuns to be exactly 1');
}

if (!urls.length || urls.some((url) => typeof url !== 'string' || !url)) {
  throw new Error('lighthouserc.cjs must define at least one URL');
}

function formatScore(score) {
  return typeof score === 'number' ? `${Math.round(score * 100)}%` : 'n/a';
}

function formatBytes(bytes) {
  return typeof bytes === 'number' ? `${Math.round(bytes).toLocaleString()} B` : 'n/a';
}

function reportName(url, index) {
  const pathname = new URL(url).pathname;
  const slug = (pathname === '/' ? 'root' : pathname.slice(1))
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${String(index + 1).padStart(2, '0')}-${slug || 'root'}`;
}

async function isServerReady(url) {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    await response.body?.cancel();
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

function startPreview() {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(command, ['run', 'preview', '--', '--host', '127.0.0.1'], {
    cwd,
    env: { ...process.env, BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  const capture = (chunk) => {
    logs = `${logs}${chunk.toString()}`.slice(-4_000);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  child.on('error', capture);
  return { child, getLogs: () => logs.trim() };
}

async function runLighthouseCli(url, base, browserPath) {
  const command = process.execPath;
  const cliPath = resolve(cwd, 'node_modules/lighthouse/cli/index.js');
  const outputPath = resolve(outputDirectory, base);
  const args = [cliPath, url, '--output=json', '--output=html', `--output-path=${outputPath}`];
  if (process.getuid?.() === 0) args.push('--chrome-flags=--no-sandbox');

  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, CHROME_PATH: browserPath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  const capture = (chunk) => {
    logs = `${logs}${chunk.toString()}`.slice(-4_000);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  child.on('error', capture);

  const [exitCode, signal] = await once(child, 'close');
  if (exitCode !== 0) {
    throw new Error(
      `Lighthouse failed for ${url} (exit=${exitCode ?? 'null'} signal=${signal ?? 'none'})${logs.trim() ? `:\n${logs.trim()}` : ''}`
    );
  }

  const jsonPath = `${outputPath}.report.json`;
  const htmlPath = `${outputPath}.report.html`;
  const lhr = JSON.parse(await readFile(jsonPath, 'utf8'));
  return { htmlPath, jsonPath, lhr };
}

async function stopPreview(child) {
  if (!child || (child.exitCode !== null && child.signalCode !== null)) return;

  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await Promise.race([once(child, 'exit'), delay(5_000)]);
  }

  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await Promise.race([once(child, 'exit'), delay(5_000)]);
  }
}

async function waitForPreview(url, preview) {
  const deadline = Date.now() + serverReadyTimeoutMs;
  while (Date.now() < deadline) {
    if (await isServerReady(url)) return;
    if (preview.child.exitCode !== null || preview.child.signalCode !== null) {
      throw new Error(
        `Preview exited before becoming ready${preview.getLogs() ? `:\n${preview.getLogs()}` : ''}`
      );
    }
    await delay(500);
  }
  throw new Error(
    `Preview did not become ready within ${serverReadyTimeoutMs / 1000}s${preview.getLogs() ? `:\n${preview.getLogs()}` : ''}`
  );
}

function evaluateAssertion(lhr, id, assertion) {
  if (!Array.isArray(assertion) || assertion.length < 2) {
    throw new Error(`Unsupported assertion format for ${id}`);
  }

  const [level, options] = assertion;
  if (level !== 'error' && level !== 'warn') {
    throw new Error(`Unsupported assertion level for ${id}: ${level}`);
  }

  let actual;
  let passes;
  if (id.startsWith('categories:')) {
    const categoryId = id.slice('categories:'.length);
    actual = lhr.categories?.[categoryId]?.score;
    passes = typeof actual === 'number' && actual >= options.minScore;
  } else {
    const audit = lhr.audits?.[id];
    actual = audit?.numericValue;
    passes = typeof actual === 'number' && actual <= options.maxNumericValue;
  }

  return { id, level, actual, passes };
}

function evaluateAssertions(lhr) {
  return Object.entries(assertions).map(([id, assertion]) => evaluateAssertion(lhr, id, assertion));
}

function printSummary(url, lhr, results, reportBase) {
  const categoryScores = ['performance', 'accessibility', 'best-practices', 'seo']
    .map((id) => `${id}=${formatScore(lhr.categories?.[id]?.score)}`)
    .join(' ');
  const bytes = formatBytes(lhr.audits?.['total-byte-weight']?.numericValue);
  const warnings = results.filter((result) => !result.passes && result.level === 'warn');
  const failures = results.filter((result) => !result.passes && result.level === 'error');
  const status = failures.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS';
  console.log(
    `${status} ${new URL(url).pathname || '/'} ${categoryScores} bytes=${bytes} reports=${reportBase}.report.json/.report.html`
  );
  for (const warning of warnings) {
    console.warn(`  warning ${warning.id}`);
  }
  for (const failure of failures) {
    console.error(`  error ${failure.id}`);
  }
  return failures.length;
}

async function run() {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  const browserPath = chromium.executablePath();
  const previewUrl = urls[0];
  let preview;
  if (!(await isServerReady(previewUrl))) {
    preview = startPreview();
    await waitForPreview(previewUrl, preview);
  }

  let failures = 0;
  try {
    for (const [index, url] of urls.entries()) {
      const base = reportName(url, index);
      const result = await runLighthouseCli(url, base, browserPath);

      if (result.lhr.runtimeError) {
        throw new Error(`Lighthouse runtime error for ${url}: ${result.lhr.runtimeError.message}`);
      }
      failures += printSummary(url, result.lhr, evaluateAssertions(result.lhr), base);
    }
  } finally {
    await stopPreview(preview?.child);
  }

  if (failures) {
    throw new Error(`${failures} Lighthouse error assertion${failures === 1 ? '' : 's'} failed`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
