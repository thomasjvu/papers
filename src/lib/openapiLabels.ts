import type { OpenApiSchemaNode } from './openapiArtifacts';

export function schemaLabel(node: OpenApiSchemaNode | undefined): string {
  if (!node) return 'unknown';
  if (node.kind === 'reference') return node.name || node.ref || 'unknown';
  if (node.kind === 'array') return `Array<${schemaLabel(node.items)}>`;
  if (node.kind === 'union') {
    const separator = node.variant === 'allOf' ? ' & ' : ' | ';
    return node.schemas?.map(schemaLabel).join(separator) || 'unknown';
  }
  if (node.kind === 'object') return 'object';
  if (node.kind === 'primitive' && node.enum?.length) {
    return node.enum.map((value) => JSON.stringify(value)).join(' | ');
  }
  return node.type || 'unknown';
}

export function valueLabel(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2) || '';
  } catch {
    return String(value);
  }
}
