![1759947659612](image/CLOUD_RUN_SETUP/1759947659612.png)![1759947674333](image/CLOUD_RUN_SETUP/1759947674333.png)# Cloud Run Excel Processor Setup Guide

This guide explains how to configure and use the Google Cloud Run Excel Processor API with your Next.js application.

## Prerequisites

- Google Cloud Project with billing enabled
- Cloud Run service deployed with Excel processor
- Next.js application (this project)
- Firebase project configured

## Cloud Run Service Requirements

Your Cloud Run service must provide the following endpoints:

### POST /process_excel

Process Excel files and return structured JSON data.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Excel file (.xlsx, .xls, .xlsm)
  - `supplier`: Supplier name (optional)
  - `month`: Month in YYYY-MM format (optional)
  - `sheet_name`: Sheet name to process (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "general_data": {
      "file_name": "example.xlsx",
      "supplier": "Supplier Name",
      "month": "2025-10"
    },
    "promotions": {
      "products": [...],
      "combos": [...]
    }
  },
  "statistics": {
    "file_name": "example.xlsx",
    "supplier": "Supplier Name",
    "month": "2025-10",
    "total_products": 100,
    "total_combos": 5,
    "products_with_combos": 10
  },
  "metadata": {
    "original_filename": "example.xlsx",
    "supplier": "Supplier Name",
    "month": "2025-10"
  }
}
```

### GET /health_check

Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "excel-processor",
  "gemini_enabled": true,
  "gemini_configured": true
}
```

## Configuration Steps

### 1. Deploy Cloud Run Service

If you haven't deployed your Cloud Run service yet:

```bash
# Navigate to your Cloud Run service directory
cd /path/to/excel-processor

# Deploy to Cloud Run
gcloud run deploy excel-processor \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_GENAI_API_KEY=your_api_key
```

**Important:** Note the service URL after deployment. It will look like:
```
https://excel-processor-xxxxx-uc.a.run.app
```

### 2. Configure CORS (if needed)

If you plan to call the Cloud Run API directly from the browser, configure CORS:

**Python (Flask/FastAPI):**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://your-nextjs-app.com"])
```

**Node.js (Express):**
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://your-nextjs-app.com'
}));
```

### 3. Configure Next.js Application

#### Local Development

Create or update `.env.local`:

```env
# Cloud Run Excel Processor API
EXCEL_API_URL=https://excel-processor-xxxxx-uc.a.run.app

# Optional: For direct client-side calls
NEXT_PUBLIC_EXCEL_API_URL=https://excel-processor-xxxxx-uc.a.run.app
```

#### Production Deployment

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add `EXCEL_API_URL` with your Cloud Run URL
3. Add to Production, Preview, and Development environments
4. Redeploy your application

**Netlify:**
1. Go to Site Settings → Environment Variables
2. Add `EXCEL_API_URL` with your Cloud Run URL
3. Redeploy your application

**Firebase Hosting:**
1. Update `firebase.json` with environment config
2. Or use Firebase Functions config:
```bash
firebase functions:config:set excel.api_url="https://your-url.run.app"
```

### 4. Verify Configuration

Test the configuration:

```bash
# Test health check
curl https://your-cloud-run-url.run.app/health_check

# Test file processing
curl -X POST https://your-cloud-run-url.run.app/process_excel \
  -F "file=@test.xlsx" \
  -F "supplier=Test Supplier" \
  -F "month=2025-10"
```

Expected health check response:
```json
{
  "status": "healthy",
  "service": "excel-processor",
  "gemini_enabled": true,
  "gemini_configured": true
}
```

## Using the API

### From Next.js API Route (Recommended)

The application uses a Next.js API route as a proxy to Cloud Run. This is the recommended approach because:
- ✅ Keeps API URL secret (not exposed to client)
- ✅ Allows server-side processing and validation
- ✅ Enables Firestore integration
- ✅ Better error handling

**File:** `src/app/api/process/route.ts`

The API route:
1. Receives file as Data URI from client
2. Converts to binary Blob
3. Sends to Cloud Run API
4. Saves results to Firestore
5. Returns processed data to client

### Health Check

The application includes a health check endpoint that proxies to Cloud Run:

**Endpoint:** `GET /api/health`

This endpoint:
- Checks Cloud Run service health
- Returns service status and configuration
- Used by the dashboard health indicator
- No CORS issues (server-side proxy)

**Usage:**
```bash
curl http://localhost:9002/api/health
```

**Note:** The health check uses the Next.js API route, so you don't need to set `NEXT_PUBLIC_EXCEL_API_URL`.

## Monitoring & Debugging

### View Cloud Run Logs

```bash
# Stream logs
gcloud run services logs tail excel-processor --region us-central1

# View recent logs
gcloud run services logs read excel-processor --region us-central1 --limit 50
```

Or use Google Cloud Console:
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click your service
3. Go to "Logs" tab

### View Next.js API Logs

