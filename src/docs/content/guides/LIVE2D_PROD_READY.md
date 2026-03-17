# Live2D Production Readiness Guide (Agent UI)

This document captures the exact configuration that makes Live2D work reliably in development previews and production. Follow it to avoid regressions.

Key Points (Do These)

- Use the ungated proxy path for assets in production: `/r2-assets`, not `/admin/r2-assets`.
  - `src/admin-ui/utils/assetUrl.ts` → `PROD_PREFIX = '/r2-assets'`.
  - Any pre-existing `/admin/r2-assets` URLs are rewritten to `/r2-assets` at runtime.

- Ensure Live2D plugin + dependencies load in the correct order.
  - Cubism 4 core served locally: `/live2d-sdk/live2dcubismcore.min.js`
  - Pixi v6.5.2 served locally: `/vendor/pixi-6.5.2.min.js`
  - pixi-live2d-display cubism4 plugin served locally: `/pixi-live2d-display-cubism4.min.js`
  - The supported runtime matrix is local-only at boot. Re-run `bun run setup:live2d` instead of relying on CDN fallback.

- Keep PIXI.Loader set to use credentials and a consistent crossOrigin.
  - `src/admin-ui/utils/live2d-plugin-loader.ts` → `configurePixiLoader()` sets `withCredentials` and `crossOrigin='use-credentials'`.

- Serve model JSON with headers that prevent edge transformation.
  - `src/server/route-handlers.ts`
    - For `/r2-assets` (and `/admin/r2-assets`) proxy responses:
      - Set `Content-Type: application/json` for `.json` / `.model3` files
      - Set `Cache-Control: public, max-age=300, no-transform`
      - Strip upstream `transfer-encoding` and `content-encoding`
    - This prevents Cloudflare and other intermediaries from re-compressing the JSON, which breaks some XHR loaders.

- Keep a small, safe network preflight.
  - `src/admin-ui/components/live2d/utils/networkDebug.ts`
  - It logs one “Model preflight report” entry so we can distinguish fetch vs XHR failures without changing the loader behaviour.

What NOT to do

- Do not point the UI to `/admin/r2-assets` in production — admin path is often gated and subject to extra rules.
- Do not monkey-patch pixi-live2d-display XHRLoader responseType. It may throw InvalidStateError and cause UI crashes.
- Do not change Hooks order in React components (don’t introduce hooks after conditional returns).

File Changes (Reference)

- `src/admin-ui/utils/assetUrl.ts`
  - `PROD_PREFIX = '/r2-assets'`

- `src/admin-ui/utils/live2d-plugin-loader.ts`
  - `configurePixiLoader()` forces credentials and crossOrigin. Avoids fragile overrides of plugin XHRLoader.

- `src/admin-ui/components/live2d/Live2DViewerSDK.tsx`
  - URL rewrite for `/admin/r2-assets` → `/r2-assets`
  - Hook order safe: preflight effect runs before conditional return

- `src/admin-ui/components/live2d/utils/networkDebug.ts`
  - Lightweight diagnostics to reveal fetch/xhr behaviour

- `src/server/route-handlers.ts`
  - Proxy: JSON model files served with `Content-Type: application/json` and `Cache-Control: no-transform`

Operational Checklist

1. Development preview sanity checks
   - Open DevTools Network: `/r2-assets/live2d/brand-companion.model3.json` → 200, `content-type: application/json`
   - Console: `[Phantasy-SDK:ModelManager] Loading Live2D model from: /r2-assets/...`
   - Console: Preflight shows fetch ok:true, xhr ok:true

2. Production
   - The agent server must expose `/r2-assets/*` publicly (do not gate under `/admin/*`).
   - Confirm Cloudflare does not transform JSON (no-transform header applied).

3. Debugging
   - If XHR still shows status 0 but fetch is ok: check cache/proxy and encoding headers; ensure `no-transform` is present.
   - If assets 403: re-check admin gating/CF Access; `/r2-assets/*` should be accessible with same-origin credentials.

4. Dependencies
   - Pixi v6.5.2, Cubism 4 core, local cubism4 plugin build.
   - Verify `bun run test -- src/live2d-plugin-loader.smoke.test.ts` before shipping loader changes.
