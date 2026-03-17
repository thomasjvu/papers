# Custom Integration Guide

## Overview

Custom Integrations let external products talk to your companion through Phantasy's admin-managed REST surface.

Use this when you want to connect:

- a member app
- a checkout or storefront
- a mobile client
- a private customer portal
- an internal operator tool

The goal is simple: keep the companion's identity, memory, and business logic inside Phantasy while other apps call into it.

## What You Get

- OpenAI-compatible chat completions
- API key auth per integration
- configurable CORS origins
- webhook ingress for external events
- optional auto-response flows
- shared agent memory and runtime behavior

## Recommended Launch Path

1. Open the Admin UI.
2. Go to `Business` -> `Custom Integrations`.
3. Create one integration per external product surface.
4. Give each integration a narrow origin list and a clear purpose.
5. Start with chat and webhook flows before adding voice or other media paths.

Suggested first integration:

- Name: `Member App`
- Description: `Authenticated member conversations with the brand companion`
- Allowed Origins: `https://app.example.com`
- Custom Instructions: `This integration serves signed-in members inside the main customer app. Keep responses concise, helpful, and aligned with the companion's business role.`

## Core Endpoints

All requests use:

- `Authorization: Bearer YOUR_API_KEY`
- your Phantasy host, for example `https://agent.example.com`

### Chat Completions

```http
POST /api/integrations/chat/completions
```

Example request:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What should I start with?"
    }
  ],
  "user": {
    "id": "member_123",
    "name": "Jordan"
  },
  "room": {
    "id": "member-app-session-456"
  },
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 800
}
```

### Webhook Ingress

```http
POST /api/integrations/webhook
```

Use this when an external app wants to push events into Phantasy, such as:

- a new inbound message
- a purchase event
- a booking or signup event
- a workflow trigger

### Voice Generation

```http
POST /api/integrations/voice/generate
```

Treat voice as optional for launch. Start with text first, then add voice after the integration contract is stable.

## Identity And Memory Mapping

Use stable identifiers from the external system.

Recommended pattern:

- `user.id`: your durable customer or member id
- `room.id`: the conversation, order, session, or inbox thread id

That keeps memory coherent across repeated visits without leaking unrelated sessions together.

Good examples:

- `member_123`
- `customer_987`
- `workspace_acme_owner_42`

Avoid:

- random ids that change every page load
- raw email addresses as primary ids
- mixing multiple products into one shared room id

## Launch Guidance

For a clean public launch:

- create one canonical integration demo, not five
- show a member app or storefront flow, not a niche internal prototype
- keep origin lists tight
- write custom instructions for the product surface, not for one temporary campaign
- make the companion visible as the product interface, not just a backend worker

## Security Checklist

- Use HTTPS only
- Store integration API keys server-side
- Restrict `allowedOrigins` to the exact domains you control
- Rotate keys if a client or preview environment is compromised
- Treat webhooks as authenticated server-to-server traffic

## Example Curl

```bash
curl -X POST https://agent.example.com/api/integrations/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Show me your latest offers"}],
    "user": {"id": "member_123", "name": "Jordan"},
    "room": {"id": "member-app-session-456"},
    "model": "gpt-4o-mini"
  }'
```

## When To Split Integrations

Create separate integrations when:

- different apps need different CORS origins
- different products need different instructions
- you want separate keys, limits, or audit boundaries

Keep one integration when the external surfaces are really the same product with the same trust boundary.
