# VRM Integration

3D avatar integration using VRM (Virtual Reality Model) format.

## Overview

Phantasy supports VRM 3D avatars with:

- Real-time lip sync (audio-driven)
- Expression control (happy, sad, angry, etc.)
- Mixamo animation support
- Transparent background rendering
- Orbit camera controls

## Requirements

Install the VRM SDK dependency:

```bash
bun add @phantasy/vrm-sdk @pixiv/three-vrm three
```

## Configuration

In your agent config, add VRM settings:

```json
{
  "vrm": {
    "url": "https://example.com/avatar.vrm",
    "enableLipSync": true,
    "enableAutoRotate": true,
    "cameraPosition": {
      "x": 0,
      "y": 1.5,
      "z": 3
    }
  }
}
```

## Configuration Options

| Option             | Type    | Description                     |
| ------------------ | ------- | ------------------------------- |
| `url`              | string  | URL to the VRM model file       |
| `enableLipSync`    | boolean | Enable audio-driven lip sync    |
| `enableAutoRotate` | boolean | Auto-rotate the avatar          |
| `initialRotation`  | number  | Initial rotation in degrees     |
| `animations`       | object  | Mixamo animation configuration  |
| `autoplay`         | boolean | Auto-play default animation     |
| `entranceEnabled`  | boolean | Play entrance animation on load |
| `cameraPosition`   | object  | Initial camera position         |

## Animations

Configure Mixamo animations:

```json
{
  "animations": {
    "defaultState": "idle",
    "states": {
      "idle": "https://example.com/idle.fbx",
      "wave": "https://example.com/wave.fbx",
      "talk": "https://example.com/talk.fbx"
    },
    "chains": {
      "intro": "wave,idle"
    }
  }
}
```

## Lip Sync

Lip sync is automatically enabled when `enableLipSync` is true. The avatar's mouth will animate based on audio input.

## Usage in Admin UI

1. Navigate to the Avatar tab in Admin UI
2. Enter your VRM model URL
3. Configure animations and lip sync settings
4. Save and reload the agent

## TTS Integration

VRM avatars work seamlessly with TTS. When the agent speaks:

1. Audio is generated via TTS provider
2. Lip sync animates the mouth based on audio
3. Expression changes can be triggered by sentiment analysis

## Troubleshooting

- **Model won't load**: Ensure CORS headers are set on the VRM host
- **Lip sync not working**: Check audio context permissions
- **Animations broken**: Verify Mixamo FBX retargeting settings
