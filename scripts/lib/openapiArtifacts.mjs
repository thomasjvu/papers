import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parse } from 'yaml';

import { openapiConfig as defaultOpenapiConfig } from '../../shared/documentation-config.js';
import {
  buildOpenApiModelRoutePath,
  buildOpenApiOperationRoutePath,
  buildOpenApiRoutePath,
  createOpenApiRouteSuffix,
} from '../../shared/openapiRouting.js';
import { assertValidOpenApiConfig, validateOpenApiSpecUrl } from '../../shared/openapiSpecUrls.js';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
const MAX_SCHEMA_DEPTH = 8;
const MAX_SCHEMA_NODES = 256;
export const OPENAPI_ARTIFACT_SCHEMA_VERSION = 1;
export const OPENAPI_ARTIFACT_CONTRACT_VERSION = 2;
export const OPENAPI_ARTIFACT_MAX_BYTES = 1_000_000;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function pointerJoin(pointer, segment) {
  return `${pointer}/${String(segment).replace(/~/g, '~0').replace(/\//g, '~1')}`;
}

function fail(specUrl, pointer, message) {
  throw new Error(`OpenAPI asset ${specUrl} at ${pointer || '/'}: ${message}`);
}

function getReferenceName(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/^#\/components\/schemas\/([^/]+)$/);
  return match ? decodeURIComponent(match[1].replace(/~1/g, '/').replace(/~0/g, '~')) : null;
}

function resolveJsonPointer(document, reference, specUrl, pointer) {
  if (typeof reference !== 'string' || !reference.startsWith('#/')) {
    fail(specUrl, pointer, `external or unsupported $ref "${String(reference)}" is not allowed.`);
  }

  let current = document;
  for (const token of reference.slice(2).split('/')) {
    const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
    if (!isRecord(current) && !Array.isArray(current)) {
      fail(specUrl, pointer, `cannot resolve $ref "${reference}".`);
    }

    current = current[key];
    if (current === undefined) {
      fail(specUrl, pointer, `cannot resolve $ref "${reference}".`);
    }
  }

  return current;
}

function resolveReference(value, context, pointer) {
  if (!isRecord(value) || typeof value.$ref !== 'string') {
    return { value, reference: null };
  }

  return {
    value: resolveJsonPointer(context.document, value.$ref, context.specUrl, pointer),
    reference: value.$ref,
  };
}

function collectReferences(value, context, pointer = '/', references = new Set(), seen = new Set()) {
  if (value === null || value === undefined || typeof value !== 'object') {
    return references;
  }

  if (isRecord(value) && typeof value.$ref === 'string') {
    if (!value.$ref.startsWith('#/')) {
      fail(context.specUrl, pointer, `external or unsupported $ref "${value.$ref}" is not allowed.`);
    }
    references.add(value.$ref);
    return references;
  }

  if (seen.has(value)) {
    return references;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectReferences(item, context, pointerJoin(pointer, index), references, seen));
  } else {
    Object.entries(value).forEach(([key, child]) =>
      collectReferences(child, context, pointerJoin(pointer, key), references, seen)
    );
  }

  return references;
}

function normalizeNullable(schema) {
  if (schema?.nullable === true) {
    return true;
  }

  return Array.isArray(schema?.type) && schema.type.includes('null');
}

function primitiveTypeFor(schema) {
  if (Array.isArray(schema?.type)) {
    return schema.type.find((type) => type !== 'null') || 'unknown';
  }

  if (typeof schema?.type === 'string') {
    return schema.type;
  }

  if (Array.isArray(schema?.enum) && schema.enum.length > 0) {
    const value = schema.enum.find((item) => item !== null);
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
  }

  return 'unknown';
}

