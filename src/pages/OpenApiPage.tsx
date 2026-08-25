import { Icon } from '@iconify/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import DocsLogoMark from '../components/DocsLogoMark';
import OpenApiReference from '../components/OpenApiReference';
import OpenApiSpecSelector from '../components/OpenApiSpecSelector';
import ThemeSwitcher from '../components/ThemeSwitcher';
import NotFoundPage from './NotFoundPage';
import { openapiConfig } from '../../shared/documentation-config.js';
import { getOpenApiSpecUrl } from '../../shared/openapiSpecUrls.js';
import { buildDocsLandingPath } from '../../shared/docsRouting.js';
import { DEFAULT_DOCUMENT_PATH } from '../lib/navigation';
import { buildOpenApiRoutePath } from '../lib/openapi';
import { applySeoMetadata } from '../utils/seo';
import OpenApiOverview from '../components/OpenApiOverview';
import { loadOpenApiArtifacts } from '../lib/openapiArtifacts';
import type { OpenApiSpecArtifact } from '../lib/openapiArtifacts';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';
const DOCS_LANDING_PATH = buildDocsLandingPath(DEFAULT_DOCUMENT_PATH);
const OPENAPI_SPECS = openapiConfig.enabled ? openapiConfig.specs : [];

export default function OpenApiPage() {
  const { specId } = useParams();
  const [artifacts, setArtifacts] = useState<OpenApiSpecArtifact[]>([]);
  const specs = OPENAPI_SPECS;
  const activeSpec = useMemo(() => {
    if (specId) {
      return specs.find((spec) => spec.id === specId) || null;
    }

    return specs.find((spec) => spec.id === openapiConfig.defaultSpecId) || specs[0] || null;
  }, [specId, specs]);

  useEffect(() => {
    if (!activeSpec) {
      return;
    }

    const routePath = buildOpenApiRoutePath(
      activeSpec.id === openapiConfig.defaultSpecId ? null : activeSpec.id
    );

    applySeoMetadata({
      title: `${activeSpec.label} | ${SITE_NAME}`,
      description:
        activeSpec.description || `Interactive OpenAPI reference for ${activeSpec.label}.`,
      path: routePath,
      canonicalPath: routePath,
      type: 'article',
    });
  }, [activeSpec]);

  const activeArtifact = activeSpec
    ? artifacts.find((artifact) => artifact.id === activeSpec.id) || null
    : null;

  useEffect(() => {
    let active = true;
    void loadOpenApiArtifacts().then((nextArtifacts) => {
      if (active && nextArtifacts) {
        setArtifacts(nextArtifacts.specs);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!openapiConfig.enabled) {
    return <Navigate to={DOCS_LANDING_PATH} replace />;
  }

  if (specId && !activeSpec) {
    return <NotFoundPage />;
  }

  if (!activeSpec) {
    return <Navigate to={DOCS_LANDING_PATH} replace />;
  }

  const activeSpecUrl = getOpenApiSpecUrl(activeSpec, openapiConfig);

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
                style={{ color: 'var(--text-color)', fontFamily: 'var(--title-font)' }}
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
            specs={specs}
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
        <OpenApiOverview artifact={activeArtifact} />
        <OpenApiReference specUrl={activeSpecUrl} />
      </main>
    </div>
  );
}
