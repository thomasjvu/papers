# OpenAI Compatible API

Phantasy Agent exposes an OpenAI-compatible API.

## Usage

```bash
curl -X POST http://localhost:2000/api/integrations/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-key" \
  -d '{
    "model": "phantasy-agent",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```
