import { openapiConfig } from '@app-shared/documentation-config.js';

export function getOpenApiRoutePrefix() {
  return openapiConfig.routePrefix || '/api';
}

export function buildOpenApiRoutePath(specId?: string | null) {
  const basePath = getOpenApiRoutePrefix();

  if (!specId || specId === openapiConfig.defaultSpecId) {
    return basePath;
  }

  return `${basePath}/${specId}`;
}