function normalizeSchema(schema, context, pointer = '/', state = { depth: 0, nodes: 0 }) {
  const resolved = resolveReference(schema, context, pointer);
  if (resolved.reference) {
    const name = getReferenceName(resolved.reference);
    return {
      kind: 'reference',
      ref: resolved.reference,
      name: name || resolved.reference,
      nullable: normalizeNullable(schema),
    };
  }

  if (!isRecord(resolved.value)) {
    return { kind: 'unknown', reason: 'schema-is-not-an-object' };
  }

  state.nodes += 1;
  if (state.nodes > MAX_SCHEMA_NODES) {
    return { kind: 'unknown', reason: 'schema-node-limit-exceeded' };
  }
  if (state.depth > MAX_SCHEMA_DEPTH) {
    return { kind: 'unknown', reason: 'schema-depth-limit-exceeded' };
  }

  const schemaValue = resolved.value;
  const nullable = normalizeNullable(schemaValue);
  const base = {
    ...(nullable ? { nullable: true } : {}),
    ...(typeof schemaValue.description === 'string' ? { description: schemaValue.description } : {}),
    ...(Object.hasOwn(schemaValue, 'default') ? { default: cloneJson(schemaValue.default) } : {}),
  };

  for (const unsupportedKey of ['not', 'if', 'then', 'else', 'dependentSchemas']) {
    if (Object.hasOwn(schemaValue, unsupportedKey)) {
      fail(context.specUrl, pointerJoin(pointer, unsupportedKey), `schema keyword "${unsupportedKey}" is unsupported.`);
    }
  }

  for (const variant of ['oneOf', 'anyOf', 'allOf']) {
    if (Object.hasOwn(schemaValue, variant)) {
      if (!Array.isArray(schemaValue[variant])) {
        fail(context.specUrl, pointerJoin(pointer, variant), `${variant} must be an array.`);
      }

      return {
        kind: 'union',
        variant,
        schemas: schemaValue[variant].map((item, index) =>
          normalizeSchema(item, context, pointerJoin(pointer, variant) + `/${index}`, {
            depth: state.depth + 1,
            nodes: state.nodes,
          })
        ),
        ...base,
      };
    }
  }

  if (Array.isArray(schemaValue.enum)) {
    return {
      kind: 'primitive',
      type: primitiveTypeFor(schemaValue),
      enum: cloneJson(schemaValue.enum),
      ...(typeof schemaValue.format === 'string' ? { format: schemaValue.format } : {}),
      ...base,
    };
  }

  if (schemaValue.type === 'array' || Object.hasOwn(schemaValue, 'items')) {
    return {
      kind: 'array',
      items: normalizeSchema(schemaValue.items, context, pointerJoin(pointer, 'items'), {
        depth: state.depth + 1,
        nodes: state.nodes,
      }),
      ...base,
    };
  }

  if (schemaValue.type === 'object' || isRecord(schemaValue.properties) || Object.hasOwn(schemaValue, 'additionalProperties')) {
    const required = new Set(Array.isArray(schemaValue.required) ? schemaValue.required : []);
    const properties = Object.entries(schemaValue.properties || {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, property]) => ({
        name,
        required: required.has(name),
        ...(typeof property?.description === 'string' ? { description: property.description } : {}),
        schema: normalizeSchema(property, context, pointerJoin(pointerJoin(pointer, 'properties'), name), {
          depth: state.depth + 1,
          nodes: state.nodes,
        }),
      }));
    const additionalProperties = schemaValue.additionalProperties;

    return {
      kind: 'object',
      properties,
      ...(isRecord(additionalProperties)
        ? { additionalProperties: normalizeSchema(additionalProperties, context, pointerJoin(pointer, 'additionalProperties'), {
            depth: state.depth + 1,
            nodes: state.nodes,
          }) }
        : typeof additionalProperties === 'boolean'
          ? { additionalProperties }
          : {}),
      ...base,
    };
  }

  const type = primitiveTypeFor(schemaValue);
  if (type !== 'unknown' || typeof schemaValue.format === 'string') {
    return {
      kind: 'primitive',
      type,
      ...(typeof schemaValue.format === 'string' ? { format: schemaValue.format } : {}),
      ...base,
    };
  }

  return { kind: 'unknown', reason: 'unsupported-schema-shape', ...base };
}

