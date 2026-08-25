export type OpenApiExample = {
  name: string;
  summary?: string;
  value?: unknown;
  externalValue?: string;
};

export type OpenApiContent = {
  mediaType: string;
  schema: string;
  examples: OpenApiExample[];
};

export type OpenApiOperation = {
  method: string;
  path: string;
  operationId: string | null;
  summary: string;
  description: string;
  tags: string[];
  parameters: Array<{
    name: string;
    in: string;
    required: boolean;
    description?: string;
    schema: string;
    example?: unknown;
  }>;
  requestBody: {
    required: boolean;
    content: OpenApiContent[];
  } | null;
  responses: Array<{
    status: string;
    description: string;
    content: OpenApiContent[];
  }>;
};

export type OpenApiSpecArtifact = {
  id: string;
  label: string;
  url: string;
  description?: string;
  source: { kind: 'local' | 'remote'; value: string };
  title?: string;
  version?: string;
  servers?: Array<{ url: string; description?: string }>;
  tags?: Array<{ name: string; description?: string }>;
  operations?: OpenApiOperation[];
  schemas?: Array<{
    name: string;
    type: string;
    description?: string;
    required: string[];
    properties: Array<{ name: string; type: string; required: boolean; description?: string }>;
  }>;
  counts: { operations: number | null; schemas: number | null; tags: number | null };
  remote?: boolean;
};

export type OpenApiArtifacts = {
  schemaVersion: number;
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
    if (artifacts.schemaVersion !== 1 || !Array.isArray(artifacts.specs)) {
      return null;
    }

    cachedArtifacts = artifacts;
    return artifacts;
  } catch {
    return null;
  }
}
