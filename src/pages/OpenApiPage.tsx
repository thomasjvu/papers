import { useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';

import DocPageFooter from '../components/DocPageFooter';
import DocumentationPage from '../components/docs/DocumentationPage';
import OpenApiReference from '../components/OpenApiReference';
import OpenApiSpecSelector from '../components/OpenApiSpecSelector';
import { openapiConfig } from '../../shared/documentation-config.js';
import { buildOpenApiRoutePath, getOpenApiPagePath } from '../lib/openapi';
import { applySeoMetadata } from '../utils/seo';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

type OpenApiPageProps = {
  specId?: string;
};

export default function OpenApiPage({ specId }: OpenApiPageProps) {
  const pagePath = getOpenApiPagePath();
  const specs = openapiConfig.enabled ? openapiConfig.specs : [];
  const activeSpec = useMemo(() => {
    const requested = specs.find((spec) => spec.id === specId);
    if (requested) {
      return requested;
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

  if (specId && !activeSpec) {
    return <Navigate to={buildOpenApiRoutePath()} replace />;
  }

  if (!activeSpec) {
    return <Navigate to="/docs/reference/routes" replace />;
  }

  return (
    <DocumentationPage
      initialContent=""
      currentPath={pagePath}
      contentSlot={
        <div className="doc-content pt-8 pb-6 px-6 md:pt-12 md:pb-8 md:px-8 lg:pt-16 lg:pb-12 lg:px-12 max-w-6xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {activeSpec.label}
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted-color)' }}>
              {activeSpec.description || 'Interactive OpenAPI explorer.'} Regenerate specs with{' '}
              <code>pnpm bossraid sync:openapi</code>.
            </p>
          </header>

          <OpenApiSpecSelector
            specs={specs}
            activeSpecId={activeSpec.id}
            defaultSpecId={openapiConfig.defaultSpecId}
            pagePath={pagePath}
          />

          <OpenApiReference specUrl={activeSpec.url} />
          <DocPageFooter path={pagePath} sourcePath={`src/docs/content/${pagePath}.md`} />
        </div>
      }
    />
  );
}
