# Cloudflare R2 CORS Configuration Guide

## Overview

This guide explains how to configure CORS (Cross-Origin Resource Sharing) for your Cloudflare R2 bucket to work with the Phantasy agent media storage system.

## Required CORS Configuration

### For Development Environment

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:1999",
      "http://localhost:2000",
      "http://localhost:2000",
      "http://localhost:2002",
      "http://localhost:2003"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Type", "Content-Length", "x-amz-request-id", "x-amz-id-2"],
    "MaxAgeSeconds": 3600
  }
]
```

### For Production Environment

```json
[
  {
    "AllowedOrigins": [
      "https://your-agent-domain.com",
      "https://admin.your-agent-domain.com",
      "https://api.your-agent-domain.com"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": [
      "Authorization",
      "Content-Type",
      "Content-Length",
      "x-amz-date",
      "x-amz-content-sha256",
      "x-amz-user-agent",
      "x-amz-security-token",
      "Host"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Type",
      "Content-Length",
      "x-amz-request-id",
      "x-amz-id-2",
      "x-amz-version-id"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## How to Apply CORS Configuration

### Method 1: Using Wrangler CLI

1. **Install Wrangler** (if not already installed):

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:

   ```bash
   wrangler login
   ```

3. **Create a CORS configuration file** named `cors.json`:

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

4. **Apply the CORS rules**:

   ```bash
   wrangler r2 bucket cors put [BUCKET_NAME] --file cors.json
   ```

5. **Verify the CORS rules**:
   ```bash
   wrangler r2 bucket cors get [BUCKET_NAME]
   ```

### Method 2: Using Cloudflare Dashboard

1. **Navigate to R2** in your Cloudflare dashboard
2. **Select your bucket**
3. **Click on "Settings"** tab
4. **Find "CORS Policy"** section
5. **Click "Add CORS Policy"**
6. **Configure the following**:
   - **Allowed Origins**:
     - For development: Add all localhost ports
     - For production: Add your specific domains
   - **Allowed Methods**: Select all:
     - GET
     - HEAD
     - PUT
     - POST
     - DELETE
   - **Allowed Headers**:
     - Click "Allow all headers" OR
     - Specify the headers listed above
   - **Exposed Headers**: Add:
     - ETag
     - Content-Type
     - Content-Length
   - **Max Age**: 3600 (1 hour)

7. **Save the configuration**

### Method 3: Using AWS CLI (S3 Compatible)

Since R2 is S3-compatible, you can also use the AWS CLI:

1. **Configure AWS CLI for R2**:

   ```bash
   aws configure set aws_access_key_id YOUR_R2_ACCESS_KEY
   aws configure set aws_secret_access_key YOUR_R2_SECRET_KEY
   aws configure set region auto
   aws configure set endpoint_url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
   ```

2. **Apply CORS configuration**:
   ```bash
   aws s3api put-bucket-cors \
     --bucket YOUR_BUCKET_NAME \
     --cors-configuration file://cors.json \
     --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
   ```

## Troubleshooting CORS Issues

### Common Problems and Solutions

1. **"No 'Access-Control-Allow-Origin' header"**
   - Ensure CORS is properly configured on the bucket
   - Check that your origin is in the AllowedOrigins list
   - For development, you can temporarily use `"*"` for AllowedOrigins

2. **"Method not allowed"**
   - Add the required HTTP method to AllowedMethods
   - R2 operations typically need: GET, HEAD, PUT, POST, DELETE

3. **"Request header not allowed"**
   - Add the header to AllowedHeaders
   - For simplicity in development, use `"*"` for AllowedHeaders

4. **Preflight requests failing**
   - Ensure OPTIONS is handled (R2 handles this automatically with proper CORS)
   - Check MaxAgeSeconds is set (reduces preflight requests)

### Testing CORS Configuration

You can test your CORS configuration using curl:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: http://localhost:2000" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v \
  https://YOUR_BUCKET.YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/

# You should see Access-Control headers in the response
```

## R2 Configuration in MediaTab

After setting up CORS, configure your MediaTab with:

1. **Storage Provider**: Select "Cloudflare R2"

2. **S3 Endpoint**:

   ```
   https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
   ```

3. **Region**:

   ```
   auto
   ```

4. **Bucket Name**:

   ```
   your-bucket-name
   ```

5. **Access Key**: Your R2 Access Key ID

6. **Secret Key**: Your R2 Secret Access Key

7. **Public URL** (optional):
   ```
   https://pub-YOUR_HASH.r2.dev
   ```
   Or your custom domain if configured

## Security Considerations

### For Production:

1. **Never use wildcard (`*`) for AllowedOrigins** in production
2. **Limit AllowedMethods** to only what you need
3. **Specify exact headers** instead of using wildcard for AllowedHeaders
4. **Use HTTPS origins only** in production
5. **Regularly review and update** your CORS policies

### For Development:

- It's acceptable to use more permissive settings for local development
- Remember to tighten security before deploying to production

## Example R2 Bucket Policy (Optional)

If you need additional access control, you can also set a bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowMediaOperations",
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::your-bucket-name/*", "arn:aws:s3:::your-bucket-name"],
      "Condition": {
        "StringLike": {
          "aws:Referer": ["https://your-domain.com/*", "http://localhost:*/*"]
        }
      }
    }
  ]
}
```

## Quick Checklist

Before testing your R2 connection:

- [ ] CORS policy is applied to your R2 bucket
- [ ] AllowedOrigins includes your development/production URLs
- [ ] AllowedMethods includes GET, HEAD, PUT, POST, DELETE
- [ ] AllowedHeaders includes necessary headers (or use `*` for dev)
- [ ] ExposeHeaders includes ETag and Content-Type
- [ ] MaxAgeSeconds is set (3600 recommended)
- [ ] R2 Access Key has appropriate permissions
- [ ] Endpoint URL format is correct
- [ ] Region is set to "auto" for R2

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 CORS Configuration](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 S3 Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [Wrangler CLI for R2](https://developers.cloudflare.com/workers/wrangler/commands/#r2)

## Support

If you continue to experience issues after following this guide:

1. Check the browser console for specific CORS error messages
2. Review the server logs for authentication errors
3. Verify your R2 credentials and permissions
4. Test with a simple curl command first
5. Try using `*` for AllowedOrigins temporarily to isolate the issue
