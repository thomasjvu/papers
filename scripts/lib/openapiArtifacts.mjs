import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parse } from 'yaml';

import { openapiConfig as defaultOpenapiConfig } from '../../shared/documentation-config.js';
import { assertValidOpenApiConfig, validateOpenApiSpecUrl } from '../../shared/openapiSpecUrls.js';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getReferenceName(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/^#\/components\/schemas\/([^/]+)$/);
  return match ? match[1] : value;
}

function schemaType(schema, depth = 0) {
  if (!isRecord(schema) || depth > 4) {
    return 'unknown';
  }

  const reference = getReferenceName(schema.$ref);
  if (reference) {
    return reference;
  }

  if (Array.isArray(schema.oneOf)) {
    return schema.oneOf.map((item) => schemaType(item, depth + 1)).join(' | ');
  }

  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.map((item) => schemaType(item, depth + 1)).join(' | ');
  }

  if (schema.type === 'array') {
    return `Array<${schemaType(schema.items, depth + 1)}>`;
  }

  if (schema.type === 'object' || schema.properties) {
    return 'object';
  }

  if (Array.isArray(schema.enum)) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  }

  return typeof schema.type === 'string' ? schema.type : 'unknown';
}

function normalizeExamples(mediaType) {
  if (!isRecord(mediaType)) {
    return [];
  }

  const examples = [];
  if (Object.hasOwn(mediaType, 'example')) {
    examples.push({ name: 'default', value: mediaType.example });
  }

  for (const [name, example] of Object.entries(mediaType.examples || {})) {
    if (!isRecord(example)) {
      examples.push({ name, value: example });
      continue;
    }

    examples.push({
      name,
      ...(typeof example.summary === 'string' ? { summary: example.summary } : {}),
      ...(Object.hasOwn(example, 'value') ? { value: example.value } : {}),
      ...(typeof example.externalValue === 'string'
        ? { externalValue: example.externalValue }
        : {}),
    });
  }

  return examples;
}

function normalizeContent(content) {
  if (!isRecord(content)) {
    return [];
  }

  return Object.entries(content)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([mediaType, media]) => ({
      mediaType,
      schema: schemaType(media?.schema),
      examples: normalizeExamples(media),
    }));
}

function normalizeParameter(parameter) {
  if (!isRecord(parameter)) {
    return null;
  }

  return {
    name: typeof parameter.name === 'string' ? parameter.name : 'unnamed',
    in: typeof parameter.in === 'string' ? parameter.in : 'unknown',
    required: Boolean(parameter.required),
    ...(typeof parameter.description === 'string' ? { description: parameter.description } : {}),
    schema: schemaType(parameter.schema),
    ...(Object.hasOwn(parameter, 'example') ? { example: parameter.example } : {}),
  };
}

function normalizeOperation(path, method, operation, pathItem) {
  const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
  const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : [];
  const parameterMap = new Map();

  for (const parameter of [...pathParameters, ...operationParameters]) {
    const normalized = normalizeParameter(parameter);
    if (normalized) {
      parameterMap.set(`${normalized.in}:${normalized.name}`, normalized);
    }
  }

  const responses = Object.entries(operation.responses || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, response]) => ({
      status,
      description: typeof response?.description === 'string' ? response.description : '',
      content: normalizeContent(response?.content),
    }));

  return {
    method: method.toUpperCase(),
    path,
    operationId: typeof operation.operationId === 'string' ? operation.operationId : null,
    summary: typeof operation.summary === 'string' ? operation.summary : '',
    description: typeof operation.description === 'string' ? operation.description : '',
    tags: Array.isArray(operation.tags) ? operation.tags.filter((tag) => typeof tag === 'string') : [],
    parameters: Array.from(parameterMap.values()).sort(
      (left, right) => left.in.localeCompare(right.in) || left.name.localeCompare(right.name)
    ),
    requestBody: operation.requestBody
      ? {
          required: Boolean(operation.requestBody.required),
          content: normalizeContent(operation.requestBody.content),
        }
      : null,
    responses,
  };
}

