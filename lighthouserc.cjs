const urls = [
  'http://127.0.0.1:3333/',
  'http://127.0.0.1:3333/docs',
  'http://127.0.0.1:3333/docs/getting-started/introduction',
  'http://127.0.0.1:3333/docs/api-reference/openapi',
];

const assertions = {
  'categories:performance': ['warn', { minScore: 0.7 }],
  'categories:accessibility': ['error', { minScore: 0.9 }],
  'categories:best-practices': ['error', { minScore: 0.9 }],
  'categories:seo': ['error', { minScore: 0.9 }],
  'total-byte-weight': ['warn', { maxNumericValue: 12_000_000 }],
};

module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 1,
    },
    assert: {
      assertions,
    },
  },
};
