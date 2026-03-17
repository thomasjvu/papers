# Cloudflare R2 Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### 1. Create CORS file (`cors.json`)

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### 2. Apply CORS to your bucket

```bash
# Install wrangler if needed
npm install -g wrangler

# Login
wrangler login

# Apply CORS
wrangler r2 bucket cors put YOUR_BUCKET_NAME --file cors.json

# Verify
wrangler r2 bucket cors get YOUR_BUCKET_NAME
```

### 3. Get your R2 credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Click "Manage R2 API tokens"
3. Create new API token with:
   - Permission: `Object Read & Write`
   - TTL: Leave blank for permanent
4. Save your credentials:
   - Access Key ID
   - Secret Access Key
   - Account ID (from URL or R2 dashboard)

### 4. Configure in MediaTab

| Field                     | Value                                           |
| ------------------------- | ----------------------------------------------- |
| **Enable Media Storage**  | ✅ Checked                                      |
| **Storage Provider**      | Cloudflare R2                                   |
| **S3 Endpoint**           | `https://[ACCOUNT_ID].r2.cloudflarestorage.com` |
| **Region**                | `auto`                                          |
| **Bucket Name**           | `your-bucket-name`                              |
| **Access Key**            | `[Your R2 Access Key ID]`                       |
| **Secret Key**            | `[Your R2 Secret Access Key]`                   |
| **Public URL** (optional) | `https://pub-[HASH].r2.dev` or custom domain    |

### 5. Test Connection

Click "Test Connection" button - you should see "✅ S3 connection successful"

## 🔍 Common Issues

### ❌ "Fetch failed" error

1. Check CORS is applied: `wrangler r2 bucket cors get YOUR_BUCKET`
2. Verify endpoint format: Must be `https://` not `http://`
3. Check credentials are correct

### ❌ "403 Forbidden" error

1. Verify Access Key has read/write permissions
2. Check bucket name is correct
3. Ensure bucket exists

### ❌ "Network error" or timeout

1. Check if you're behind a firewall/VPN
2. Try using a different network
3. Verify R2 endpoint is accessible

## 📝 Example Endpoint Formats

### ✅ Correct formats:

- `https://abc123def456.r2.cloudflarestorage.com`
- `https://your-account-id.r2.cloudflarestorage.com`

### ❌ Wrong formats:

- `abc123def456.r2.cloudflarestorage.com` (missing https://)
- `https://r2.cloudflarestorage.com` (missing account ID)
- `https://abc123def456.r2.cloudflarestorage.com/bucket-name` (bucket goes in separate field)

## 🎯 Test with curl

Quick test to verify your setup:

```bash
# Replace with your values
ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
BUCKET="your-bucket-name"
ACCESS_KEY="your-access-key"
SECRET_KEY="your-secret-key"

# Test listing bucket (should return XML)
curl -X GET \
  -H "Authorization: AWS4-HMAC-SHA256 ..." \
  "$ENDPOINT/$BUCKET?list-type=2"
```

## 💡 Pro Tips

1. **Development**: Use `"*"` for AllowedOrigins during development
2. **Production**: Replace with specific domains before deploying
3. **Public Access**: Set up a public R2.dev subdomain for serving media files
4. **Custom Domain**: Configure custom domain for professional URLs
5. **Caching**: R2 automatically caches frequently accessed files

## 🆘 Still Having Issues?

Check the browser console (F12) and server logs for detailed error messages after applying the enhanced logging from this PR.