**Development:**
```bash
npm run dev
# Watch console output
```

**Production (Vercel):**
1. Go to your project in Vercel Dashboard
2. Click "Functions" tab
3. View function logs

### Health Check in UI

The application includes a real-time health check indicator in the dashboard header:
- Green badge: API is healthy
- Red badge: API is offline
- Gray badge: Checking status

Hover over the badge to see detailed information.

## Troubleshooting

### Issue: "Health check failed"

**Possible causes:**
- Cloud Run service not deployed
- Wrong URL in environment variable
- Service not publicly accessible
- Network connectivity issues

**Solutions:**
1. Verify Cloud Run service is running:
   ```bash
   gcloud run services list
   ```

2. Test URL directly:
   ```bash
   curl https://your-url.run.app/health_check
   ```

3. Check environment variable:
   ```bash
   echo $EXCEL_API_URL
   ```

4. Verify service allows unauthenticated access:
   ```bash
   gcloud run services describe excel-processor --region us-central1
   ```

### Issue: "CORS error"

**Cause:** Calling Cloud Run directly from browser without CORS configured.

**Solution:** Either:
1. Use the Next.js API route (recommended)
2. Configure CORS on Cloud Run service

### Issue: "Processing timeout"

**Possible causes:**
- Large Excel file
- Complex processing
- Cloud Run cold start

**Solutions:**
1. Increase Cloud Run timeout:
   ```bash
   gcloud run services update excel-processor \
     --timeout 300 \
     --region us-central1
   ```

2. Increase Cloud Run memory:
   ```bash
   gcloud run services update excel-processor \
     --memory 2Gi \
     --region us-central1
   ```

3. Use minimum instances to avoid cold starts:
   ```bash
   gcloud run services update excel-processor \
     --min-instances 1 \
     --region us-central1
   ```

### Issue: "Invalid response format"

**Cause:** Cloud Run API response doesn't match expected format.

**Solution:** Verify Cloud Run API returns the correct response structure. Check:
1. `success` field is boolean
2. `data` object contains `general_data` and `promotions`
3. `statistics` object is present

## Security Best Practices

### 1. Use Environment Variables

Never hardcode the Cloud Run URL in your code. Always use environment variables:

```typescript
// ❌ Bad
const API_URL = 'https://my-service.run.app';

// ✅ Good
const API_URL = process.env.EXCEL_API_URL;
```

### 2. Use API Route Proxy

Prefer using the Next.js API route instead of direct client calls:
- Keeps Cloud Run URL secret
- Allows server-side validation
- Better error handling
- Can add authentication/authorization

### 3. Implement Rate Limiting

Add rate limiting to prevent abuse:

**Next.js API Route:**
```typescript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

**Cloud Run:**
```bash
# Set maximum concurrent requests
gcloud run services update excel-processor \
  --concurrency 80 \
  --region us-central1
```

### 4. Validate File Size

Implement file size limits:

**Client-side:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

**Server-side (Next.js):**
```typescript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
```

### 5. Authentication (Optional)

For production, consider adding authentication:

**Cloud Run with IAM:**
```bash
# Remove public access
gcloud run services remove-iam-policy-binding excel-processor \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region us-central1

# Add service account
gcloud run services add-iam-policy-binding excel-processor \
  --member="serviceAccount:your-sa@project.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region us-central1
```

**Next.js API Route:**
```typescript
// Verify user is authenticated
const session = await getServerSession(req, res, authOptions);
if (!session) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## Cost Optimization

### 1. Set Resource Limits

```bash
gcloud run services update excel-processor \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --region us-central1
```

### 2. Use Minimum Instances Wisely

Only use minimum instances if you need to avoid cold starts:

```bash
# For production with consistent traffic
gcloud run services update excel-processor \
  --min-instances 1 \
  --region us-central1

# For development (cost-effective)
gcloud run services update excel-processor \
  --min-instances 0 \
  --region us-central1
```

### 3. Monitor Usage

View Cloud Run metrics:
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click your service
3. Go to "Metrics" tab
4. Monitor:
   - Request count
   - Request latency
   - Container instance count
   - Billable time

## Performance Optimization

### 1. Enable HTTP/2

HTTP/2 is enabled by default on Cloud Run.

### 2. Use Connection Pooling

Reuse connections in your Next.js API route:

```typescript
// Create a single fetch instance
const fetchWithKeepAlive = fetch;
```

### 3. Implement Caching

Cache results for identical files:

```typescript
// Use Redis or in-memory cache
const cacheKey = `excel_${fileHash}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;
```

### 4. Optimize Cloud Run

```bash
# Use faster CPU
gcloud run services update excel-processor \
  --cpu-boost \
  --region us-central1
```

## Support

For issues with:
- **Cloud Run service**: Check Cloud Run logs and documentation
- **Next.js integration**: Check Next.js API logs and this guide
- **API responses**: Verify Cloud Run API contract

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Migration Guide](./MIGRATION_GUIDE.md)
