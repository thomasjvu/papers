# Getting Started

Phantasy is best understood as a companion/VTuber product, not just an install flow.

Start with:

- [Quickstart](./getting-started/quickstart.md)
- [Use Cases](./getting-started/use-cases.md)
- [Introduction](./getting-started/introduction.md)
- [Installation](./getting-started/installation.md)

## Prerequisites

- Node.js 22.12+ LTS
- PostgreSQL 14+ (for production)
- Bun 1.3+

## Installation

```bash
npm install @phantasy/agent
npx phantasy create vtuber my-brand
npx phantasy start --config config/agents/my-brand.json
```

If you are working from a source checkout instead of the published package, use the repo flow from [Installation](./getting-started/installation.md).

## Configuration

Edit `.env` with your settings:

```env
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/phantasy

# AI Provider (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Memory
MEMORY_PROVIDER=pgvector
```

## Running

```bash
# Source checkout with hot reload
bun run dev

# Source checkout production build
bun run build
bun run start
```

## Access

- Admin UI in dev: http://localhost:5173
- Admin UI via server build: http://localhost:2000/admin
- API: http://localhost:2000/api
