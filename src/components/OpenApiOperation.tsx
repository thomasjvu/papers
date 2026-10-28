import { Link } from 'react-router-dom';
import { useState } from 'react';

import type {
  OpenApiContent,
  OpenApiOperation,
  OpenApiSchemaArtifact,
  OpenApiSpecArtifact,
} from '../lib/openapiArtifacts';
import { schemaLabel, valueLabel } from '../lib/openapiLabels';

type OpenApiOperationProps = {
  artifact: OpenApiSpecArtifact;
  operation: OpenApiOperation;
  overviewPath: string;
};

type OpenApiModelProps = {
  artifact: OpenApiSpecArtifact;
  model: OpenApiSchemaArtifact;
  overviewPath: string;
};

function ContentSummary({ content }: { content: OpenApiContent[] }) {
  if (content.length === 0) {
    return <span style={{ color: 'var(--muted-color)' }}>No body declared.</span>;
  }

  return (
    <div className="space-y-2">
      {content.map((item) => (
        <div
          key={item.mediaType}
          className="rounded-sm border px-3 py-2"
          style={{ borderColor: 'var(--border-unified)' }}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <code style={{ color: 'var(--papers-text-color)' }}>{item.mediaType}</code>
            <span style={{ color: 'var(--muted-color)' }}>{schemaLabel(item.schemaNode)}</span>
          </div>
          {item.examples.length > 0 && (
            <div className="mt-2 space-y-1 text-2xs" style={{ color: 'var(--muted-color)' }}>
              {item.examples.map((example) => (
                <div key={example.name}>
                  <span>{example.summary || example.name}</span>
                  {Object.prototype.hasOwnProperty.call(example, 'value') && (
                    <pre className="mt-1 overflow-x-auto rounded-sm bg-black/10 p-2">
                      {valueLabel(example.value)}
                    </pre>
                  )}
                  {example.externalValue && <span>External example: {example.externalValue}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="rounded-sm border px-2 py-1 text-2xs transition-opacity hover:opacity-80"
      style={{ borderColor: 'var(--border-unified)', color: 'var(--muted-color)' }}
      onClick={() => {
        const clipboard = navigator.clipboard;
        if (!clipboard) return;
        void clipboard.writeText(value).then(() => setCopied(true));
      }}
    >
      {copied ? 'Copied' : `Copy ${label}`}
    </button>
  );
}

function CodeSample({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border" style={{ borderColor: 'var(--border-unified)' }}>
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--border-unified)' }}
      >
        <h3 className="text-xs font-semibold" style={{ color: 'var(--papers-text-color)' }}>
          {label}
        </h3>
        <CopyButton value={value} label={label} />
      </div>
      <pre className="overflow-x-auto p-3 text-2xs" style={{ color: 'var(--papers-text-color)' }}>
        <code>{value}</code>
      </pre>
    </div>
  );
}

function OpenApiBreadcrumbs({
  artifactLabel,
  overviewPath,
  separator,
  current,
}: {
  artifactLabel: string;
  overviewPath: string;
  separator: string;
  current: string;
}) {
  return (
    <nav
      className="mb-5 text-2xs"
      style={{ color: 'var(--muted-color)' }}
      aria-label="API breadcrumbs"
    >
      <Link to={overviewPath} className="hover:underline">
        {artifactLabel}
      </Link>
      <span aria-hidden="true">{separator}</span>
      <span>{current}</span>
    </nav>
  );
}

export function OpenApiOperation({ artifact, operation, overviewPath }: OpenApiOperationProps) {
  return (
    <article
      className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6"
      aria-labelledby="openapi-operation-title"
    >
      <OpenApiBreadcrumbs
        artifactLabel={artifact.label}
        overviewPath={overviewPath}
        separator=" / "
        current={operation.tags[0] || 'Untagged'}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="rounded-sm px-2 py-1 text-2xs font-bold"
              style={{
                color: 'var(--primary-color)',
                backgroundColor: 'var(--card-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              {operation.method}
            </span>
            <code className="text-sm" style={{ color: 'var(--papers-text-color)' }}>
              {operation.path}
            </code>
          </div>
          <h1
            id="openapi-operation-title"
            className="text-2xl font-semibold"
            style={{ color: 'var(--papers-text-color)', fontFamily: 'var(--title-font)' }}
          >
            {operation.summary || operation.operationId || `${operation.method} ${operation.path}`}
          </h1>
          {operation.operationId && (
            <p
              className="mt-2 text-2xs"
              style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
            >
              {operation.operationId}
            </p>
          )}
        </div>
        <Link
          to={overviewPath}
          className="rounded-sm border px-3 py-2 text-xs hover:opacity-80"
          style={{ borderColor: 'var(--border-unified)', color: 'var(--muted-color)' }}
        >
          Open interactive viewer
        </Link>
      </div>

      {operation.description && (
        <p className="mt-5 max-w-3xl text-sm leading-7" style={{ color: 'var(--muted-color)' }}>
          {operation.description}
        </p>
      )}

      <div className="mt-8 space-y-8">
        {operation.parameters.length > 0 && (
          <section aria-labelledby="openapi-parameters-heading">
            <h2
              id="openapi-parameters-heading"
              className="mb-3 text-sm font-semibold"
              style={{ color: 'var(--papers-text-color)' }}
            >
              Parameters
            </h2>
            <div
              className="overflow-x-auto rounded-md border"
              style={{ borderColor: 'var(--border-unified)' }}
            >
              <table className="w-full text-left text-xs">
                <thead style={{ color: 'var(--muted-color)' }}>
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {operation.parameters.map((parameter) => (
                    <tr
                      key={`${parameter.in}:${parameter.name}`}
                      className="border-t"
                      style={{
                        borderColor: 'var(--border-unified)',
                        color: 'var(--papers-text-color)',
                      }}
                    >
                      <td className="px-3 py-2">
                        <code>{parameter.name}</code>
                        {parameter.description && (
                          <p className="mt-1 text-2xs" style={{ color: 'var(--muted-color)' }}>
                            {parameter.description}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">{parameter.in}</td>
                      <td className="px-3 py-2">
                        <code>{schemaLabel(parameter.schemaNode)}</code>
                      </td>
                      <td className="px-3 py-2">{parameter.required ? 'yes' : 'no'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {operation.requestBody && (
          <section aria-labelledby="openapi-request-heading">
            <h2
              id="openapi-request-heading"
              className="mb-3 text-sm font-semibold"
              style={{ color: 'var(--papers-text-color)' }}
            >
              Request body
            </h2>
            {operation.requestBody.description && (
              <p className="mb-3 text-sm" style={{ color: 'var(--muted-color)' }}>
                {operation.requestBody.description}
              </p>
            )}
            <ContentSummary content={operation.requestBody.content} />
          </section>
        )}

        <section aria-labelledby="openapi-responses-heading">
          <h2
            id="openapi-responses-heading"
            className="mb-3 text-sm font-semibold"
            style={{ color: 'var(--papers-text-color)' }}
          >
            Responses
          </h2>
          <div className="space-y-3">
            {operation.responses.map((response) => (
              <div
                key={response.status}
                className="rounded-md border p-3"
                style={{ borderColor: 'var(--border-unified)' }}
              >
                <div className="flex items-center gap-3">
                  <code className="text-sm font-semibold" style={{ color: 'var(--primary-color)' }}>
                    {response.status}
                  </code>
                  <span className="text-sm" style={{ color: 'var(--papers-text-color)' }}>
                    {response.description || 'Response'}
                  </span>
                </div>
                <div className="mt-3">
                  <ContentSummary content={response.content} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {(operation.security?.length > 0 || operation.codeSamples.notes.length > 0) && (
          <section aria-labelledby="openapi-notes-heading">
            <h2
              id="openapi-notes-heading"
              className="mb-3 text-sm font-semibold"
              style={{ color: 'var(--papers-text-color)' }}
            >
              Usage notes
            </h2>
            <ul
              className="list-disc space-y-1 pl-5 text-sm"
              style={{ color: 'var(--muted-color)' }}
            >
              {operation.codeSamples.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="openapi-code-heading">
          <h2
            id="openapi-code-heading"
            className="mb-3 text-sm font-semibold"
            style={{ color: 'var(--papers-text-color)' }}
          >
            Examples
          </h2>
          <div className="space-y-3">
            <CodeSample label="curl" value={operation.codeSamples.curl} />
            <CodeSample label="JavaScript" value={operation.codeSamples.javascript} />
            <CodeSample label="Python" value={operation.codeSamples.python} />
          </div>
        </section>
      </div>
    </article>
  );
}

export function OpenApiModel({ artifact, model, overviewPath }: OpenApiModelProps) {
  return (
    <article
      className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6"
      aria-labelledby="openapi-model-title"
    >
      <OpenApiBreadcrumbs
        artifactLabel={artifact.label}
        overviewPath={overviewPath}
        separator=" / Models / "
        current={model.name}
      />
      <h1
        id="openapi-model-title"
        className="text-2xl font-semibold"
        style={{ color: 'var(--papers-text-color)', fontFamily: 'var(--title-font)' }}
      >
        {model.name}
      </h1>
      {model.description && (
        <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: 'var(--muted-color)' }}>
          {model.description}
        </p>
      )}
      <section className="mt-8" aria-labelledby="openapi-model-definition-heading">
        <h2
          id="openapi-model-definition-heading"
          className="mb-3 text-sm font-semibold"
          style={{ color: 'var(--papers-text-color)' }}
        >
          TypeScript definition
        </h2>
        <CodeSample label="TypeScript" value={model.typescript} />
      </section>
      {model.properties.length > 0 && (
        <section className="mt-8" aria-labelledby="openapi-model-properties-heading">
          <h2
            id="openapi-model-properties-heading"
            className="mb-3 text-sm font-semibold"
            style={{ color: 'var(--papers-text-color)' }}
          >
            Properties
          </h2>
          <div
            className="overflow-x-auto rounded-md border"
            style={{ borderColor: 'var(--border-unified)' }}
          >
            <table className="w-full text-left text-xs">
              <thead style={{ color: 'var(--muted-color)' }}>
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Required</th>
                </tr>
              </thead>
              <tbody>
                {model.properties.map((property) => (
                  <tr
                    key={property.name}
                    className="border-t"
                    style={{
                      borderColor: 'var(--border-unified)',
                      color: 'var(--papers-text-color)',
                    }}
                  >
                    <td className="px-3 py-2">
                      <code>{property.name}</code>
                      {property.description && (
                        <p className="mt-1 text-2xs" style={{ color: 'var(--muted-color)' }}>
                          {property.description}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <code>{schemaLabel(property.schemaNode)}</code>
                    </td>
                    <td className="px-3 py-2">{property.required ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </article>
  );
}
