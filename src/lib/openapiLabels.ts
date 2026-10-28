import type { OpenApiSchemaNode } from './openapiArtifacts';

type SchemaKind = OpenApiSchemaNode['kind'];

const unionSeparator = (node: OpenApiSchemaNode) => (node.variant === 'allOf' ? ' & ' : ' | ');

const enumLabel = (values: unknown[]) => values.map((value) => JSON.stringify(value)).join(' | ');

const labelByKind: Partial<Record<SchemaKind, (node: OpenApiSchemaNode) => string>> = {
  reference: (node) => node.name || node.ref || 'unknown',
  array: (node) => `Array<${schemaLabel(node.items)}>`,
  union: (node) => node.schemas?.map(schemaLabel).join(unionSeparator(node)) || 'unknown',
  object: () => 'object',
  primitive: (node) => (node.enum?.length ? enumLabel(node.enum) : typeLabel(node)),
};

function typeLabel(node: OpenApiSchemaNode): string {
  return node.type || 'unknown';
}

/** Short TypeScript-like label for a schema node, e.g. `Array<Pet>` or `"a" | "b"`. */
export function schemaLabel(node: OpenApiSchemaNode | undefined): string {
  if (!node) return 'unknown';
  return (labelByKind[node.kind] ?? typeLabel)(node);
}

export function valueLabel(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2) || '';
  } catch {
    return String(value);
  }
}
