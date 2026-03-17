# Build An AI VTuber In 10 Minutes

This is the shortest path to the product story that matters most for launch: an AI companion/VTuber who runs her own site, content, automations, and business from one runtime.

## 1. Install and start

```bash
npm install @phantasy/agent
npx phantasy create vtuber my-brand
npx phantasy start --config config/agents/my-brand.json
```

If you are working from a source checkout instead of the published package:

```bash
bun install
bun run dev:up
```

`bun run dev:up` creates `.env` from `.env.development` when needed, starts the local PostgreSQL container, and uses the local-only login `admin` / `phantasy-dev-password`.

Open:

- Admin UI: `http://localhost:5173`
- Server build: `http://localhost:2000/admin`

## 2. Vendor the pinned Live2D runtime

```bash
bun run setup:live2d
```

Phantasy supports one pinned runtime matrix for Live2D:

- Cubism Core
- PIXI 6.5.2
- `pixi-live2d-display` cubism4 build

## 3. Configure the companion business shell

In the admin UI:

1. Open **Website / Content**
2. Set website mode to `public`
3. Add your brand title, description, and nav
4. Save

If you want a headless setup, use `api-only` and keep the same content model.

## 4. Turn on Chronicle

In **Chronicle**:

1. Create your first entry
2. Publish it
3. Confirm `/blog` and `/blog/:slug` render correctly

Chronicle gives you the built-in blog, feeds, sitemap, and syndication hooks without splitting into a separate CMS.

## 5. Add the Live2D character

In **Appearance**:

1. Choose `Live2D`
2. Enter a `.model3.json` URL
3. Save
4. Reload the page once to verify the pinned local runtime assets are present

Recommended verification:

```bash
bun run test -- src/live2d-plugin-loader.smoke.test.ts
```

## 6. Verify the launch surface

Run the same checks you would run before posting a public demo:

```bash
bun run typecheck
bun run lint
bun run stylelint
bun run docs:check
bun run test
npm pack --dry-run --cache /tmp/phantasy-npm-cache
```

## 7. Ship the wedge, not the whole universe

For launch copy, lead with:

- AI companion/VTuber as the product surface
- website and headless modes around her
- Chronicle publishing flow
- Live2D and VRM character support
- workflow applications, automations, and business operations around the same companion/runtime

Do not lead with every plugin, every integration, or every future platform surface.