function schemaType(schema) {
  if (!schema || typeof schema !== 'object') {
    return 'unknown';
  }
  if (schema.kind === 'reference') return schema.name;
  if (schema.kind === 'union') {
    const separator = schema.variant === 'allOf' ? ' & ' : ' | ';
    return schema.schemas.map(schemaType).join(separator) || 'unknown';
  }
  if (schema.kind === 'array') return `Array<${schemaType(schema.items)}>`;
  if (schema.kind === 'object') return 'object';
  if (schema.kind === 'primitive' && Array.isArray(schema.enum)) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  }
  return schema.type || 'unknown';
}

function normalizeExamples(mediaType, context, pointer) {
  if (!isRecord(mediaType)) {
    return [];
  }

  const examples = [];
  if (Object.hasOwn(mediaType, 'example')) {
    examples.push({ name: 'default', value: cloneJson(mediaType.example) });
  }

  if (mediaType.examples !== undefined && !isRecord(mediaType.examples)) {
    fail(context.specUrl, pointerJoin(pointer, 'examples'), 'examples must be an object.');
  }

  for (const [name, example] of Object.entries(mediaType.examples || {})) {
    if (!isRecord(example)) {
      examples.push({ name, value: cloneJson(example) });
      continue;
    }

    examples.push({
      name,
      ...(typeof example.summary === 'string' ? { summary: example.summary } : {}),
      ...(Object.hasOwn(example, 'value') ? { value: cloneJson(example.value) } : {}),
      ...(typeof example.externalValue === 'string' ? { externalValue: example.externalValue } : {}),
    });
  }

  return examples;
}

function normalizeContent(content, context, pointer) {
  if (content === undefined || content === null) {
    return [];
  }
  if (!isRecord(content)) {
    fail(context.specUrl, pointer, 'content must be an object.');
  }

  return Object.entries(content)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([mediaType, media]) => {
      if (!isRecord(media)) {
        fail(context.specUrl, pointerJoin(pointer, mediaType), 'media type definition must be an object.');
      }

      const schemaNode = normalizeSchema(media.schema, context, pointerJoin(pointerJoin(pointer, mediaType), 'schema'));
      return {
        mediaType,
        schema: schemaType(schemaNode),
        schemaNode,
        examples: normalizeExamples(media, context, pointerJoin(pointer, mediaType)),
      };
    });
}

function normalizeParameter(parameter, context, pointer) {
  const resolved = resolveReference(parameter, context, pointer);
  if (!isRecord(resolved.value)) {
    fail(context.specUrl, pointer, 'parameter must be an object or an internal $ref.');
  }

  const value = resolved.value;
  if (typeof value.name !== 'string' || !value.name.trim()) {
    fail(context.specUrl, pointerJoin(pointer, 'name'), 'parameter name must be a non-empty string.');
  }
  if (typeof value.in !== 'string' || !value.in.trim()) {
    fail(context.specUrl, pointerJoin(pointer, 'in'), 'parameter location must be a non-empty string.');
  }

  const schemaNode = normalizeSchema(value.schema, context, pointerJoin(pointer, 'schema'));
  return {
    name: value.name,
    in: value.in,
    required: Boolean(value.required) || value.in === 'path',
    ...(typeof value.description === 'string' ? { description: value.description } : {}),
    schema: schemaType(schemaNode),
    schemaNode,
    ...(Object.hasOwn(value, 'example') ? { example: cloneJson(value.example) } : {}),
    ...(isRecord(value.examples) ? { examples: cloneJson(value.examples) } : {}),
    ...(resolved.reference ? { ref: resolved.reference } : {}),
  };
}

function normalizeRequestBody(requestBody, context, pointer) {
  if (!requestBody) return null;
  const resolved = resolveReference(requestBody, context, pointer);
  if (!isRecord(resolved.value)) {
    fail(context.specUrl, pointer, 'requestBody must be an object or an internal $ref.');
  }

  return {
    required: Boolean(resolved.value.required),
    ...(typeof resolved.value.description === 'string' ? { description: resolved.value.description } : {}),
    content: normalizeContent(resolved.value.content, context, pointerJoin(pointer, 'content')),
    ...(resolved.reference ? { ref: resolved.reference } : {}),
  };
}

