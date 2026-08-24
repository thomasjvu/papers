import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

const rootDir = process.cwd();
const headersPath = join(rootDir, 'public', '_headers');
const vercelPath = join(rootDir, 'vercel.json');

const REQUIRED_CSP_SOURCES = {
  'default-src': "'self'",
  'object-src': "'none'",
  'frame-ancestors': "'none'",
  'style-src': 'https://fonts.googleapis.com',
  'font-src': 'https://fonts.gstatic.com',
};

const REQUIRED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath) {
  assert(existsSync(filePath), `Missing ${filePath}.`);
  return readFileSync(filePath, 'utf8');
}

function extractCloudflareHeaders(text) {
  return [...text.matchAll(/^\s*([A-Za-z0-9-]+)\s*:\s*(.+?)\s*$/gm)].map((match) => ({
    key: match[1],
    value: match[2],
  }));
}

function extractCloudflarePolicies(text) {
  return extractCloudflareHeaders(text)
    .filter(({ key }) => key.toLowerCase() === 'content-security-policy')
    .map(({ value }) => value);
}

function extractVercelHeaders(config) {
  assert(Array.isArray(config.headers), 'vercel.json must define a headers array.');

  return config.headers.flatMap((entry, index) => {
    assert(entry && Array.isArray(entry.headers), `vercel.json headers entry ${index} is invalid.`);
    return entry.headers.map((header, headerIndex) => {
      assert(
        header && typeof header.key === 'string' && typeof header.value === 'string',
        `vercel.json header ${index}.${headerIndex} is invalid.`
      );
      return { key: header.key, value: header.value };
    });
  });
}

function extractVercelPolicies(headers) {
  return headers
    .filter(({ key }) => key.toLowerCase() === 'content-security-policy')
    .map(({ value }) => value);
}

function parseCsp(policy) {
  return new Map(
    policy
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name.toLowerCase(), sources])
  );
}

function validateCsp(policy, label) {
  const directives = parseCsp(policy);
  const scriptSources = directives.get('script-src');

  assert(scriptSources, `${label} is missing script-src.`);
  assert(
    !scriptSources.some((source) => source.toLowerCase().startsWith('https:')),
    `${label} contains insecure script-src https:; script-src must contain only 'self'.`
  );
  assert(
    scriptSources.length === 1 && scriptSources[0] === "'self'",
    `${label} must contain script-src 'self' only.`
  );

  for (const [directive, source] of Object.entries(REQUIRED_CSP_SOURCES)) {
    const sources = directives.get(directive);
    assert(sources?.includes(source), `${label} is missing ${directive} ${source}.`);
  }
}

function validateHeaders(headers, label) {
  const values = new Map(headers.map(({ key, value }) => [key.toLowerCase(), value.trim()]));

  for (const [key, expectedValue] of Object.entries(REQUIRED_HEADERS)) {
    const actualValue = values.get(key);
    assert(actualValue, `${label} is missing ${key}.`);
    assert(
      actualValue.toLowerCase() === expectedValue.toLowerCase(),
      `${label} must set ${key} to ${expectedValue}.`
    );
  }
}

function validateCloudflarePolicy() {
  const text = readText(headersPath);
  const headers = extractCloudflareHeaders(text);
  const policies = extractCloudflarePolicies(text);

  assert(policies.length > 0, 'public/_headers is missing Content-Security-Policy.');
  policies.forEach((policy, index) => validateCsp(policy, `Cloudflare CSP ${index + 1}`));
  validateHeaders(headers, 'public/_headers');
}

function readVercelConfig(filePath = vercelPath) {
  const text = readText(filePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Could not parse ${filePath}: ${error.message}`);
  }
}

function validateVercelPolicy() {
  const headers = extractVercelHeaders(readVercelConfig());
  const policies = extractVercelPolicies(headers);

  assert(policies.length > 0, 'vercel.json headers are missing Content-Security-Policy.');
  policies.forEach((policy, index) => validateCsp(policy, `Vercel CSP ${index + 1}`));
  validateHeaders(headers, 'vercel.json headers');
}

function checkInsecureFixture(filePath) {
  const text = readText(filePath);
  assert(
    !/\bscript-src\s+[^;\n]*\bhttps:/i.test(text),
    `Security policy fixture ${filePath} contains insecure script-src https:.`
  );
}

function main() {
  validateCloudflarePolicy();
  validateVercelPolicy();

  const fixturePath = process.argv[2];
  if (fixturePath) {
    const resolvedFixturePath = resolve(rootDir, fixturePath);
    assert(existsSync(resolvedFixturePath), `Security policy fixture ${resolvedFixturePath} does not exist.`);
    assert(statSync(resolvedFixturePath).isFile(), `Security policy fixture ${resolvedFixturePath} is not a file.`);
    checkInsecureFixture(resolvedFixturePath);
  }

  console.log('Security policy checks passed.');
}

try {
  main();
} catch (error) {
  console.error(`Security policy check failed: ${error.message}`);
  process.exitCode = 1;
}
