# Avatar System

Phantasy supports multiple avatar types for your AI companion:

- **VRM** - 3D VRM models with full animations
- **Live2D** - 2D Live2D models with expressions
- **PNGTuber** - Image-based avatar with expression switching
- **Static** - Single static image

## PNGTuber Avatars

PNGTuber is an image-based avatar system that displays different expressions by swapping image frames. It's lightweight and doesn't require 3D model loading.

### Storage Model

- **Primary runtime location:** `./.phantasy/pngtuber/<agentId>/`
- **Bundled repo/reference assets:** `./assets/pngtuber/<agentId>/`
- **Direct-file avatar models:** prefer Media uploads or remote hosting; reserve `./public/vrm/` and `./public/live2d/` for small local examples instead of large checked-in packs
- **CMS media storage:** upload avatar files through the Media workspace and use the returned `/admin/media/...` URL or your configured R2/S3 public URL
- **Remote hosting:** any HTTPS URL works for static avatar images, VRM, and Live2D entry files; PNGTuber expects a base URL that contains the full frame pack layout
- **CMS PNGTuber import:** the Appearance workspace can import a local PNGTuber folder, preserve its nested frame paths in Media storage, and infer outfits/expressions automatically for the current companion id

This keeps the companion's mutable PNGTuber pack with the project instead of burying it in a machine-global home directory.

### File Location

Place your PNGTuber assets in:

```
./.phantasy/pngtuber/<agentId>/
```

For example, for an agent named "kurisu":

```
./.phantasy/pngtuber/kurisu/
```

### Directory Structure

```
./.phantasy/pngtuber/kurisu/
├── lab/                    # Lab outfit
│   ├── idle/
│   │   └── 0/
│   │       └── 0.png      # idle expression, variation 0, frame 0
│   ├── happy/
│   │   └── 0/
│   │       └── 0.png
│   ├── angry/
│   │   └── 0/
│   │       └── 0.png
│   ├── annoyed/
│   │   └── 0/
│   │       └── 0.png
│   ├── blush/
│   │   └── 0/
│   │       └── 0.png
│   └── blink/
│       └── 0/
│           └── 0.png
└── casual/                 # Casual outfit
    ├── idle/
    │   └── 0/
    │       └── 0.png
    ├── happy/
    │   └── 0/
    │       └── 0.png
    └── ...
```

If you use the CMS pack importer, it also accepts the simpler source layout `outfit/expression/frame.png` and normalizes it into the stored `outfit/expression/variation/frame.png` structure automatically.

#### Emotions And Outfits

Your PNGTuber can use any logical emotion tags and outfit names you define in `avatars.pngtuber`.

The checked-in Kurisu starter uses:

- emotions: `idle`, `happy`, `angry`, `annoyed`, `blush`, `blink`
- outfits: `lab`, `casual`

Kurisu is a starter preset, not a platform default. You can import a different pack or rename the outfit/emotion mapping from the Appearance workspace.

#### Multiple Frames & Variations

You can add multiple frames for animation and multiple variations:

```
./.phantasy/pngtuber/kurisu/lab/idle/
├── 0.png    # Variation 0, frame 0
├── 1.png    # Variation 0, frame 1
├── 2.png    # Variation 0, frame 2
└── 1/       # Variation 1
    ├── 0.png
    └── 1.png
```

### Agent Configuration

Add PNGTuber config to your agent's JSON file in `config/agents/`:

```json
{
  "id": "kurisu",
  "name": "Kurisu Makise",
  "avatars": {
    "defaultType": "pngtuber",
    "pngtuber": {
      "url": "/admin/avatars/kurisu",
      "cellWidth": 15,
      "cellHeight": 30,
      "flipHorizontal": false,
      "offsetPxX": 4,
      "offsetPxY": 4,
      "expressions": {
        "idle": { "outfit": "lab", "expression": "idle", "variation": 0 },
        "happy": { "outfit": "lab", "expression": "happy", "variation": 0 },
        "angry": { "outfit": "lab", "expression": "angry", "variation": 0 },
        "annoyed": { "outfit": "lab", "expression": "annoyed", "variation": 0 },
        "blush": { "outfit": "lab", "expression": "blush", "variation": 0 },
        "blink": { "outfit": "lab", "expression": "blink", "variation": 0 }
      },
      "outfits": ["lab", "casual"]
    }
  }
}
```