function normalizeResponse(response, context, pointer) {
  const resolved = resolveReference(response, context, pointer);
  if (!isRecord(resolved.value)) {
    fail(context.specUrl, pointer, 'response must be an object or an internal $ref.');
  }

  return {
    description: typeof resolved.value.description === 'string' ? resolved.value.description : '',
    content: normalizeContent(resolved.value.content, context, pointerJoin(pointer, 'content')),
    ...(isRecord(resolved.value.headers)
      ? {
          headers: Object.keys(resolved.value.headers)
            .sort()
            .map((name) => ({ name })),
        }
      : {}),
    ...(resolved.reference ? { ref: resolved.reference } : {}),
  };
}

function normalizeServers(servers, context, pointer) {
  if (servers === undefined || servers === null) return [];
  if (!Array.isArray(servers)) fail(context.specUrl, pointer, 'servers must be an array.');

  return servers.filter(Boolean).map((server, index) => {
    if (!isRecord(server) || typeof server.url !== 'string' || !server.url.trim()) {
      fail(context.specUrl, pointerJoin(pointer, index), 'server must contain a non-empty url.');
    }

    return {
      url: server.url,
      ...(typeof server.description === 'string' ? { description: server.description } : {}),
      ...(isRecord(server.variables)
        ? {
            variables: Object.fromEntries(
              Object.entries(server.variables).map(([name, variable]) => [
                name,
                {
                  ...(typeof variable?.default === 'string' ? { default: variable.default } : {}),
                  ...(Array.isArray(variable?.enum) ? { enum: cloneJson(variable.enum) } : {}),
                },
              ])
            ),
          }
        : {}),
    };
  });
}

function normalizeOperation(path, method, operationDefinition, pathItem, context, pointer, specServers, specSecurity) {
  const resolvedOperation = resolveReference(operationDefinition, context, pointer);
  if (!isRecord(resolvedOperation.value)) {
    fail(context.specUrl, pointer, 'operation must be an object or an internal $ref.');
  }
  const value = resolvedOperation.value;
  if (!isRecord(value.responses)) {
    fail(context.specUrl, pointerJoin(pointer, 'responses'), 'operation must contain a responses object.');
  }

  const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
  const operationParameters = Array.isArray(value.parameters) ? value.parameters : [];
  const parameterMap = new Map();
  for (const [index, parameter] of [...pathParameters, ...operationParameters].entries()) {
    const normalized = normalizeParameter(parameter, context, pointerJoin(pointer, `parameters/${index}`));
    parameterMap.set(`${normalized.in}:${normalized.name}`, normalized);
  }

  const responses = Object.entries(value.responses)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, response]) => ({
      status,
      ...normalizeResponse(response, context, pointerJoin(pointerJoin(pointer, 'responses'), status)),
    }));

  const operationId = typeof value.operationId === 'string' && value.operationId.trim() ? value.operationId.trim() : null;
  const tags = Array.isArray(value.tags) ? value.tags.filter((tag) => typeof tag === 'string' && tag.trim()) : [];
  const source = {
    path,
    method: method.toUpperCase(),
    pointer,
  };
  const operation = {
    id: operationId || `${method}_${path}`,
    method: method.toUpperCase(),
    path,
    operationId,
    summary: typeof value.summary === 'string' ? value.summary : '',
    description: typeof value.description === 'string' ? value.description : '',
    tags,
    routeTag: tags[0] || 'untagged',
    parameters: Array.from(parameterMap.values()).sort(
      (left, right) => left.in.localeCompare(right.in) || left.name.localeCompare(right.name)
    ),
    requestBody: normalizeRequestBody(value.requestBody, context, pointerJoin(pointer, 'requestBody')),
    responses,
    servers: normalizeServers(value.servers ?? specServers, context, pointerJoin(pointer, 'servers')),
    security: cloneJson(value.security ?? specSecurity ?? []),
    source,
    componentRefs: Array.from(collectReferences(value, context, pointer)).sort(),
  };

  operation.codeSamples = createCodeSamples(operation);
  return operation;
}

