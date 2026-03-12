# Live2D Setup

Live2D in Phantasy is intentionally pinned.

That is not glamourous, but it is honest. The current path is built around:

- Live2D Cubism Core
- `pixi.js@6.5.2`
- the `pixi-live2d-display` Cubism 4 build

## 1. Vendor The Runtime

From the repo root:

```bash
bun run setup:live2d
```

That vendors the pinned browser assets into the public runtime paths Phantasy expects.

## 2. Point The Avatar At A Model

Use the avatar settings and set the type to `Live2D`, then point it at a `.model3.json` file.

Good sources:

- a local asset under `public/live2d/...`
- a media-uploaded URL
- your own CDN or remote HTTPS URL

Example:

```text
/live2d/brand-companion/brand-companion.model3.json
```

Keep the model JSON, textures, motions, expressions, and physics files in the same asset tree.

## Why Load Order Matters

The current loader still depends on global script boot order:

1. `live2dcubismcore.min.js`
2. `pixi-6.5.2.min.js`
3. `pixi-live2d-display-cubism4.min.js`

If that order breaks, models usually fail as blank renders, missing globals, or half-initialized motion systems.

## What Works Well Today

- Cubism 4 `.model3.json` models
- remote or local asset URLs
- expression switching
- idle and motion playback
- Phantasy-side lip-sync and orchestration on top of the renderer

## Current Limits

- Cubism 2 is not the mainline target
- the runtime is pinned rather than bundled as one internal renderer package
- some models still need defensive physics compatibility handling
- Cubism licensing still applies even when the surrounding Phantasy code is open

## Troubleshooting

If the model does not load:

- verify the model URL resolves
- verify the pinned runtime assets were vendored
- verify the model references valid texture and motion files
- verify your host is not blocking the asset requests with CORS

Quick filesystem check:

```bash
ls public/live2d-sdk/
ls public/vendor/
```

You should see:

- `live2dcubismcore.min.js`
- `pixi-6.5.2.min.js`
- `pixi-live2d-display-cubism4.min.js`

## Smoke Test

```bash
bun run test -- src/live2d-plugin-loader.smoke.test.ts
```

That test covers the pinned loader path and boot order.

## Licensing

Phantasy's integration code can be open source. Live2D Cubism Core is still governed by Live2D's own license terms.

Review the official terms before shipping bundles that include Cubism runtime files:

- [Live2D Open Software License Agreement](https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html)
- [Live2D Cubism License Docs](https://docs.live2d.com/en/cubism-sdk-manual/license/)

## Related Docs

- [Avatars](/docs/avatars)
- [10 Minute Launch](/docs/guides/BUSINESS_AGENT_CMS_10_MINUTES)
- [First Run](/docs/getting-started/first-run)
