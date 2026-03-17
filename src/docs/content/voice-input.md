# Voice Input (Speech-to-Text) Documentation

## Overview

The TUI supports voice input via Ctrl+R. This document covers the architecture and troubleshooting.

## Architecture

### Recording Flow

1. **User presses Ctrl+R** → Starts recording
2. **sox/rec** → Captures audio to WAV file (48kHz, 16-bit mono)
3. **User presses Enter** → Stops recording and sends for transcription
4. **Chutes STT API** → Transcribes audio to text
5. **Agent processes** → Text is sent to the agent as a message

### Key Files

| File                          | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `src/cli/tui/voice-input.ts`  | Recording logic (sox, file handling) |
| `src/cli/tui/chat-view.ts`    | UI handling, Enter/Escape keys       |
| `src/cli/tui/app.ts`          | Key event routing                    |
| `src/providers/chutes/stt.ts` | STT API integration                  |

### Keyboard Controls

| Key    | Action                                    |
| ------ | ----------------------------------------- |
| Ctrl+R | Start voice recording                     |
| Enter  | Stop recording and send for transcription |
| Escape | Cancel recording (discard)                |

## Chutes STT API Integration

### API Details

- **Endpoint**: `https://chutes-whisper-large-v3.chutes.ai/transcribe`
- **Method**: POST
- **Auth**: Bearer token (from `CHUTES_API_KEY` in KV store)

### Request Format

```json
{
  "audio_b64": "<base64-encoded-wav-file>"
}
```

**Important**:

- Send **full WAV file** (with header), not raw PCM
- Do NOT wrap in `args` object
- The API returns a JSON array of segments

### Response Format

```json
[
  { "start": 0.0, "end": 1.58, "text": "Hello, how are you?" },
  { "start": 1.58, "end": 3.2, "text": "I'm doing great thanks!" }
]
```

### Common Issues

| Error                          | Cause                | Fix                                                                |
| ------------------------------ | -------------------- | ------------------------------------------------------------------ |
| `400 Invalid input parameters` | Wrong request format | Ensure `{ audio_b64: "..." }` not `{ args: { audio_b64: "..." } }` |
| `400 Invalid audio format`     | Wrong audio format   | Send full WAV file, not raw PCM                                    |
| `Missing authorization`        | No API key           | Check `CHUTES_API_KEY` in KV store (`data/kv-store/`)              |
| Empty transcription            | Audio not capturing  | Check microphone permissions                                       |

## Audio Format

- **Sample Rate**: 48kHz (macOS default, sox can't set 16kHz)
- **Channels**: Mono (1)
- **Bit Depth**: 16-bit
- **Format**: WAV (RIFF container)

## Troubleshooting

### Test Recording Works

```bash
# Record 3 seconds of audio
rec -q -c 1 -b 16 -t wav /tmp/test.wav trim 0 3

# Play back to verify
afplay /tmp/test.wav
```

### Test STT API Directly

```bash
API_KEY="your-key-here"
WAV_B64=$(base64 < /tmp/test.wav)

curl -s -X POST "https://chutes-whisper-large-v3.chutes.ai/transcribe" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"audio_b64\": \"$WAV_B64\"}"
```

### Check Logs

```bash
# Voice input logs
cat /tmp/voice-input.log

# Terminal output (for chutes-stt logs)
# Run with DEBUG_AGENT=true
```

## Configuration

### Provider Config Location

API keys stored in: `data/kv-store/default_provider_config.json`

```json
{
  "providers": {
    "chutes": {
      "apiKey": "cpk_..."
    }
  }
}
```

### Environment Variables

| Variable         | Description                 |
| ---------------- | --------------------------- |
| `CHUTES_API_KEY` | API key for chutes services |
| `CHUTES_STT_URL` | Override STT endpoint URL   |
| `CHUTES_TTS_URL` | Override TTS endpoint URL   |
