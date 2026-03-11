const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  tsx: 'React/TSX',
  jsx: 'React/JSX',
  python: 'Python',
  bash: 'Bash',
  shell: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  toml: 'TOML',
  markdown: 'Markdown',
  css: 'CSS',
  html: 'HTML',
  sql: 'SQL',
  solidity: 'Solidity',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  php: 'PHP',
  ruby: 'Ruby',
  dart: 'Dart',
  kotlin: 'Kotlin',
  swift: 'Swift',
  cpp: 'C++',
  c: 'C',
};

export function getLanguageDisplay(language: string): string {
  return LANGUAGE_MAP[language.toLowerCase()] || language.toUpperCase();
}
