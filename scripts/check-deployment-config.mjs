import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const wranglerPath = join(rootDir, 'wrangler.toml');

function fail(message) {
  throw new Error(message);
}

function getProjectName() {
  if (!existsSync(wranglerPath)) {
    fail('Missing wrangler.toml; cannot resolve the authoritative Pages project.');
  }

  const text = readFileSync(wranglerPath, 'utf8');
  const match = text.match(/^\s*name\s*=\s*"([^"]+)"\s*$/m);

  if (!match?.[1]) {
    fail('wrangler.toml must define a top-level name for the Pages project.');
  }

  return match[1];
}

function getDeployHost() {
  const value = String(process.env.PAPERS_DEPLOY_HOST || '').trim();

  if (!value) {
    fail(
      'PAPERS_DEPLOY_HOST is required. Configure the owned canonical HTTPS host before deploying.'
    );
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    fail('PAPERS_DEPLOY_HOST must be a valid HTTPS URL.');
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    fail('PAPERS_DEPLOY_HOST must be an HTTPS origin without credentials, query, or hash.');
  }

  return url.origin;
}

function assertCredential(name) {
  if (!String(process.env[name] || '').trim()) {
    fail(name + ' is required for the trusted Cloudflare deployment.');
  }
}

function main() {
  const projectName = getProjectName();

  if (process.argv.includes('--project-name')) {
    console.log(projectName);
    return;
  }

  if (process.argv.includes('--preflight')) {
    assertCredential('CLOUDFLARE_API_TOKEN');
    assertCredential('CLOUDFLARE_ACCOUNT_ID');
    const host = getDeployHost();

    if (
      process.env.CLOUDFLARE_PROJECT_NAME &&
      process.env.CLOUDFLARE_PROJECT_NAME !== projectName
    ) {
      fail(
        'CLOUDFLARE_PROJECT_NAME does not match wrangler.toml: ' +
          process.env.CLOUDFLARE_PROJECT_NAME +
          ' != ' +
          projectName
      );
    }

    console.log('Deployment preflight passed for ' + projectName + ' at ' + host + '.');
    return;
  }

  console.log('Cloudflare Pages project: ' + projectName);
}

try {
  main();
} catch (error) {
  console.error('Deployment configuration check failed: ' + error.message);
  process.exitCode = 1;
}
