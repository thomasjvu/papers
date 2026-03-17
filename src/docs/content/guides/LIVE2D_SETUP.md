# Live2D Setup Guide

This guide covers the Live2D runtime used by the Phantasy Agent admin UI.

## Prerequisites

The current Live2D integration uses a pinned browser runtime stack:

1. **Live2D Cubism Core**
2. **PIXI.js 6.5.2**
3. **`pixi-live2d-display` Cubism 4 build**

Phantasy provides its own wrapper SDK and React integration on top of that stack, but Cubism Core itself is still licensed by Live2D Inc.

## Setup

### 1. Vendor the runtime files

Run the setup script from the repository root:

```bash
bun run setup:live2d
```

This script:

- downloads the official Cubism Core runtime into local public asset paths
- downloads a pinned copy of `pixi.js@6.5.2`
- refreshes the local `pixi-live2d-display` Cubism 4 plugin asset
- reduces reliance on third-party CDNs during boot

### 2. Configure your agent

In the Admin UI, go to the **Appearance** tab and:

1. Select "LIVE2D" as the avatar type
2. Enter your Live2D model URL (must be a `.model3.json` file)
3. Optionally, provide custom texture URLs if you want to override the default textures
4. Save your changes

### Example model

Phantasy does not ship a bundled public demo Live2D model for launch builds. Point the admin UI at one of these:

- your own hosted model URL, such as `https://cdn.example.com/live2d/brand-companion.model3.json`
- a local model you place under `public/live2d/`, for example `/live2d/brand-companion/brand-companion.model3.json`

Recommended structure:

- the `.model3.json` file
- all referenced texture files
- optional physics, motion, and expression files in the same asset tree

## Supported Features

- ✅ Live2D Cubism 4 models (`.model3.json`)
- ✅ Custom texture overrides
- ✅ Basic animations and idle motions
- ✅ Expression switching
- ✅ Real-time rendering with PixiJS
- ✅ Phantasy SDK integration for TTS/lip-sync orchestration on top of the render stack

## Why load order matters

The current SDK path is based on global UMD-style scripts, not a single self-contained ESM bundle.

- `live2dcubismcore.min.js` registers `window.Live2DCubismCore`
- `pixi.min.js` registers `window.PIXI`
- `pixi-live2d-display` mutates `window.PIXI.live2d`

If PIXI is missing, the plugin has nothing to attach to. If the wrong plugin build is used, Cubism 4 models fail to initialize. If the Cubism runtime family does not match the plugin/model expectations, you get runtime errors or blank renders. That is why "exact order" felt necessary in your tests: the app was depending on globals being present at plugin evaluation time.

Phantasy keeps that contract explicit and boots only from the pinned local assets that `bun run setup:live2d` vendors into the repo.

## Current limitations

- Cubism 2 models (`.model.json`) are not the mainline target
- The runtime is version-pinned today rather than bundled into a single internal renderer package
- Physics behavior may still vary by model, so the admin UI currently applies a defensive physics-disable patch for compatibility
- You still need to respect Live2D's Cubism licensing terms even if the surrounding SDK is open source

## Troubleshooting

### Model not loading

1. Check the browser console for errors
2. Verify the model URL is accessible (no CORS issues)
3. Ensure the pinned runtime files are present:
   ```bash
   ls src/admin-ui/public/live2d-sdk/
   ls src/admin-ui/public/vendor/
   ```
   Should show:
   - `live2dcubismcore.min.js`
   - `pixi-6.5.2.min.js`
   - `pixi-live2d-display-cubism4.min.js`

### Black screen or textures not showing

1. Check if all texture URLs are valid
2. Try clearing custom texture URLs to use defaults
3. Verify the model3.json file structure is correct
4. Confirm the model and textures are served with CORS settings the browser can actually load

### Performance issues

1. Reduce the model scale/resolution
2. Disable animations if not needed
3. Use optimized texture formats (PNG recommended)
4. Re-run `bun run setup:live2d` if the pinned local runtime files are missing or stale

## Smoke Test

Run the runtime smoke test when you change the loader or asset paths:

```bash
bun run test -- src/live2d-plugin-loader.smoke.test.ts
```

This verifies the pinned local boot order and the model boot patch path.

## Licensing

- **Your code**: the Phantasy Live2D wrapper, lip-sync logic, TTS integration, UI tooling, and loader code can be open source
- **Live2D Cubism Core**: proprietary runtime by Live2D Inc.; use and redistribution are governed by Live2D's terms

Review the official terms before shipping bundles that include Cubism runtime artifacts:

- https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html
- https://docs.live2d.com/en/cubism-sdk-manual/license/

## Additional Resources

- [Live2D Cubism SDK Documentation](https://docs.live2d.com/cubism-sdk-tutorials/about-this-site/)
- [pixi-live2d-display Documentation](https://github.com/guansss/pixi-live2d-display)
- [Live2D Model Specifications](https://docs.live2d.com/cubism-editor-manual/model-file-format/)
