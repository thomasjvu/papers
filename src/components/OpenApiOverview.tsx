import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

import type { OpenApiSpecArtifact } from '../lib/openapiArtifacts';

type OpenApiOverviewProps = {
  artifact: OpenApiSpecArtifact | null;
};

function methodColor(method: string) {
  switch (method) {
    case 'GET':
      return '#79c267';
    case 'POST':
      return '#e8b04b';
    case 'PUT':
      return '#65aadd';
    case 'DELETE':
      return '#e06c75';
    default:
      return 'var(--primary-color)';
  }
}

export default function OpenApiOverview({ artifact }: OpenApiOverviewProps) {
  if (!artifact) {
    return null;
  }

  const operations = artifact.operations || [];
  const schemas = artifact.schemas || [];

  return (
    <section
      className="openapi-overview mx-auto w-full max-w-7xl border-b px-4 py-5 md:px-6"
      aria-labelledby="openapi-overview-heading"
      style={{ borderColor: 'var(--border-unified)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Icon
              icon="mingcute:braces-line"
              className="h-4 w-4"
              aria-hidden="true"
              style={{ color: 'var(--primary-color)' }}
            />
            <h1
              id="openapi-overview-heading"
              className="truncate text-lg font-semibold"
              style={{ color: 'var(--text-color)', fontFamily: 'var(--title-font)' }}
            >
              {artifact.title || artifact.label}
            </h1>
            {artifact.version && (
              <span
                className="rounded border px-2 py-0.5 text-2xs"
                style={{
                  borderColor: 'var(--border-unified)',
                  color: 'var(--muted-color)',
                  fontFamily: 'var(--mono-font)',
                }}
              >
                v{artifact.version}
              </span>
            )}
          </div>
          <p className="max-w-2xl text-sm" style={{ color: 'var(--muted-color)' }}>
            {artifact.description ||
              'Interactive API reference generated from the local OpenAPI contract.'}
          </p>
        </div>

        <div
          className="flex shrink-0 items-center gap-3 text-2xs"
          style={{ color: 'var(--muted-color)' }}
        >
          <span>{artifact.counts.operations ?? '—'} operations</span>
          <span aria-hidden="true">·</span>
          <span>{artifact.counts.schemas ?? '—'} schemas</span>
        </div>
      </div>

      {operations.length > 0 && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {operations.map((operation) => (
            <Link
              key={`${operation.method}:${operation.path}:${operation.id}`}
              to={operation.routePath}
              className="block rounded-md border px-3 py-2 transition-opacity hover:opacity-80"
              style={{
                borderColor: 'var(--border-unified)',
                backgroundColor: 'var(--card-color)',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-2xs font-bold"
                  style={{ color: methodColor(operation.method), fontFamily: 'var(--mono-font)' }}
                >
                  {operation.method}
                </span>
                <code className="truncate text-xs" style={{ color: 'var(--text-color)' }}>
                  {operation.path}
                </code>
              </div>
              <h2
                className="mt-1 truncate text-2xs font-medium"
                style={{ color: 'var(--text-color)' }}
              >
                {operation.summary || operation.operationId || 'Untitled operation'}
              </h2>
              {operation.tags.length > 0 && (
                <p className="mt-1 truncate text-2xs" style={{ color: 'var(--muted-color)' }}>
                  {operation.tags.join(' · ')}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {schemas.length > 0 && (
        <p
          className="mt-3 text-2xs"
          style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
        >
          Models:{' '}
          {schemas.map((schema, index) => (
            <span key={schema.name}>
              {index > 0 ? ', ' : ''}
              <Link to={schema.routePath} className="underline-offset-2 hover:underline">
                {schema.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      <p className="mt-4 text-2xs" style={{ color: 'var(--muted-color)' }}>
        Generated reference pages are static and searchable. Load the interactive Scalar viewer
        below when you need try-it-out workflows.
      </p>
    </section>
  );
}
