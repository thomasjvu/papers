const UTF8_BOM = /^\uFEFF/;
export function stripMarkdownBom(content: string): string {
  return content.replace(UTF8_BOM, '');
}
export function extractTopLevelMarkdownTitle(content: string): string | null {
  const normalizedContent = stripMarkdownBom(content);
  const titleMatch = normalizedContent.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}
