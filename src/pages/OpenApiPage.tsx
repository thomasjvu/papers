import { Icon } from '@iconify/react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { openapiConfig } from '../../shared/documentation-config.js';
import { buildDocsLandingPath } from '../../shared/docsRouting.js';
import { getOpenApiSpecUrl } from '../../shared/openapiSpecUrls.js';
import DocsLogoMark from '../components/DocsLogoMark';
import { OpenApiModel, OpenApiOperation } from '../components/OpenApiOperation';
import OpenApiOverview from '../components/OpenApiOverview';
import OpenApiSpecSelector from '../components/OpenApiSpecSelector';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { DEFAULT_DOCUMENT_PATH } from '../lib/navigation';
import { buildOpenApiRoutePath, getOpenApiRoutePrefix } from '../lib/openapi';
import { loadOpenApiArtifacts } from '../lib/openapiArtifacts';
import type { OpenApiArtifacts, OpenApiSpecArtifact } from '../lib/openapiArtifacts';
import NotFoundPage from './NotFoundPage';
import { applySeoMetadata } from '../utils/seo';

const OpenApiReference = lazy(() => import('../components/OpenApiReference'));
const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';
const DOCS_LANDING_PATH = buildDocsLandingPath(DEFAULT_DOCUMENT_PATH);
const OPENAPI_SPECS = openapiConfig.enabled ? openapiConfig.specs : [];

type OpenApiView =
  | {
      kind: 'overview';
      spec: (typeof OPENAPI_SPECS)[number];
      artifact: OpenApiSpecArtifact;
      routePath: string;
    }
  | {
      kind: 'operation';
      spec: (typeof OPENAPI_SPECS)[number];
      artifact: OpenApiSpecArtifact;
      operation: NonNullable<OpenApiSpecArtifact['operations']>[number];
      routePath: string;
    }
  | {
      kind: 'model';
      spec: (typeof OPENAPI_SPECS)[number];
      artifact: OpenApiSpecArtifact;
      model: NonNullable<OpenApiSpecArtifact['schemas']>[number];
      routePath: string;
    };

function resolveView(pathname: string, artifacts: OpenApiArtifacts | null): OpenApiView | null {
  for (const spec of OPENAPI_SPECS) {
    const defaultSpec = spec.id === openapiConfig.defaultSpecId ? null : spec.id;
    const overviewPath = buildOpenApiRoutePath(defaultSpec);
    const artifact = artifacts?.specs.find((item) => item.id === spec.id);

    if (pathname === overviewPath && artifact) {
      return { kind: 'overview', spec, artifact, routePath: overviewPath };
    }

    if (!artifact) continue;
    const operation = artifact.operations?.find((item) => item.routePath === pathname);
    if (operation)
      return { kind: 'operation', spec, artifact, operation, routePath: operation.routePath };
    const model = artifact.schemas?.find((item) => item.routePath === pathname);
    if (model) return { kind: 'model', spec, artifact, model, routePath: model.routePath };
  }

  return null;
}

function findSpecForPath(pathname: string) {
  return OPENAPI_SPECS.find((spec) => {
    const defaultSpec = spec.id === openapiConfig.defaultSpecId ? null : spec.id;
    return pathname === buildOpenApiRoutePath(defaultSpec);
  });
}

