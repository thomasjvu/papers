export type OpenApiSchemaNode = {
  kind: 'reference' | 'primitive' | 'array' | 'object' | 'union' | 'unknown';
  name?: string;
  ref?: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  nullable?: boolean;
  default?: unknown;
  description?: string;
  reason?: string;
  variant?: 'oneOf' | 'anyOf' | 'allOf';
  schemas?: OpenApiSchemaNode[];
  items?: OpenApiSchemaNode;
  properties?: Array<{
    name: string;
    required: boolean;
    description?: string;
    schema: OpenApiSchemaNode;
  }>;
  additionalProperties?: boolean | OpenApiSchemaNode;
};

export type OpenApiExample = {
  name: string;
  summary?: string;
  value?: unknown;
  externalValue?: string;
};

export type OpenApiContent = {
  mediaType: string;
  schema: string;
  schemaNode: OpenApiSchemaNode;
  examples: OpenApiExample[];
};

export type OpenApiParameter = {
  name: string;
  in: string;
  required: boolean;
  description?: string;
  schema: string;
  schemaNode: OpenApiSchemaNode;
  example?: unknown;
  examples?: Record<string, unknown>;
  ref?: string;
};

export type OpenApiCodeSamples = {
  curl: string;
  javascript: string;
  python: string;
  notes: string[];
};

export type OpenApiOperation = {
  id: string;
  routePath: string;
  canonicalPath: string;
  method: string;
  path: string;
  operationId: string | null;
  summary: string;
  description: string;
  tags: string[];
  routeTag: string;
  parameters: OpenApiParameter[];
  requestBody: {
    required: boolean;
    description?: string;
    content: OpenApiContent[];
    ref?: string;
  } | null;
  responses: Array<{
    status: string;
    description: string;
    content: OpenApiContent[];
    headers?: Array<{ name: string }>;
    ref?: string;
  }>;
  servers: Array<{ url: string; description?: string; variables?: Record<string, unknown> }>;
  security: Array<Record<string, string[]>>;
  source: { path: string; method: string; pointer: string };
  componentRefs: string[];
  codeSamples: OpenApiCodeSamples;
};

export type OpenApiSchemaArtifact = {
  name: string;
  routePath: string;
  canonicalPath: string;
  type: string;
  description?: string;
  required: string[];
  properties: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
    schemaNode: OpenApiSchemaNode;
  }>;
  schemaNode: OpenApiSchemaNode;
  source: { pointer: string };
  typescript: string;
};

export type OpenApiSecurityScheme = {
  name: string;
  type?: string;
  scheme?: string;
  in?: string;
};

export type OpenApiSpecArtifact = {
  id: string;
  label: string;
  url: string;
  description?: string;
  source: { kind: 'local' | 'remote'; value: string };
  routePath: string;
  title?: string;
  version?: string;
  servers?: Array<{ url: string; description?: string; variables?: Record<string, unknown> }>;
  security?: Array<Record<string, string[]>>;
  securitySchemes?: OpenApiSecurityScheme[];
  tags?: Array<{ name: string; description?: string }>;
  operations?: OpenApiOperation[];
  schemas?: OpenApiSchemaArtifact[];
  componentRefs?: string[];
  typescript?: string;
  counts: { operations: number | null; schemas: number | null; tags: number | null };
  remote?: boolean;
};

export type OpenApiArtifacts = {
  schemaVersion: 1;
  contractVersion: 2;
  generatedBy: string;
  generated: string;
  specs: OpenApiSpecArtifact[];
};

let cachedArtifacts: OpenApiArtifacts | null = null;

export async function loadOpenApiArtifacts(): Promise<OpenApiArtifacts | null> {
  if (cachedArtifacts) {
    return cachedArtifacts;
  }

  try {
    const response = await fetch('/openapi-artifacts.json');
    if (!response.ok) {
      return null;
    }

    const artifacts = (await response.json()) as OpenApiArtifacts;
    if (
      artifacts.schemaVersion !== 1 ||
      artifacts.contractVersion !== 2 ||
      !Array.isArray(artifacts.specs)
    ) {
      return null;
    }

    cachedArtifacts = artifacts;
    return artifacts;
  } catch {
    return null;
  }
}
