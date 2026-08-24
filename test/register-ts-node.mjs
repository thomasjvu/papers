import { register } from 'node:module';

register('ts-node/esm/transpile-only', new URL('../', import.meta.url));
register('./resolve-aliases.mjs', new URL('./', import.meta.url));