function normalizeOperations(paths) {
  if (!isRecord(paths)) {
    return [];
  }

  return Object.entries(paths)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([path, pathItem]) =>
      HTTP_METHODS.filter((method) => isRecord(pathItem?.[method])).map((method) =>
        normalizeOperation(path, method, pathItem[method], pathItem)
      )
    );
}

function normalizeSchemas(schemas) {
  if (!isRecord(schemas)) {
    return [];
  }

  return Object.entries(schemas)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, schema]) => {
      const required = new Set(Array.isArray(schema?.required) ? schema.required : []);
      const properties = Object.entries(schema?.properties || {})
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([propertyName, property]) => ({
          name: propertyName,
          type: schemaType(property),
          required: required.has(propertyName),
          ...(typeof property?.description === 'string'
            ? { description: property.description }
            : {}),
        }));

      return {
        name,
        type: schemaType(schema),
        ...(typeof schema?.description === 'string' ? { description: schema.description } : {}),
        required: Array.from(required).sort(),
        properties,
      };
    });
}

function createParsedSpec(spec, url, document) {
  if (!isRecord(document) || !isRecord(document.info) || !isRecord(document.paths)) {
    throw new Error(`OpenAPI asset ${url} must contain info and paths objects.`);
  }

  const operations = normalizeOperations(document.paths);
  const schemas = normalizeSchemas(document.components?.schemas);

  return {
    title: typeof document.info.title === 'string' ? document.info.title : spec.label,
    version: typeof document.info.version === 'string' ? document.info.version : 'unknown',
    description: typeof document.info.description === 'string' ? document.info.description : '',
    servers: Array.isArray(document.servers)
      ? document.servers
          .filter((server) => typeof server?.url === 'string')
          .map((server) => ({
            url: server.url,
            ...(typeof server.description === 'string' ? { description: server.description } : {}),
          }))
      : [],
    tags: Array.isArray(document.tags)
      ? document.tags
          .filter((tag) => typeof tag?.name === 'string')
          .map((tag) => ({
            name: tag.name,
            ...(typeof tag.description === 'string' ? { description: tag.description } : {}),
          }))
      : [],
    operations,
    schemas,
    counts: {
      operations: operations.length,
      schemas: schemas.length,
      tags: Array.isArray(document.tags) ? document.tags.length : 0,
    },
  };
}

export async function createOpenApiArtifacts({
  rootDir = process.cwd(),
  publicDir = join(rootDir, 'public'),
  config = defaultOpenapiConfig,
} = {}) {
  assertValidOpenApiConfig(config);
  const specs = [];

  for (const spec of config.specs) {
    const validated = validateOpenApiSpecUrl(spec.url, config);
    const record = {
      id: spec.id,
      label: spec.label,
      url: spec.url,
      ...(spec.description ? { description: spec.description } : {}),
      source: {
        kind: validated.kind,
        value: validated.value,
      },
    };

    if (validated.kind === 'local') {
      const filePath = join(publicDir, validated.value.replace(/^\/+/, ''));
      let source;
      try {
        source = await readFile(filePath, 'utf8');
      } catch (error) {
        throw new Error(`Unable to read local OpenAPI asset ${spec.url}: ${error.message}`);
      }

      let document;
      try {
        document = parse(source);
      } catch (error) {
        throw new Error(`Unable to parse local OpenAPI asset ${spec.url}: ${error.message}`);
      }

      Object.assign(record, createParsedSpec(spec, spec.url, document));
    } else {
      record.remote = true;
      record.counts = { operations: null, schemas: null, tags: null };
    }

    specs.push(record);
  }

  const core = { schemaVersion: 1, specs };
  const fingerprint = createHash('sha256').update(JSON.stringify(core)).digest('hex');

  return {
    ...core,
    generated: fingerprint,
  };
}
