# Local AI Models

Phantasy supports local AI models for LLM inference, speech-to-text (STT), and embeddings, allowing you to run AI workloads offline without external API calls.

## Overview

| Feature        | Backend          | Default Model                                | Requirements                  |
| -------------- | ---------------- | -------------------------------------------- | ----------------------------- |
| **LLM**        | Ollama           | `qwen2.5-vl:2b`                              | [Ollama](https://ollama.com)  |
| Speech-to-Text | `nodejs-whisper` | `tiny`                                       | `~/.phantasy/models/whisper/` |
| Embeddings     | `node-llama-cpp` | `ggml-org/embeddinggemma-300m-qat-q8_0-GGUF` | `~/.phantasy/models/`         |

## Auto-Download

By default, Phantasy automatically downloads required models on first use. You can control this behavior with environment variables:

```bash
# Enable/disable auto-download (default: true)
AUTODOWNLOAD_LLM=true
AUTODOWNLOAD_WHISPER=true
AUTODOWNLOAD_EMBEDDINGS=true
```

### Behavior Matrix

| Feature    | Backend Available  | Env Var          | Behavior                                   |
| ---------- | ------------------ | ---------------- | ------------------------------------------ |
| LLM        | Ollama running     | `true` / not set | Auto-pull model via Ollama API             |
| LLM        | Ollama running     | `false`          | Skip, fail gracefully (use cloud provider) |
| LLM        | Ollama not running | any              | Skip, fail gracefully (use cloud provider) |
| Whisper    | ✅                 | `true` / not set | Auto-download model on first use           |
| Whisper    | ✅                 | `false`          | Skip, fail gracefully (use external STT)   |
| Embeddings | ✅                 | `true` / not set | Auto-download model on first use           |
| Embeddings | ❌                 | any              | Skip, use cloud provider                   |

---

## Local LLM (Ollama)

Phantasy uses [Ollama](https://ollama.com) as the backend for local LLM inference. Ollama must be installed and running.

### Installation

1. **Install Ollama** from https://ollama.com
2. **Start Ollama** - It runs on `http://localhost:11434` by default
3. **Pull models** (optional - done automatically if AUTODOWNLOAD_LLM=true)

```bash
# Pull a model manually
ollama pull qwen2.5-vl:2b

# List installed models
ollama list
```

### Configuration

In your agent config:

```json
{
  "providers": {
    "local": {
      "enabled": true
    }
  },
  "modelRouting": {
    "default": {
      "provider": "local",
      "model": "qwen3-vl:2b"
    }
  }
}
```

**Environment variables:**

```bash
# Ollama endpoint (default: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434

# Auto-pull models (default: true)
AUTODOWNLOAD_LLM=true
```

### Available Models

| Model          | Ollama Name     | Size | Context | Description                      |
| -------------- | --------------- | ---- | ------- | -------------------------------- |
| `qwen3-vl:2b`  | `qwen2.5-vl:2b` | ~4GB | 32K     | **Recommended** - Vision-enabled |
| `qwen3:0.5b`   | `qwen2.5:0.5b`  | ~1GB | 8K      | Fastest, lowest memory           |
| `qwen3:1.8b`   | `qwen2.5:1.8b`  | ~2GB | 16K     | Balanced                         |
| `qwen3:4b`     | `qwen2.5:4b`    | ~8GB | 32K     | Higher quality                   |
| `llama3:7b`    | `llama3.2:3b`   | ~2GB | 8K      | Meta Llama 3.2                   |
| `tinyllama:1b` | `tinyllama:1b`  | ~1GB | 4K      | Minimal footprint                |

### GPU Support

Ollama automatically uses:

- **Apple Silicon (Metal)** - On Mac with M1/M2/M3/M4 chips
- **NVIDIA (CUDA)** - On systems with NVIDIA GPUs
- **CPU fallback** - If no GPU is available

### Vision Support

The `qwen3-vl:2b` model includes vision capabilities, allowing the agent to analyze images.

---

## Whisper (Speech-to-Text)

In your agent config:

```json
{
  "stt_provider": "whispercpp",
  "stt_model": "tiny"
}
```

### Available Models

| Model      | Size   | Description             |
| ---------- | ------ | ----------------------- |
| `tiny`     | ~75MB  | Fastest, lower accuracy |
| `tiny.en`  | ~75MB  | English-only            |
| `base`     | ~150MB | Balanced                |
| `base.en`  | ~150MB | English-only            |
| `small`    | ~500MB | Better accuracy         |
| `small.en` | ~500MB | English-only            |

---

## Embeddings (Vector Search)

In your agent config:

```json
{
  "memoryConfig": {
    "provider": "pgvector",
    "embedding": {
      "small": {
        "provider": "local"
      }
    }
  }
}
```

For markdown memory (no embeddings needed):

```json
{
  "memoryConfig": {
    "provider": "markdown"
  }
}
```

---

## Disabling Auto-Download

If you want to use external/cloud providers instead:

```bash
# Disable local models
AUTODOWNLOAD_LLM=false
AUTODOWNLOAD_WHISPER=false
AUTODOWNLOAD_EMBEDDINGS=false
```

### External Providers

When auto-download is disabled, Phantasy will use these cloud providers:

**LLM:**

- Configure in `modelRouting` to use providers like `venice`, `groq`, `openai`, etc.

**Speech-to-Text:**

- `stt_provider: "openai"` - Whisper API
- `stt_provider: "deepgram"` - Deepgram
- `stt_provider: "chutes"` - Chutes
- `stt_provider: "venice"` - Venice AI

**Embeddings:**

- `EMBEDDING_PROVIDER=venice` (default)
- `EMBEDDING_PROVIDER=redpill`
- `EMBEDDING_PROVIDER=openai`

---

## Troubleshooting

### Local LLM (Ollama)

**"Ollama is not running":**

- Install Ollama from https://ollama.com
- Start Ollama: `ollama serve` (or it starts automatically on login)
- Verify: `curl http://localhost:11434/api/tags`

**Model pull fails:**

- Check internet connection
- Try pulling manually: `ollama pull qwen2.5-vl:2b`
- Try a smaller model: `ollama pull tinyllama:1b`

**GPU not detected:**

- Ollama uses GPU automatically if available
- On Mac, Metal is supported by default
- On Linux with NVIDIA, install CUDA toolkit

**Out of memory:**

- Use a smaller model
- Close other applications

### Whisper

**Model download fails:**

- Check internet connection
- Verify `~/.phantasy/models/whisper/` is writable
- Try a smaller model: `"stt_model": "tiny"`

**Transcription fails:**

- Check logs for error messages
- Verify audio format (wav, mp3, m4a supported)

### Embeddings

**Local embeddings not working:**

- Verify `AUTODOWNLOAD_EMBEDDINGS=true`
- Check that `memoryConfig.provider` is set to `pgvector`
- Check that `memoryConfig.embedding.small.provider` is set to `local`

---

## Getting Started with Zero API Keys

```bash
# Install Ollama first!
# https://ollama.com

# Default configuration (all local)
AUTODOWNLOAD_LLM=true          # Use local LLM via Ollama
AUTODOWNLOAD_WHISPER=true      # Use local Whisper
AUTODOWNLOAD_EMBEDDINGS=true   # Use local embeddings

# Ollama must be running
# Models will be auto-pulled on first use
```

With this setup, users can run Phantasy without any external API keys!
