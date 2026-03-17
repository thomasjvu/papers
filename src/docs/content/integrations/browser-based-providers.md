# Browser-Based AI Providers

Phantasy supports running AI models entirely in your browser using WebGPU. These providers require no API keys and run locally on your device.

## Available Browser Providers

### Chatterbox TTS (Default Voice Provider)

**Type:** Voice / Text-to-Speech  
**Requirements:** WebGPU (Chrome 113+, Edge 113+)  
**First Load:** ~1.5 GB  
**No API keys required**

Chatterbox provides zero-shot voice cloning in the browser:

- Record a 5-10 second voice sample
- Generate speech in that voice
- Adjust expressiveness (0-1.5)
- WebGPU acceleration with WASM fallback

**Features:**

- Zero-shot voice cloning
- Expressiveness control
- WebGPU acceleration
- Offline after first load

**Known Limitations:**

- No paralinguistic tag support ([laugh], [sigh] tags ignored)
- First visit requires model download (~1.5GB)
- Audio limited to ~5-10 seconds per call (longer text should be split)

### WebLLM

**Type:** LLM / Chat  
**Requirements:** WebGPU  
**No API keys required**

Browser-based LLM inference using MLC AI's WebLLM.

**Install Surface:** Auto-installed browser vendor package (`@mlc-ai/web-llm`)  
**Core Runtime Impact:** Optional. Removing it disables browser-local LLMs without breaking the server/runtime provider stack.

**Available Models:**

- Llama 3.1 8B (~4GB)
- Gemma 2 2B (~1.4GB)
- Phi 3.5 Mini (~2.5GB)
- Mistral 7B (~4GB)
- Qwen 1.5B (~1GB)

### WebTxt2Img (Default Image Provider)

**Type:** Image Generation  
**Requirements:** WebGPU  
**First Load:** ~1.5-2 GB  
**No API keys required**

Browser-based image generation using web-txt2img library.

**Available Models:**

- **SD-Turbo** - Fast single-step diffusion, 512×512 output, seeded generation support
- **Janus-Pro-1B** - Higher quality autoregressive model, better prompts understanding

**Features:**

- Generate images entirely in browser
- No API keys required
- WebGPU acceleration
- Cached after first download

**Known Limitations:**

- Fixed output size (512×512 for SD-Turbo)
- Janus has limited controls (no seed/size)

## Voice Storage

Voice samples and embeddings are stored locally:

```
~/.phantasy/agents/{agentId}/voices/
├── {speaker-id}/
│   ├── embedding.bin    # Voice embedding
│   ├── reference.wav    # Original audio
│   └── metadata.json    # Name, created date
```

This allows voice profiles to persist across sessions and work with both browser-based and server providers.

## WebGPU Requirements

Browser-based providers require WebGPU support:

| Browser     | WebGPU Support |
| ----------- | -------------- |
| Chrome 113+ | ✓ Full         |
| Edge 113+   | ✓ Full         |
| Firefox     | ✗ None         |
| Safari 18+  | △ Partial      |

If WebGPU is unavailable, the Admin UI will show a message directing users to select an alternative provider (Venice, OpenAI, etc.).

## Browser Vendors

Browser-first features do not all ship the same way, and pretending otherwise is how docs rot.

- `webllm` is an optional Admin UI dependency: `@mlc-ai/web-llm`
- `chatterbox-tts` and `webtxt2img` share an optional Admin UI dependency: `@huggingface/transformers`
- These vendors are installed by default but intentionally removable
- Removing a browser vendor disables that browser-only feature without breaking the core runtime provider system

### Managing WebLLM

Use the repo scripts from the workspace root:

```bash
bun run browser-vendor:list
bun run browser-vendor:install -- webllm
bun run browser-vendor:remove -- webllm
bun run browser-vendor:install -- chatterbox-tts
bun run browser-vendor:remove -- webtxt2img
```

## Defaults

Phantasy's browser UI can expose browser-local providers immediately, but the core runtime keeps server-safe routing defaults.

- Browser-local surfaces can use WebLLM, Chatterbox, and WebTxt2Img with no API keys
- Core/runtime routing defaults remain server-backed (`mlc-llm`, `kilo-gateway`, etc.) so the agent still works outside the browser

## Fallback Behavior

When WebGPU is unavailable:

1. **Voice:** Users can select Venice AI (Kokoro), OpenAI TTS, or other providers
2. **LLM:** Users can select cloud providers like Chutes, RedPill, etc.

All providers remain available in the Admin UI under the Providers tab.

## Browser Cache

Model files are cached by the browser after first download:

- Subsequent visits load from cache (much faster)
- Users can clear cache via browser settings if needed
- Cache size: ~1.5-4GB depending on loaded models

## Security & Privacy

All inference runs locally on the user's device:

- No data sent to external servers for inference
- Voice samples stay on device
- No API key exposure risk
