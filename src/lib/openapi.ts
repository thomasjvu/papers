import { openapiConfig } from '@app-shared/documentation-config.js';
// The shared route contract is intentionally plain JS so Node release scripts
// can import it; these wrappers provide the typed browser-facing boundary.
// @ts-expect-error The repository does not emit declarations for shared JS modules.
import * as sharedOpenApiRouting from '../../shared/openapiRouting.js';

export function getOpenApiRoutePrefix(config: typeof openapiConfig = openapiConfig): string {
  return sharedOpenApiRouting.getOpenApiRoutePrefix(config);
}

export function buildOpenApiRoutePath(
  specId?: string | null,
  config: typeof openapiConfig = openapiConfig
): string {
  return sharedOpenApiRouting.buildOpenApiRoutePath(config, specId);
}