function normalizeOperations(paths, context, specServers, specSecurity) {
  if (!isRecord(paths)) {
    fail(context.specUrl, '/paths', 'paths must be an object.');
  }

  const operations = [];
  for (const [path, pathItem] of Object.entries(paths).sort(([left], [right]) => left.localeCompare(right))) {
    const pathPointer = pointerJoin('/paths', path);
    if (!path.startsWith('/')) {
      fail(context.specUrl, pathPointer, 'path keys must start with /.');
    }
    if (!isRecord(pathItem)) {
      fail(context.specUrl, pathPointer, 'path item must be an object.');
    }

    for (const method of HTTP_METHODS) {
      if (pathItem[method] === undefined) continue;
      if (!isRecord(pathItem[method]) && !(isRecord(pathItem[method]) && pathItem[method].$ref)) {
        fail(context.specUrl, pointerJoin(pathPointer, method), 'operation must be an object.');
      }
      operations.push(
        normalizeOperation(
          path,
          method,
          pathItem[method],
          pathItem,
          context,
          pointerJoin(pathPointer, method),
          specServers,
          specSecurity
        )
      );
    }
  }

  const ids = new Map();
  return operations.map((operation) => {
    const count = (ids.get(operation.id) || 0) + 1;
    ids.set(operation.id, count);
    return count === 1 ? operation : { ...operation, id: `${operation.id}-${count}` };
  });
}

function normalizeSchemas(schemas, context) {
  if (schemas === undefined || schemas === null) return [];
  if (!isRecord(schemas)) fail(context.specUrl, '/components/schemas', 'schemas must be an object.');

  return Object.entries(schemas)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, schema]) => {
      const schemaNode = normalizeSchema(schema, context, pointerJoin('/components/schemas', name));
      const properties = schemaNode.kind === 'object' ? schemaNode.properties || [] : [];

      return {
        name,
        type: schemaType(schemaNode),
        ...(typeof schema?.description === 'string' ? { description: schema.description } : {}),
        required: properties.filter((property) => property.required).map((property) => property.name).sort(),
        properties: properties.map((property) => ({
          name: property.name,
          type: schemaType(property.schema),
          required: property.required,
          ...(property.description ? { description: property.description } : {}),
          schemaNode: property.schema,
        })),
        schemaNode,
        source: { pointer: pointerJoin('/components/schemas', name) },
      };
    });
}

function typeName(value) {
  const words = String(value || 'Model')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const result = words.map((word) => word[0].toUpperCase() + word.slice(1)).join('');
  return /^[A-Za-z_]/.test(result) ? result : `Model${result}`;
}

function tsPropertyName(value) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : JSON.stringify(value);
}

function nullableType(value, node) {
  return node?.nullable ? `${value} | null` : value;
}

function schemaToTypeScript(node) {
  if (!node || typeof node !== 'object') return 'unknown';
  if (node.kind === 'reference') return nullableType(typeName(node.name), node);
  if (node.kind === 'unknown') return nullableType('unknown', node);
  if (node.kind === 'array') return nullableType(`Array<${schemaToTypeScript(node.items)}>`, node);
  if (node.kind === 'union') {
    const separator = node.variant === 'allOf' ? ' & ' : ' | ';
    return nullableType(node.schemas.map(schemaToTypeScript).join(separator) || 'unknown', node);
  }
  if (node.kind === 'object') {
    const members = (node.properties || []).map((property) => {
      const optional = property.required ? '' : '?';
      return `${tsPropertyName(property.name)}${optional}: ${schemaToTypeScript(property.schema)};`;
    });
    const additional = node.additionalProperties && typeof node.additionalProperties === 'object'
      ? `[key: string]: ${schemaToTypeScript(node.additionalProperties)};`
      : node.additionalProperties === true
        ? '[key: string]: unknown;'
        : '';
    return nullableType(`{ ${[...members, additional].filter(Boolean).join(' ')} }`, node);
  }
  if (Array.isArray(node.enum)) {
    return nullableType(node.enum.map((value) => JSON.stringify(value)).join(' | ') || 'unknown', node);
  }

  const primitive = node.type === 'integer' || node.type === 'number' ? 'number' : node.type === 'boolean' ? 'boolean' : node.type === 'string' ? 'string' : node.type === 'null' ? 'null' : 'unknown';
  return nullableType(primitive, node);
}

