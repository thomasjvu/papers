# Migration Notes - Cloudflare Workers to Node.js

## Issues Fixed

1. **Package Manager**: Use `bun` for installs, scripts, and lockfile management

2. **Missing Durable Object Export**:
   - Removed `export { AgentWebSocket } from './websocket/durable-object'`
   - WebSocket handling is now in `server.ts`

3. **Missing Services**:
   - Created `agent-service.ts` stub

4. **Database Adapter**:
   - Created `database.ts` adapter to replace Cloudflare D1
   - Currently using stub implementation

5. **Environment Variables**:
   - Added missing env vars (R2_BUCKET and related platform configs)
   - Fixed import paths

## Running the Server

```bash
cd apps/agent
bun install
bun run dev
```

## Available Endpoints

- Admin UI: http://localhost:2000/admin
- Health Check: http://localhost:2000/health
- Agent API: http://localhost:2000/agent/\*
- Admin API: http://localhost:2000/admin/api/\*

## Next Steps

1. ✅ ~~Replace stub database with real implementation~~ **DONE - Using Neon PostgreSQL**
2. Add S3/MinIO for file storage (replacing R2)
3. Implement real agent-service.ts
4. ✅ ~~Add Redis for distributed KV storage~~ **DONE - Using Railway Redis**

## Key Differences from Workers Version

- Persistent connections ✅
- No 30-second execution limit ✅
- Full Discord bot support ✅
- Traditional debugging tools ✅
- Higher memory limits ✅