export default function OpenApiPage() {
  const location = useLocation();
  const [artifacts, setArtifacts] = useState<OpenApiArtifacts | null>(null);
  const [isInteractiveViewerRequested, setIsInteractiveViewerRequested] = useState(false);
  const routePrefix = getOpenApiRoutePrefix(openapiConfig);
  const view = useMemo(
    () => resolveView(location.pathname, artifacts),
    [artifacts, location.pathname]
  );
  const pathSpec = findSpecForPath(location.pathname);
  const activeSpec =
    view?.spec ||
    pathSpec ||
    OPENAPI_SPECS.find((spec) => spec.id === openapiConfig.defaultSpecId) ||
    OPENAPI_SPECS[0] ||
    null;

  useEffect(() => {
    let active = true;
    void loadOpenApiArtifacts().then((nextArtifacts) => {
      if (active) setArtifacts(nextArtifacts);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeSpec) return;
    const routePath =
      view?.routePath ||
      buildOpenApiRoutePath(activeSpec.id === openapiConfig.defaultSpecId ? null : activeSpec.id);
    const title =
      view?.kind === 'operation'
        ? `${view.operation.summary || `${view.operation.method} ${view.operation.path}`} | ${SITE_NAME}`
        : view?.kind === 'model'
          ? `${view.model.name} | ${SITE_NAME}`
          : `${view?.artifact.title || activeSpec.label} | ${SITE_NAME}`;
    const description =
      view?.kind === 'operation'
        ? view.operation.description ||
          view.operation.summary ||
          `${view.operation.method} ${view.operation.path}`
        : view?.kind === 'model'
          ? view.model.description || `Schema model ${view.model.name}.`
          : activeSpec.description || `Interactive OpenAPI reference for ${activeSpec.label}.`;

    applySeoMetadata({
      title,
      description,
      path: routePath,
      canonicalPath: routePath,
      type: 'article',
    });
  }, [activeSpec, view]);

  if (!openapiConfig.enabled) return <Navigate to={DOCS_LANDING_PATH} replace />;
  if (!activeSpec) return <Navigate to={DOCS_LANDING_PATH} replace />;
  if (!location.pathname.startsWith(routePrefix)) return <NotFoundPage />;
  if (artifacts && !view) return <NotFoundPage />;

  const activeArtifact =
    view?.artifact || artifacts?.specs.find((artifact) => artifact.id === activeSpec.id) || null;
  const activeSpecUrl = getOpenApiSpecUrl(activeSpec, openapiConfig);
  const overviewPath = buildOpenApiRoutePath(
    activeSpec.id === openapiConfig.defaultSpecId ? null : activeSpec.id
  );

  return (
    <div
      className="openapi-page flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--background-color)' }}
    >
      <header
        className="openapi-page-header flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6"
        style={{ borderColor: 'var(--border-unified)' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={DOCS_LANDING_PATH}
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--border-unified)',
              color: 'var(--muted-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            <Icon icon="mingcute:arrow-left-line" className="h-4 w-4" aria-hidden="true" />
            Docs
          </Link>
          <div className="flex items-center gap-2">
            <DocsLogoMark />
            <div className="min-w-0">
              <p
                className="truncate text-sm font-bold"
                style={{ color: 'var(--papers-text-color)', fontFamily: 'var(--title-font)' }}
              >
                API Reference
              </p>
              <p
                className="truncate text-2xs"
                style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
              >
                {activeSpec.label}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OpenApiSpecSelector
            specs={OPENAPI_SPECS}
            activeSpecId={activeSpec.id}
            defaultSpecId={openapiConfig.defaultSpecId}
          />
          <a
            href={activeSpecUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition-opacity hover:opacity-80"
            style={{
              borderColor: 'var(--border-unified)',
              color: 'var(--muted-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            <Icon icon="mingcute:download-2-line" className="h-3.5 w-3.5" aria-hidden="true" />
            YAML
          </a>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="openapi-page-main flex min-h-0 flex-1 flex-col">
        {view?.kind === 'operation' ? (
          <OpenApiOperation
            artifact={view.artifact}
            operation={view.operation}
            overviewPath={overviewPath}
          />
        ) : view?.kind === 'model' ? (
          <OpenApiModel artifact={view.artifact} model={view.model} overviewPath={overviewPath} />
        ) : (
          <>
            <OpenApiOverview artifact={activeArtifact} />
            {isInteractiveViewerRequested ? (
              <Suspense
                fallback={
                  <div
                    className="flex min-h-120 items-center justify-center text-sm"
                    style={{ color: 'var(--muted-color)' }}
                  >
                    Loading interactive viewer…
                  </div>
                }
              >
                <OpenApiReference specUrl={activeSpecUrl} />
              </Suspense>
            ) : (
              <section
                className="openapi-reference-gate mx-auto w-full max-w-7xl border-b px-4 py-6 md:px-6"
                aria-labelledby="openapi-reference-gate-heading"
                style={{ borderColor: 'var(--border-unified)' }}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-5"
                  style={{
                    borderColor: 'var(--border-unified)',
                    backgroundColor: 'var(--card-color)',
                  }}
                >
                  <div className="min-w-0">
                    <h2
                      id="openapi-reference-gate-heading"
                      className="text-sm font-semibold"
                      style={{ color: 'var(--papers-text-color)', fontFamily: 'var(--title-font)' }}
                    >
                      Interactive API explorer
                    </h2>
                    <p className="mt-1 text-xs" style={{ color: 'var(--muted-color)' }}>
                      Load Scalar when you need try-it-out controls and the full interactive
                      reference.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInteractiveViewerRequested(true)}
                    className="inline-flex shrink-0 items-center rounded-md border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{
                      borderColor: 'var(--primary-color)',
                      color: 'var(--primary-color)',
                      fontFamily: 'var(--mono-font)',
                    }}
                  >
                    Load interactive viewer
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