function renderTypeScriptDefinition(model) {
  const name = typeName(model.name);
  if (model.schemaNode?.kind === 'object') {
    const lines = [`export interface ${name} {`];
    for (const property of model.schemaNode.properties || []) {
      if (property.description) lines.push(`  /** ${property.description.replace(/\*\//g, '* /')} */`);
      lines.push(`  ${tsPropertyName(property.name)}${property.required ? '' : '?'}: ${schemaToTypeScript(property.schema)};`);
    }
    if (model.schemaNode.additionalProperties && typeof model.schemaNode.additionalProperties === 'object') {
      lines.push(`  [key: string]: ${schemaToTypeScript(model.schemaNode.additionalProperties)};`);
    } else if (model.schemaNode.additionalProperties === true) {
      lines.push('  [key: string]: unknown;');
    }
    lines.push('}');
    return lines.join('\n');
  }

  return `export type ${name} = ${schemaToTypeScript(model.schemaNode)};`;
}

function explicitExample(parameter) {
  if (Object.hasOwn(parameter, 'example')) return parameter.example;
  if (isRecord(parameter.examples)) {
    const example = Object.values(parameter.examples).find((entry) => isRecord(entry) && Object.hasOwn(entry, 'value'));
    if (example) return example.value;
  }
  if (Object.hasOwn(parameter.schemaNode || {}, 'default')) return parameter.schemaNode.default;
  if (Array.isArray(parameter.schemaNode?.enum) && parameter.schemaNode.enum.length > 0) return parameter.schemaNode.enum[0];
  return undefined;
}

function contentExample(content) {
  for (const item of content || []) {
    const example = item.examples?.find((entry) => Object.hasOwn(entry, 'value'));
    if (example) return { mediaType: item.mediaType, value: example.value };
  }
  return null;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function replacePathParameters(path, parameters, notes) {
  return path.replace(/\{([^}]+)\}/g, (_, name) => {
    const parameter = parameters.find((item) => item.in === 'path' && item.name === name);
    const value = parameter ? explicitExample(parameter) : undefined;
    if (value === undefined) {
      notes.push(`Path parameter ${name} has no declared example; replace the placeholder before sending.`);
      return `{${name}}`;
    }
    return encodeURIComponent(String(value));
  });
}

function createCodeSamples(operation) {
  const notes = [];
  const server = operation.servers?.[0]?.url || 'https://api.example.com';
  const path = replacePathParameters(operation.path, operation.parameters, notes);
  const query = [];
  const headers = {};

  for (const parameter of operation.parameters) {
    const value = explicitExample(parameter);
    if (parameter.in === 'query') {
      if (value !== undefined) query.push(`${encodeURIComponent(parameter.name)}=${encodeURIComponent(String(value))}`);
      else if (parameter.required) {
        query.push(`${encodeURIComponent(parameter.name)}=%3C${encodeURIComponent(parameter.name)}%3E`);
        notes.push(`Query parameter ${parameter.name} is required but has no declared example.`);
      }
    } else if (parameter.in === 'header') {
      headers[parameter.name] = value === undefined ? `<${parameter.name}>` : String(value);
      if (value === undefined) notes.push(`Header parameter ${parameter.name} has no declared example.`);
    }
  }

  const url = `${server.replace(/\/$/, '')}${path}${query.length ? `?${query.join('&')}` : ''}`;
  const body = contentExample(operation.requestBody?.content);
  const contentType = body?.mediaType || operation.requestBody?.content?.[0]?.mediaType;
  if (contentType) headers['content-type'] = contentType;
  if (operation.security?.length) {
    notes.push('Authentication is required by the contract and is intentionally omitted from generated examples.');
  }
  if (operation.requestBody?.required && !body) {
    notes.push('The request body is required but has no declared example; add a valid body before sending.');
  }

  const curl = [`curl --request ${operation.method}`, `  --url ${shellQuote(url)}`];
  for (const [name, value] of Object.entries(headers)) curl.push(`  --header ${shellQuote(`${name}: ${value}`)}`);
  if (body) curl.push(`  --data ${shellQuote(JSON.stringify(body.value))}`);

  const fetchOptions = [`  method: ${JSON.stringify(operation.method)}`];
  if (Object.keys(headers).length) fetchOptions.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')}`);
  if (body) fetchOptions.push(`  body: JSON.stringify(${JSON.stringify(body.value, null, 2).replace(/\n/g, '\n  ')})`);
  const javascript = `const response = await fetch(${JSON.stringify(url)}, {\n${fetchOptions.join(',\n')}\n});`;

  const pythonArgs = [`    method=${JSON.stringify(operation.method)}`];
  if (Object.keys(headers).length) pythonArgs.push(`    headers=${JSON.stringify(headers, null, 2).replace(/\n/g, '\n    ')}`);
  if (body) pythonArgs.push(`    json=${JSON.stringify(body.value, null, 2).replace(/\n/g, '\n    ')}`);
  const python = `import requests\n\nresponse = requests.request(\n    ${JSON.stringify(url)},\n${pythonArgs.join(',\n')}\n)`;

  return {
    curl: curl.join(' \\\n'),
    javascript,
    python,
    notes: Array.from(new Set(notes)),
  };
}

