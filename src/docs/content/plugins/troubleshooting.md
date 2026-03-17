# Plugin Troubleshooting Guide

Quick fixes for common plugin configuration issues.

## 🔧 Quick Diagnosis

### Issue 1: `/agent.json` returns error

**Symptoms:**

```bash
curl http://localhost:2000/agent.json
# Returns: {"error":"Failed to generate agent metadata"}
```

**Causes:**

1. Agent config file is invalid or missing required fields
2. ERC-8004 plugin not enabled
3. Server compilation error

**Fixes:**

#### Fix 1A: Enable ERC-8004 Plugin via Admin UI

1. Open http://localhost:2000/admin
2. Click **Plugins** tab
3. Find **erc8004** plugin
4. Toggle it to **Enabled**
5. Click **Save Configuration**
6. Restart server: `bun run dev`

#### Fix 1B: Check Agent Config

```bash
# Validate your config
bun run config:validate config/agents/your-config.json

# If errors, fix the config file
# Common issues:
# - Missing required fields (name, id)
# - Invalid JSON syntax
# - Missing erc8004Config section
```

#### Fix 1C: Minimal Working Config

Add this to your agent config JSON:

```json
{
  "id": "my-agent",
  "name": "My Agent",
  "bio": "Agent description",
  "erc8004Config": {
    "enabled": false
  }
}
```

**Note:** Even with `enabled: false`, the metadata endpoint should work!

---

### Issue 2: Plugin status returns null

**Symptoms:**

```bash
curl http://localhost:2000/admin/api/plugins/status
# Returns: {"error": "Authentication required"}
```

**This is NORMAL for curl!** Admin API requires authentication.

**Proper Way to Check:**

1. Open http://localhost:2000/admin in browser
2. Go to **Plugins** tab
3. Look for status indicators:
   - ✓ Green = Healthy
   - ✗ Red = Unhealthy
   - ○ Gray = Disabled

**Alternative (if admin auth is disabled):**

```bash
# From browser console or with session cookie
fetch('http://localhost:2000/admin/api/plugins/status')
  .then(r => r.json())
  .then(console.log)
```

---

### Issue 3: X402 simulate endpoint not found

**Symptoms:**

```bash
curl http://localhost:2000/api/plugins/x402-gateway/simulate
# Returns: Cannot GET /api/plugins/x402-gateway/simulate
```

**Cause:** Custom plugin endpoints may not be exposed on that path.

**Working Alternatives:**

#### Method 1: Test via Admin UI

1. Open http://localhost:2000/admin
2. Go to **Plugins** tab
3. Click **x402-gateway** plugin
4. Check the health message shows: `rules=X, network=base-sepolia, asset=USDC`

#### Method 2: Test a Protected Endpoint Directly

```bash
# First, configure a rule in Admin UI:
# Pattern: /api/test
# Price: 0.01

# Then test it:
curl -i http://localhost:2000/api/test

# Should return:
# HTTP/1.1 402 Payment Required
# x-402-payments: [{"scheme":"x402","amount":"0.01",...}]
```

#### Method 3: Check Health Status

```bash
# In browser console (logged into admin):
fetch('/admin/api/plugins/status')
  .then(r => r.json())
  .then(data => console.log(data.status['x402-gateway']))

# Should show: {"status":"healthy","message":"rules=1, network=base-sepolia, asset=USDC"}
```

---

## ✅ Step-by-Step Setup (From Scratch)

### 1. Enable Plugins via Admin UI

```
1. Open: http://localhost:2000/admin
2. Click: Plugins tab
3. Enable these plugins:
   ☑ erc8004
   ☑ x402-gateway
4. Click each plugin to configure
```

### 2. Configure ERC-8004

**Minimal Configuration:**

```json
{
  "enabled": true,
  "networks": ["base-sepolia"],
  "defaultNetwork": "base-sepolia",
  "trustModels": ["reputation"],
  "autoSync": true
}
```

**Click "Save Configuration"**

### 3. Configure X402 Gateway

**Minimal Configuration:**

```json
{
  "enabled": true,
  "headerName": "x-402-receipt",
  "requireVerified": false,
  "defaults": {
    "asset": "USDC",
    "networkId": "base-sepolia",
    "receiver": "0xYourWalletAddress"
  },
  "rules": [
    {
      "pattern": "/api/test",
      "price": "0.01"
    }
  ]
}
```

**Click "Save Configuration"**

### 4. Restart Server

```bash
# Stop server (Ctrl+C)
# Start again:
bun run dev
```

### 5. Verify Configuration

**Browser Checks (easier!):**

1. **Check Agent Metadata:**
   - Open: http://localhost:2000/agent.json
   - Should show JSON with `type`, `name`, `endpoints`, etc.

2. **Check Plugin Status:**
   - Admin UI → Plugins tab
   - Both plugins should show ✓ Healthy

