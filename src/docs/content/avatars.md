# Avatars

Phantasy supports four avatar types:

- `static`
- `pngtuber`
- `live2d`
- `vrm`

The short version: PNGTuber is the fastest path, Live2D is the polished 2D path, and VRM is the 3D path.

## Asset Paths

Common locations:

- project PNGTuber packs: `./.phantasy/pngtuber/<agentId>/`
- bundled Kurisu starter source: `./assets/pngtuber/kurisu/`
- Live2D files: `./public/live2d/...`
- VRM files: `./public/vrm/...`
- media/CDN URLs: also supported

The important distinction:

- `./assets/pngtuber/kurisu/` is the checked-in starter pack in the repo
- `./.phantasy/pngtuber/<agentId>/` is the project-local copy created by the Kurisu starter flow

PNGTuber packs are served from `/admin/avatars/<agentId>` when you use the local project path.

If you are editing a real project, the `.phantasy` copy is usually the one that matters.

## Real Kurisu Frames

These are literal files from the bundled Kurisu starter pack. When you choose the Makise Kurisu starter, Phantasy copies that pack into `./.phantasy/pngtuber/<agentId>/` and serves it from `/admin/avatars/<agentId>`.

<div class="avatar-expression-grid">
  <div class="avatar-expression-card">
    <img src="/images/docs/avatars/kurisu-lab-idle.png" alt="Kurisu PNGTuber lab outfit idle expression frame" />
    <p><strong>lab / idle / 0</strong><br />Neutral frame from the lab coat outfit.</p>
  </div>
  <div class="avatar-expression-card">
    <img src="/images/docs/avatars/kurisu-lab-happy.png" alt="Kurisu PNGTuber lab outfit happy expression frame" />
    <p><strong>lab / happy / 0</strong><br />Same outfit, different expression. This is the shape the runtime keys off.</p>
  </div>
  <div class="avatar-expression-card">
    <img src="/images/docs/avatars/kurisu-casual-annoyed.png" alt="Kurisu PNGTuber casual outfit annoyed expression frame" />
    <p><strong>casual / annoyed / 0</strong><br />Different outfit, same pack format. No special-casing required.</p>
  </div>
</div>

Source files used here:

- `assets/pngtuber/kurisu/lab/idle/0/CRS_BSC_40000600.png`
- `assets/pngtuber/kurisu/lab/happy/0/CRS_BSC_40000300.png`
- `assets/pngtuber/kurisu/casual/annoyed/0/CRS_ASB_40000500.png`

## PNGTuber Pack Shape

Phantasy accepts either of these layouts:

```text
outfit/expression/frame.png
outfit/expression/variation/frame.png
```

Typical result:

```text
.phantasy/pngtuber/<agentId>/
└── lab/
    ├── idle/0/0.png
    ├── happy/0/0.png
    └── blush/0/0.png
```

The filenames do not need to be pretty. Kurisu uses long exported asset ids. Phantasy cares about the folder shape more than the leaf filename.

The local pack importer preserves that structure in media storage and infers outfits plus expressions from it.

## PNGTuber Config

```json
{
  "avatars": {
    "defaultType": "pngtuber",
    "pngtuber": {
      "url": "/admin/avatars/kurisu",
      "outfits": ["lab", "casual"],
      "expressions": {
        "idle": { "outfit": "lab", "expression": "idle", "variation": 0 },
        "happy": { "outfit": "lab", "expression": "happy", "variation": 0 },
        "blush": { "outfit": "lab", "expression": "blush", "variation": 0 }
      }
    }
  }
}
```

The expression keys are logical emotion names. They are not fixed to the Kurisu starter.

## Admin Workflow

The current admin avatar flow lets you:

- point the PNGTuber URL at `/admin/avatars/<agentId>`
- point it at a media or CDN pack root
- import a local folder into the media provider
- rename outfits
- remap logical emotions to pack folders and variations

That means you can start from the checked-in starter pack, then swap to your own art without changing the rest of the product.

## Expression Tags

PNGTuber expression tags are config-driven.

If your mapping contains `thinking`, `smug`, or `wave`, the runtime can react to `[thinking]`, `[smug]`, or `[wave]` in model output. The Kurisu starter simply ships with a familiar set.

## Troubleshooting

If an avatar does not show:

- verify the base URL resolves
- verify the expected frame files exist
- verify imported media is public
- verify the configured outfits and expressions match the pack layout

If PNGTuber works locally but not from remote media, the usual culprit is the pack root URL, not the frame files themselves.

## Related Docs

- [Live2D Setup](/docs/guides/LIVE2D_SETUP)
- [First Run](/docs/getting-started/first-run)
- [Use Cases](/docs/getting-started/use-cases)