function assignRoutes(spec, config) {
  const used = new Set([spec.routePath]);
  const operations = spec.operations.map((operation, index) => {
    let routePath = buildOpenApiOperationRoutePath(config, spec.id, operation);
    if (used.has(routePath)) {
      routePath = buildOpenApiOperationRoutePath(
        config,
        spec.id,
        operation,
        createOpenApiRouteSuffix(`${spec.id}:${operation.source.pointer}:${index}`)
      );
    }
    while (used.has(routePath)) routePath += `-${index + 1}`;
    used.add(routePath);
    return { ...operation, routePath, canonicalPath: routePath };
  });

  const schemas = spec.schemas.map((model, index) => {
    let routePath = buildOpenApiModelRoutePath(config, spec.id, model);
    if (used.has(routePath)) {
      routePath = buildOpenApiModelRoutePath(
        config,
        spec.id,
        model,
        createOpenApiRouteSuffix(`${spec.id}:${model.source.pointer}:${index}`)
      );
    }
    while (used.has(routePath)) routePath += `-${index + 1}`;
    used.add(routePath);
    return { ...model, routePath, canonicalPath: routePath };
  });

  return { ...spec, operations, schemas };
}

function createParsedSpec(spec, document, config) {
  const context = { specUrl: spec.url, document };
  if (!isRecord(document)) fail(spec.url, '/', 'document must be an object.');
  if (typeof document.openapi !== 'string' || !/^3\./.test(document.openapi)) {
    fail(spec.url, '/openapi', 'only OpenAPI 3.x documents are supported.');
  }
  if (!isRecord(document.info)) fail(spec.url, '/info', 'document must contain an info object.');
  if (typeof document.info.title !== 'string' || !document.info.title.trim()) fail(spec.url, '/info/title', 'info.title must be a non-empty string.');
  if (typeof document.info.version !== 'string' || !document.info.version.trim()) fail(spec.url, '/info/version', 'info.version must be a non-empty string.');
  if (!isRecord(document.paths)) fail(spec.url, '/paths', 'document must contain a paths object.');

  const servers = normalizeServers(document.servers, context, '/servers');
  const security = Array.isArray(document.security) ? cloneJson(document.security) : [];
  const operations = normalizeOperations(document.paths, context, servers, security);
  const schemas = normalizeSchemas(document.components?.schemas, context).map((model) => ({
    ...model,
    typescript: renderTypeScriptDefinition(model),
  }));
  const componentRefs = Array.from(collectReferences(document.paths, context, '/paths')).sort();
  const securitySchemes = isRecord(document.components?.securitySchemes)
    ? Object.entries(document.components.securitySchemes).sort(([left], [right]) => left.localeCompare(right)).map(([name, value]) => ({
        name,
        ...(typeof value?.type === 'string' ? { type: value.type } : {}),
        ...(typeof value?.scheme === 'string' ? { scheme: value.scheme } : {}),
        ...(typeof value?.in === 'string' ? { in: value.in } : {}),
      }))
    : [];

  const specRecord = {
    title: document.info.title,
    version: document.info.version,
    description: typeof document.info.description === 'string' ? document.info.description : '',
    servers,
    security,
    securitySchemes,
    tags: Array.isArray(document.tags)
      ? document.tags.filter((tag) => typeof tag?.name === 'string').map((tag) => ({
          name: tag.name,
          ...(typeof tag.description === 'string' ? { description: tag.description } : {}),
        }))
      : [],
    operations,
    schemas,
    componentRefs,
    counts: {
      operations: operations.length,
      schemas: schemas.length,
      tags: Array.isArray(document.tags) ? document.tags.length : 0,
    },
  };

  const typescript = schemas.map((model) => model.typescript).filter(Boolean).join('\n\n');
  return assignRoutes({
    ...specRecord,
    routePath: buildOpenApiRoutePath(config, spec.id === config.defaultSpecId ? null : spec.id),
    typescript,
  }, config);
}