3. **Test X402:**
   - Try: http://localhost:2000/api/test
   - Should return 402 error (this is correct!)

**Command Line Checks:**

```bash
# 1. Check agent metadata
curl http://localhost:2000/agent.json | jq '.type'
# Should return: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1"

# 2. Test 402 endpoint
curl -i http://localhost:2000/api/test
# Should return: HTTP/1.1 402 Payment Required

# 3. Check health
curl http://localhost:2000/health
# Should return: {"status":"ok"}
```

---

## 🐛 Common Issues & Solutions

### "Failed to generate agent metadata"

**Check:**

- [ ] Is agent config valid JSON?
- [ ] Does config have `name` and `id` fields?
- [ ] Did you restart after making changes?

**Solution:**

```bash
# Validate config
bun run config:validate config/agents/your-config.json

# If no config file, create from template:
bun run config:init
```

---

### "Authentication required" for admin API

**This is expected!** Use one of these methods:

1. **Browser (easiest):** Open http://localhost:2000/admin
2. **CLI with session:** Copy cookie from browser dev tools
3. **Disable auth (dev only):** Set `ADMIN_AUTH_DISABLED=true` in .env

---

### Plugin shows as "disabled" or "unhealthy"

**Check in Admin UI:**

1. Is the toggle switch ON (green)?
2. Is configuration saved?
3. Are there validation errors below the form?

**Common Fixes:**

- Click plugin → Enable toggle → Save
- Check logs for errors: Look at terminal where `bun run dev` is running
- Restart server after configuration changes

---

### X402 not blocking endpoints

**Checklist:**

- [ ] Plugin is enabled (toggle ON)
- [ ] At least one rule is configured
- [ ] Rule pattern matches the path you're testing
- [ ] Server was restarted after config change

**Debug:**

```bash
# Check if any rules are configured:
# In Admin UI → x402-gateway plugin → check health message
# Should show: "rules=1" or more

# Test with exact path from rule:
# If rule pattern is "/api/test"
curl -i http://localhost:2000/api/test
# Must return 402
```

---

### ERC-8004 registrations not showing

**First time setup requires:**

1. Enable plugin
2. Set environment variable:
   ```bash
   # In .env file:
   WALLET_PRIVATE_KEY=0x...
   # OR
   COINBASE_PRIVATE_KEY=0x...
   ```
3. Get testnet funds (Base Sepolia faucet)
4. Use Admin UI → erc8004 → Registration tab → Register

**Check:**

- Admin UI → erc8004 plugin → Registrations tab
- Should show registration form and table

---

## 📋 Verification Checklist

Use this to verify everything is working:

### ✅ Server Running

- [ ] `bun run dev` shows no errors
- [ ] http://localhost:2000/health returns `{"status":"ok"}`
- [ ] http://localhost:2000/admin loads

### ✅ ERC-8004 Working

- [ ] http://localhost:2000/agent.json returns valid JSON
- [ ] Admin UI → Plugins → erc8004 shows ✓ Healthy
- [ ] Admin UI → erc8004 detail shows management panel

### ✅ X402 Working

- [ ] Admin UI → Plugins → x402-gateway shows ✓ Healthy
- [ ] Health message shows "rules=X" (X > 0)
- [ ] Testing protected endpoint returns 402

### ✅ Configuration Saved

- [ ] Both plugins show as "Enabled" in list
- [ ] Configuration forms show saved values
- [ ] Restart didn't reset configuration

---

## 🆘 Still Having Issues?

### Get Diagnostic Info

```bash
# Run verification script
chmod +x scripts/verify-plugins.sh
./scripts/verify-plugins.sh

# Check server logs
# Look for error messages in terminal where bun run dev is running

# Check browser console
# Open browser dev tools (F12) → Console tab
# Look for red error messages
```

### Debug Mode

```bash
# Start with debug logging
DEBUG=* bun run dev

# Or just plugin debug:
DEBUG=plugin:* bun run dev
```

### Reset Configuration

If all else fails, reset plugin configuration:

1. Admin UI → Plugins tab
2. Click plugin → Disable toggle
3. Save Configuration
4. Refresh page
5. Re-enable and reconfigure from scratch

---

## 💡 Key Insights

`★ Insight ─────────────────────────────────────`

**Most Issues Come From:**

1. **Forgetting to enable plugins** - Toggle must be ON!
2. **Not saving configuration** - Must click "Save Configuration"
3. **Not restarting after changes** - Restart to apply config
4. **Testing wrong paths** - X402 rules are path-specific

**Pro Tips:**

- Use Admin UI instead of curl (easier to see status)
- Check plugin health message for quick diagnostics
- Always restart after major config changes
- Test with simple rules first, then add complexity

`─────────────────────────────────────────────────`

---

## 📚 Related Documentation

- [Plugin Overview](./overview.md)
- [ERC-8004 Quick Start](./optional/erc8004.md)
- [Configuration](../configuration.md)
