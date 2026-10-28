import { extname } from 'node:path';

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.pf_meta', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.wasm', 'application/wasm'],
  ['.pagefind', 'application/wasm'],
]);

/** Content-Type header for a file served by the local preview servers. */
export function getContentType(filePath) {
  return CONTENT_TYPES.get(extname(filePath).toLowerCase()) || 'application/octet-stream';
}