export function createOpenApiRouteEntries(
  artifacts,
  config = defaultOpenapiConfig,
  siteName = 'papers'
) {
  const entries = [];
  for (const spec of artifacts?.specs || []) {
    const specRoute = spec.routePath || buildOpenApiRoutePath(config, spec.id === config.defaultSpecId ? null : spec.id);
    entries.push({
      routePath: specRoute,
      canonicalPath: specRoute,
      title: `${spec.title || spec.label} | ${siteName}`,
      description: spec.description || `OpenAPI reference for ${spec.label}.`,
      type: 'article',
      includeInSitemap: true,
      noIndex: false,
      kind: 'openapi-overview',
      specId: spec.id,
    });
    for (const operation of spec.operations || []) {
      entries.push({
        routePath: operation.routePath,
        canonicalPath: operation.canonicalPath || operation.routePath,
        title: `${operation.summary || `${operation.method} ${operation.path}`} | ${siteName}`,
        description: operation.description || operation.summary || `${operation.method} ${operation.path}`,
        type: 'article',
        includeInSitemap: true,
        noIndex: false,
        kind: 'openapi-operation',
        specId: spec.id,
      });
    }
    for (const model of spec.schemas || []) {
      entries.push({
        routePath: model.routePath,
        canonicalPath: model.canonicalPath || model.routePath,
        title: `${model.name} | ${siteName}`,
        description: model.description || `Schema model ${model.name} from ${spec.label}.`,
        type: 'article',
        includeInSitemap: true,
        noIndex: false,
        kind: 'openapi-model',
        specId: spec.id,
      });
    }
  }
  return entries;
}

export function assertOpenApiArtifactSize(artifacts, maxBytes = OPENAPI_ARTIFACT_MAX_BYTES) {
  const bytes = Buffer.byteLength(JSON.stringify(artifacts));
  if (bytes > maxBytes) {
    throw new Error(`OpenAPI artifact size ${bytes} bytes exceeds the ${maxBytes}-byte budget.`);
  }
  return bytes;
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
        throw new Error(`OpenAPI asset ${spec.url} at /: unable to parse YAML: ${error.message}`);
      }

      Object.assign(record, createParsedSpec(spec, document, config));
    } else {
      Object.assign(record, {
        remote: true,
        routePath: buildOpenApiRoutePath(config, spec.id === config.defaultSpecId ? null : spec.id),
        counts: { operations: null, schemas: null, tags: null },
        operations: [],
        schemas: [],
        security: [],
        securitySchemes: [],
        componentRefs: [],
        typescript: '',
      });
    }

    specs.push(record);
  }

  const core = {
    schemaVersion: OPENAPI_ARTIFACT_SCHEMA_VERSION,
    contractVersion: OPENAPI_ARTIFACT_CONTRACT_VERSION,
    generatedBy: 'papers-openapi-artifacts',
    specs,
  };
  const fingerprint = createHash('sha256').update(JSON.stringify(core)).digest('hex');
  const artifacts = { ...core, generated: fingerprint };
  assertOpenApiArtifactSize(artifacts);
  return artifacts;
}
