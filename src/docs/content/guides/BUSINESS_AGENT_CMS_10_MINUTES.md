# Build An AI Companion Business In 10 Minutes

This is the shortest honest demo of Phantasy's flagship shape: a companion who runs her own site, content, automations, and business from one runtime.

## 1. Install And Start

```bash
npm install @phantasy/agent
npx phantasy create business-cms my-brand
npx phantasy start --config config/agents/my-brand.json
```

If you are working from source:

```bash
bun install
cp .env.example .env
./start.sh
```

Open:

- admin dev shell: `http://localhost:5173`
- server build: `http://localhost:2000/admin`

## 2. Make The Site Public

In `Website`:

1. set website mode to `public`
2. add the brand title and description
3. save

If you want a headless setup instead, choose `api-only`. The content model stays the same.

## 3. Publish Something Real

In `Content`:

1. create your first Chronicle entry
2. publish it
3. confirm `/blog` and `/blog/:slug` render correctly

That is the quickest way to prove the companion, CMS, and public site are all reading from the same runtime.

## 4. Add The Character Surface

If you want the Live2D path, vendor the pinned runtime first:

```bash
bun run setup:live2d
```

Then use the companion/avatar settings to point at a `Live2D` `.model3.json`, a `PNGTuber` pack root, or your preferred VRM asset.

Recommended Live2D smoke test:

```bash
bun run test -- src/live2d-plugin-loader.smoke.test.ts
```

## 5. Check The Product Loop

Before calling it a demo, make sure you can show all of this without hand-waving:

- a named companion
- a public site
- a published entry
- one automation or approval surface
- one business or integration surface

If those five land cleanly, the product story is working.

## 6. Run The Release Checks

```bash
bun run typecheck
bun run lint
bun run stylelint
bun run docs:check
bun run test
npm pack --dry-run
```

## 7. Lead With The Wedge

For launch copy, lead with:

- the companion as the product surface
- site and content around her
- automations and approvals behind her
- business operations attached to the same identity

Do not lead with every plugin, every integration, or every future mode. Let the wedge stay sharp.

## Related Docs

- [First Run](/docs/getting-started/first-run)
- [Chronicle](/docs/features/chronicle)
- [Live2D Setup](/docs/guides/LIVE2D_SETUP)
- [Launch Playbook](/docs/guides/LAUNCH_PLAYBOOK)
