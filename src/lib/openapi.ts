import { openapiConfig } from '@app-shared/documentation-config.js';

export function getOpenApiPagePath() {
  return openapiConfig.pagePath || 'api-reference/openapi';
}

export function buildOpenApiRoutePath(specId?: string | null) {
  const pagePath = getOpenApiPagePath();
  const basePath = `/docs/${pagePath}`;

  if (!specId || specId === openapiConfig.defaultSpecId) {
    return basePath;
  }

  return `${basePath}/${specId}`;
}