Starter reference from this repo:

- `config/agents/kurisu.json`
- `assets/pngtuber/kurisu/README.md`

Starter preset path:

- choose **Makise Kurisu Starter** during onboarding
- or generate from preset/CLI and let Phantasy copy the bundled Kurisu pack into `./.phantasy/pngtuber/<agent-id>/` with `/admin/avatars/<agent-id>` as the initial pack root

#### Configuration Fields

| Field            | Type    | Description                                                                                                                            |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `url`            | string  | Base URL for avatar images (e.g., `/admin/avatars/kurisu`, `/admin/media/uploads/avatars/kurisu`, or `https://cdn.example.com/kurisu`) |
| `cellWidth`      | number  | Image cell width in pixels (default: 16)                                                                                               |
| `cellHeight`     | number  | Image cell height in pixels (default: 32)                                                                                              |
| `flipHorizontal` | boolean | Flip image horizontally (default: false)                                                                                               |
| `offsetPxX`      | number  | Horizontal offset in pixels                                                                                                            |
| `offsetPxY`      | number  | Vertical offset in pixels                                                                                                              |
| `expressions`    | object  | Mapping of expression names to outfit/expression/variation                                                                             |
| `outfits`        | array   | Available outfit directories                                                                                                           |

### Expression Auto-Switching

The PNGTuber automatically switches expressions based on the agent's message content. The agent can include expression tags in their responses:

```
Hello there! [happy] How are you doing today?
```

#### Supported Expression Tags

Expression tags are config-driven. If your `avatars.pngtuber.expressions` contains keys like `thinking`, `smug`, or `wave`, the runtime can respond to `[thinking]`, `[smug]`, or `[wave]`.

The Kurisu starter ships with `[happy]`, `[angry]`, `[annoyed]`, `[blush]`, `[blink]`, and `[idle]`.

The agent decides when to use which expression based on their personality and the conversation context.

### Admin UI Controls

In the Admin UI sidebar:

1. Click the avatar settings button (cube icon)
2. Select "PNGTUBER" as the avatar type
3. Paste a remote pack root, select a frame from the Media Library, or use **Import Local Pack** to upload a folder into local media, Cloudflare R2, or S3-backed storage
4. Use the built-in **Emotion Mapping** editor to rename logical emotions, point them at pack folders, and choose outfit/variation targets
5. Use the **EXPRESSION** buttons to manually switch expressions
6. Use the **OUTFIT** buttons to switch between the configured outfits
7. Click **▶ TEST** to cycle through all expressions automatically

### Web Access

PNGTuber images are served at:

```
http://localhost:2000/admin/avatars/<agentId>/<outfit>/<expression>/<variation>/<frame>.png
```

For example:

- `http://localhost:2000/admin/avatars/kurisu/lab/idle/0/0.png`
- `http://localhost:2000/admin/avatars/kurisu/casual/happy/0/0.png`

## Troubleshooting

### Avatar Not Showing

1. Check the browser console for errors
2. Verify the image URL is correct and accessible
3. Ensure the agent config has the correct `url` path

### Expression Not Changing

1. Make sure the expression directory exists in your asset folder
2. Check that the expression tag is correctly formatted: `[expression]`
3. Verify the expression is defined in the agent's `expressions` config

### Images Not Loading

1. Verify `./.phantasy/pngtuber/<agentId>/` directory exists
2. If you are using the repo starter assets, verify `./assets/pngtuber/<agentId>/` exists
3. If you imported the pack through the CMS, verify `pngtuber_url` points at the uploaded media/CDN pack root and that the media provider is publicly reachable
4. The CLI PNGTuber renderer now checks project-local/runtime pack folders first and then the configured media/CDN pack root; root-relative URLs resolve against `PUBLIC_URL` or `http://localhost:<PORT>`
5. Check file permissions
6. Ensure PNG files are valid and not corrupted
