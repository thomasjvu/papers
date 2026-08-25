import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { openapiConfig } from '../shared/documentation-config.js';
import { createOpenApiArtifacts } from './lib/openapiArtifacts.mjs';
import { serializePrettierJson } from './lib/formatArtifact.mjs';

const rootDir = process.cwd();
const publicDir = join(rootDir, 'public');

const artifacts = await createOpenApiArtifacts({ rootDir, publicDir, config: openapiConfig });
await mkdir(publicDir, { recursive: true });
await writeFile(join(publicDir, 'openapi-artifacts.json'), await serializePrettierJson(artifacts));
console.log(`Generated OpenAPI artifacts for ${artifacts.specs.length} specs.`);
