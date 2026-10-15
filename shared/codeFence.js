/**
 * Code fence metadata shared by the Markdown runtime (src/utils/markdownCore.ts)
 * and the MDX build pipeline (scripts/lib/mdxAuthoring.mjs), so both formats
 * read `title="..."`, `{1,3-5}`, and `diff` fences identically.
 */

const MAX_HIGHLIGHT_LINE = 10000;
const MAX_HIGHLIGHT_WORDS = 10;

/** Parse `1,3-5` line ranges. Invalid, zero, reversed, or huge ranges are ignored. */
export function parseHighlightLines(spec) {
  const lines = new Set();
  for (const part of String(spec || '').split(',')) {
    const match = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(part);
    if (!match) continue;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < start || end > MAX_HIGHLIGHT_LINE) continue;
    for (let line = start; line <= end; line += 1) lines.add(line);
  }
  return Array.from(lines).sort((left, right) => left - right);
}

/** Read `title="..."` and `{ranges}` from the part of an info string after the language. */
export function parseCodeFenceMeta(meta) {
  let rest = String(meta || '');
  const result = {};

  const titleMatch = /\btitle=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(rest);
  if (titleMatch) {
    const title = (titleMatch[1] ?? titleMatch[2] ?? titleMatch[3] ?? '').trim();
    if (title) result.title = title;
    rest = rest.replace(titleMatch[0], ' ');
  }

  // Quoted terms such as "token" or 'apiKey' highlight every occurrence.
  const words = [];
  rest = rest.replace(/"([^"\n]{1,80})"|'([^'\n]{1,80})'/g, (_match, double, single) => {
    const word = (double ?? single ?? '').trim();
    if (word && !words.includes(word) && words.length < MAX_HIGHLIGHT_WORDS) words.push(word);
    return ' ';
  });
  if (words.length > 0) result.highlightWords = words;

  if (/(?:^|\s)(?:showLineNumbers=false|noLineNumbers)(?=\s|$)/.test(rest)) {
    result.showLineNumbers = false;
  } else if (/(?:^|\s)showLineNumbers(?:=true)?(?=\s|$)/.test(rest)) {
    result.showLineNumbers = true;
  }

  const rangeMatch = /\{([^}]*)\}/.exec(rest);
  if (rangeMatch) {
    const lines = parseHighlightLines(rangeMatch[1]);
    if (lines.length > 0) result.highlightLines = lines;
  }

  return result;
}

/** Split a full info string such as `ts title="app.ts" {2,4-6}`. */
export function parseCodeFenceInfo(info) {
  const trimmed = String(info || '').trim();
  const language = trimmed.match(/^\S*/)?.[0] || 'text';
  return { language, ...parseCodeFenceMeta(trimmed.slice(language.length)) };
}

/**
 * `diff` fences mark +/- lines; `diff-ts` (any `diff-<language>`) also colours
 * the code with that language. Returns the language used for syntax colours.
 */
export function parseDiffLanguage(language) {
  const value = String(language || '').toLowerCase();
  if (value === 'diff') return { isDiff: true, syntaxLanguage: 'diff' };
  if (value.startsWith('diff-') && value.length > 5) {
    return { isDiff: true, syntaxLanguage: value.slice(5) };
  }
  return { isDiff: false, syntaxLanguage: value };
}

/** Classify a diff line by its leading marker; non-diff blocks never mark lines. */
export function getDiffLineKind(line, isDiff) {
  if (!isDiff) return null;
  if (line.startsWith('+') && !line.startsWith('+++')) return 'added';
  if (line.startsWith('-') && !line.startsWith('---')) return 'removed';
  return null;
}

/**
 * Card links accept site-relative paths (`/docs/...`) and https URLs only.
 * Anything else (protocol-relative, javascript:, data:) is dropped.
 */
export function sanitizeCardHref(href) {
  const value = String(href || '').trim();
  if (/^\/(?!\/)[^\s"'<>]*$/.test(value)) return value;
  if (/^https:\/\/[^\s"'<>]+$/i.test(value)) return value;
  return null;
}
