/**
 * Code fence metadata shared by the Markdown runtime (src/utils/markdownCore.ts)
 * and the MDX build pipeline (scripts/lib/mdxAuthoring.mjs), so both formats
 * read `title="..."`, `{1,3-5}`, and `diff` fences identically.
 */

const MAX_HIGHLIGHT_LINE = 10000;

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

/** Classify a diff line by its leading marker; non-diff blocks never mark lines. */
export function getDiffLineKind(line, isDiff) {
  if (!isDiff) return null;
  if (line.startsWith('+') && !line.startsWith('+++')) return 'added';
  if (line.startsWith('-') && !line.startsWith('---')) return 'removed';
  return null;
}
