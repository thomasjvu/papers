# Neon PostgreSQL Setup Guide

## Quick Start

### 1. Create a Neon Account

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up for a free account (0.5GB storage, perfect for starting)

### 2. Create Your Database

1. Click "New Project"
2. Choose a region close to your users
3. Select PostgreSQL version (16 recommended)
4. Name your project (ex: "phantasy-agent")

### 3. Get Your Connection String

1. In the Neon console, go to "Connection Details"
2. Copy the connection string (looks like: `postgresql://user:pass@xxx.neon.tech/dbname`)
3. **IMPORTANT**: For production, use the pooler endpoint (ends with `.pooler.neon.tech`)

### 4. Configure Your Environment

```bash
# Copy the example env file
cp .env.example .env

# Add your Neon connection string
DATABASE_URL=postgresql://user:password@xxx.neon.tech/dbname?sslmode=require

# For better performance, use the pooler endpoint:
# DATABASE_URL=postgresql://user:password@xxx.pooler.neon.tech/dbname?sslmode=require
```

### 5. Run Database Migrations

```bash
# Install dependencies
npm install

# Run migrations to create tables
npm run db:migrate
```

## Performance Optimization

### Connection Pooling (CRITICAL)

Neon provides a built-in connection pooler. **Always use it in production:**

1. In Neon console, go to "Connection Pooling"
2. Enable pooling
3. Use the pooler connection string (port 5433 instead of 5432)
4. Set max connections to 10-20 (not more!)

### Best Practices for Neon

#### 1. Use Fewer Connections

```javascript
// ✅ Good - Limited connections
DB_MAX_CONNECTIONS = 10;

// ❌ Bad - Too many connections
DB_MAX_CONNECTIONS = 100;
```

#### 2. Enable Auto-Suspend

- Neon auto-suspends after 5 minutes of inactivity
- This saves money but first query after suspend takes ~1 second
- Keep-alive queries can prevent suspension if needed

#### 3. Use Prepared Statements

Our adapter automatically uses prepared statements for:

- Repeated queries
- Protection against SQL injection
- Better performance

#### 4. Index Optimization

We've created indexes for:

- KV lookups by key
- Prefix searches
- JSONB queries
- Recent data queries

#### 5. JSONB for Flexibility

```sql
-- We use JSONB for agent configs
SELECT value->'providers'->'openai'
FROM kv_store
WHERE key = 'agent:123';

-- Efficient JSON queries with GIN indexes
SELECT * FROM kv_store
WHERE value @> '{"type": "agent"}';
```

## Monitoring

### Database Metrics

Check in Neon console:

- Active connections
- Query performance
- Storage usage
- Compute hours used

### Application Metrics

```javascript
// Get pool statistics
const stats = db.getPoolStats();
console.log('Connections:', stats);

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthy = await db.healthCheck();
  res.status(healthy ? 200 : 503).json({ healthy });
});
```

## Cost Management

### Free Tier Limits

- 0.5 GB storage
- 3 GB-hours compute/month
- Perfect for development and small projects

### When to Upgrade

- More than 100 active users
- Need > 0.5GB storage
- Want longer history retention
- Need point-in-time recovery > 7 days

### Pro Tier ($19/month)

- 10 GB storage
- 100 compute hours
- 30-day point-in-time recovery
- Priority support

## Troubleshooting

### Connection Refused

```bash
# Check if using correct endpoint
# Direct: xxx.neon.tech:5432
# Pooled: xxx.pooler.neon.tech:5433
```

### Too Many Connections

```bash
# Reduce max connections
DB_MAX_CONNECTIONS=10

# Use connection pooler endpoint
```

### Slow Queries

```sql
-- Check slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Database Suspended

- First query after suspension takes ~1 second
- Normal behavior for serverless
- Use keep-alive if needed

## Migration from File Storage

If you have existing data in file storage:

```bash
# 1. Export existing data
node scripts/export-file-data.js

# 2. Import to Neon
node scripts/import-to-neon.js
```

## Security

### Connection Security

- Always use SSL (automatic with Neon)
- Use connection pooler in production
- Rotate passwords regularly

### API Key Storage

- Never commit DATABASE_URL to git
- Use environment variables
- Consider using secrets management service

### IP Allowlisting (Optional)

1. Go to Settings → IP Allow
2. Add your server IPs
3. Enhances security but not required

## Backup & Recovery

### Automatic Backups

- Free tier: 7-day point-in-time recovery
- Pro tier: 30-day point-in-time recovery

### Manual Backups

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```
