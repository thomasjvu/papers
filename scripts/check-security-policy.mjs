import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { openapiConfig } from '../shared/documentation-config.js';
import { normalizeOpenApiAllowedOrigins } from '../shared/openapiSpecUrls.js';
import { securityConfig } from '../shared/securityConfig.js';

const rootDir = process.cwd();
const headersPath = join(rootDir, 'public', '_headers');
const vercelPath = join(rootDir, 'vercel.json');

const REQUIRED_CSP_SOURCES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'", ...securityConfig.fontStyleOrigins],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'", ...securityConfig.fontResourceOrigins],
  'connect-src': ["'self'", ...normalizeOpenApiAllowedOrigins(openapiConfig.allowedOrigins || [])],
  'object-src': ["'none'"],
  'frame-src': ["'self'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

const REQUIRED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()',
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath) {
  assert(existsSync(filePath), 'Missing ' + filePath + '.');
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
    assert(entry && Array.isArray(entry.headers), 'vercel.json headers entry ' + index + ' is invalid.');
    return entry.headers.map((header, headerIndex) => {
      assert(
        header && typeof header.key === 'string' && typeof header.value === 'string',
        'vercel.json header ' + index + '.' + headerIndex + ' is invalid.'
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

function parseCsp(policy, label) {
  const directives = new Map();

  for (const rawDirective of policy.split(';')) {
    const parts = rawDirective.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      continue;
    }

    const name = parts[0].toLowerCase();
    assert(!directives.has(name), label + ' contains duplicate ' + name + '.');
    directives.set(name, parts.slice(1));
  }

  return directives;
}

function equalSources(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function validateCsp(policy, label) {
  const directives = parseCsp(policy, label);
  const expectedNames = Object.keys(REQUIRED_CSP_SOURCES);

  assert(
    directives.size === expectedNames.length &&
      expectedNames.every((name) => directives.has(name)),
    label + ' has an unexpected or missing CSP directive.'
  );

  for (const [directive, expectedSources] of Object.entries(REQUIRED_CSP_SOURCES)) {
    const actualSources = directives.get(directive) || [];
    assert(
      equalSources(actualSources, expectedSources),
      label +
        ' has unexpected ' +
        directive +
        ' sources: ' +
        actualSources.join(' ') +
        '; expected ' +
        expectedSources.join(' ') +
        '.'
    );
  }

  for (const [directive, sources] of directives) {
    assert(
      !sources.some((source) => source === '*' || source === "'unsafe-eval'"),
      label + ' contains a wildcard or unsafe-eval source in ' + directive + '.'
    );
    assert(
      directive !== 'script-src' || equalSources(sources, ["'self'"]),
      label + ' must contain script-src self only.'
    );
  }

  return directives;
}

function validateHeaders(headers, label) {
  const values = new Map(headers.map(({ key, value }) => [key.toLowerCase(), value.trim()]));

  for (const [key, expectedValue] of Object.entries(REQUIRED_HEADERS)) {
    const actualValue = values.get(key);
    assert(actualValue, label + ' is missing ' + key + '.');
    assert(
      actualValue.toLowerCase() === expectedValue.toLowerCase(),
      label + ' must set ' + key + ' to ' + expectedValue + '.'
    );
  }

  assert(
    !values.has('x-xss-protection'),
    label + ' must not emit the legacy X-XSS-Protection header.'
  );
}

function validateCloudflarePolicy() {
  const text = readText(headersPath);
  const headers = extractCloudflareHeaders(text);
  const policies = extractCloudflarePolicies(text);

  assert(policies.length === 1, 'public/_headers must contain exactly one Content-Security-Policy.');
  const policy = validateCsp(policies[0], 'Cloudflare CSP');
  validateHeaders(headers, 'public/_headers');
  return policy;
}

function readVercelConfig(filePath = vercelPath) {
  const text = readText(filePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Could not parse ' + filePath + ': ' + error.message);
  }
}

function validateVercelPolicy() {
  const headers = extractVercelHeaders(readVercelConfig());
  const policies = extractVercelPolicies(headers);

  assert(policies.length === 1, 'vercel.json must contain exactly one Content-Security-Policy.');
  const policy = validateCsp(policies[0], 'Vercel CSP');
  validateHeaders(headers, 'vercel.json headers');
  return policy;
}

function checkInsecureFixture(filePath) {
  const text = readText(filePath);
  assert(
    !/\bscript-src\s+[^;\n]*\bhttps:/i.test(text),
    'Security policy fixture ' + filePath + ' contains insecure script-src https:.'
  );
}

function main() {
  const cloudflarePolicy = validateCloudflarePolicy();
  const vercelPolicy = validateVercelPolicy();

  assert(
    equalSources([...cloudflarePolicy.entries()], [...vercelPolicy.entries()]),
    'Cloudflare and Vercel CSP policies are not semantically equivalent.'
  );

  const fixturePath = process.argv[2];
  if (fixturePath) {
    const resolvedFixturePath = resolve(rootDir, fixturePath);
    assert(existsSync(resolvedFixturePath), 'Security policy fixture ' + resolvedFixturePath + ' does not exist.');
    assert(statSync(resolvedFixturePath).isFile(), 'Security policy fixture ' + resolvedFixturePath + ' is not a file.');
    checkInsecureFixture(resolvedFixturePath);
  }

  console.log('Security policy checks passed.');
}

try {
  main();
} catch (error) {
  console.error('Security policy check failed: ' + error.message);
  process.exitCode = 1;
}
