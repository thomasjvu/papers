module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Tests
        'build', // Build system changes
        'ci', // CI/CD changes
        'chore', // Other changes that don't modify src or test files
        'revert', // Revert previous commit
      ],
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
  },
};
