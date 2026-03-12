# Generated Defaults Inventory

This file is generated from `src/config/constants.ts`.

## Agent Defaults

```json
{
  "ID": "default",
  "NAME": "Companion",
  "PERSONALITY": "A helpful AI assistant.",
  "INSTRUCTIONS": "You are a helpful AI assistant."
}
```

## Model Defaults

```json
{
  "PROVIDER": "kilo-gateway",
  "MODEL": "minimax/minimax-m2.5:free",
  "TEMPERATURE": 0.7,
  "MAX_TOKENS": 4096,
  "TOP_P": 1,
  "PRESENCE_PENALTY": 0,
  "FREQUENCY_PENALTY": 0
}
```

## Model Routing Defaults

```json
{
  "default": {
    "provider": "mlc-llm",
    "model": "HF://mlc-ai/Qwen3-8B-Instruct-q4f32_1-MLC",
    "temperature": 0.7
  },
  "fast": {
    "provider": "mlc-llm",
    "model": "HF://mlc-ai/Qwen3-1.7B-Instruct-q4f32_1-MLC",
    "temperature": 0.7
  }
}
```

## Memory Defaults

```json
{
  "PROVIDER": "markdown",
  "WORKSPACE_PATH": "./workspace",
  "MAX_MEMORIES": 50,
  "SIMILARITY": 0.7,
  "AUTO_FLUSH": true,
  "FLUSH_THRESHOLD": 0.8,
  "MAX_CONVERSATION_MESSAGES": 50,
  "DUAL_EMBEDDINGS": false,
  "SQLITE_VECTOR_PATH": "./workspace/.vector-index.db"
}
```

## Server Defaults

```json
{
  "PORT": 2000,
  "HOST": "0.0.0.0",
  "API_PREFIX": "/api/v1",
  "WS_PATH": "/ws",
  "REQUEST_TIMEOUT": 30000,
  "MAX_BODY_SIZE": "10mb"
}
```

## Admin UI Defaults

```json
{
  "PORT": 2000,
  "DEV_PORT": 5173,
  "WS_PORT": 1999
}
```

## Provider URL Defaults

```json
{
  "openai": "https://api.openai.com/v1",
  "openai-codex": "https://api.openai.com/v1",
  "anthropic": "https://api.anthropic.com/v1",
  "google": "https://generativelanguage.googleapis.com/v1beta",
  "redpill": "https://api.redpill.ai/v1",
  "venice": "https://api.venice.ai/v1",
  "fireworks": "https://api.fireworks.ai/v1",
  "groq": "https://api.groq.com/openai/v1",
  "together": "https://api.together.ai/v1",
  "openrouter": "https://openrouter.ai/v1",
  "mistral": "https://api.mistral.ai/v1",
  "deepseek": "https://api.deepseek.com/v1",
  "chutes": "https://api.chutes.ai/v1",
  "kilo-gateway": "https://api.kilo.ai/api/gateway",
  "alkahest": "http://localhost:8787",
  "dalle": "https://api.openai.com/v1/images/generations",
  "stability": "https://api.stability.ai/v1",
  "replicate": "https://api.replicate.com/v1",
  "midjourney": "https://api.midjourney.com/v1",
  "whisper": "https://api.openai.com/v1/audio/transcriptions",
  "cozytts": "https://api.coqui.ai/v2",
  "kokoro": "https://kokoro.hf.ai/v1",
  "chutes_tts": "https://chutes-kokoro.chutes.ai",
  "chutes_stt": "https://chutes-whisper-large-v3.chutes.ai",
  "comfyui": "http://localhost:8188",
  "ollama": "http://localhost:11434/v1",
  "openai-compatible": "http://localhost:11434/v1",
  "qdrant": "http://localhost:6333",
  "weaviate": "http://localhost:8080",
  "discord": "https://discord.com/api/v10",
  "twitter": "https://api.twitter.com/2",
  "telegram": "https://api.telegram.org"
}
```

## Provider Model Defaults

```json
{
  "openai": "gpt-4o",
  "openai-codex": "gpt-5-codex",
  "anthropic": "claude-sonnet-4-20250514",
  "google": "gemini-2.0-flash-exp",
  "redpill": "llama-3.1-70b",
  "venice": "venice-uncensored",
  "fireworks": "accounts/fireworks/models/llama-v3p1-70b-instruct",
  "groq": "llama-3.1-70b-versatile",
  "together": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  "openrouter": "anthropic/claude-3.5-sonnet",
  "mistral": "mistral-large-latest",
  "deepseek": "deepseek-chat",
  "chutes": "zai-org/GLM-4.6V",
  "kilo-gateway": "minimax/minimax-m2.5:free",
  "dalle": "dall-e-3",
  "stability": "stable-diffusion-xl-1024-v1-0",
  "whisper": "whisper-1",
  "kokoro": "kokoro",
  "chutes_tts": "kokoro",
  "chutes_stt": "whisper-large-v3",
  "openai_embedding": "text-embedding-3-small",
  "redpill_embedding": "BAAI/bge-large-en-v1.5"
}
```

## CORS Defaults

```json
{
  "ALLOWED_ORIGINS": [
    "http://localhost:1999",
    "http://localhost:2000",
    "http://localhost:2001",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:3001"
  ],
  "ALLOWED_METHODS": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  "ALLOWED_HEADERS": [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Agent-ID",
    "X-API-Key"
  ]
}
```
