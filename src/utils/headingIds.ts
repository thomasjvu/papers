/** GitHub-style heading id; repeated headings get `-2`, `-3`, ... suffixes tracked in `counts`. */
export function createHeadingId(text: string, counts: Map<string, number>): string {
  const baseId =
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section';

  const currentCount = counts.get(baseId) ?? 0;
  counts.set(baseId, currentCount + 1);

  return currentCount === 0 ? baseId : `${baseId}-${currentCount + 1}`;
}
