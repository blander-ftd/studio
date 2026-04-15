# Quick Reference - Cloud Run Excel Processor

## Environment Variables

```env
# Required for server-side API calls
EXCEL_API_URL=https://your-cloud-run-url.run.app

# Optional for client-side API calls
NEXT_PUBLIC_EXCEL_API_URL=https://your-cloud-run-url.run.app
```

## API Endpoints

### Health Check
```bash
GET https://your-cloud-run-url.run.app/health_check
```

### Process Excel
```bash
POST https://your-cloud-run-url.run.app/process_excel
Content-Type: multipart/form-data

file: [Excel file]
supplier: "Supplier Name" (optional)
month: "2025-10" (optional)
sheet_name: "Sheet1" (optional)
```

## Usage Examples

### Using Next.js API Route (Recommended)

```typescript
// Client-side component
const response = await fetch('/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileDataUri: dataUri,
    fileType: 'excel',
    fileName: file.name,
    uploadedBy: user,
  }),
});

const result = await response.json();
```

### Using API Service (Direct)

```typescript
import { processExcelFile } from '@/services/excelProcessorApi';

const result = await processExcelFile(
  file,           // File object
  'Supplier',     // Supplier name (optional)
  '2025-10',      // Month YYYY-MM (optional)
  'Sheet1'        // Sheet name (optional)
);

console.log(result.statistics);
// { total_products: 100, total_combos: 5, ... }
```

### Health Check

```typescript
import { checkHealth } from '@/services/excelProcessorApi';

const health = await checkHealth();
console.log(health.status); // "healthy"
```

### Download JSON

```typescript
import { downloadJSON } from '@/services/excelProcessorApi';

downloadJSON(result.data, 'processed_data.json');
```

## Response Format

```typescript
{
  success: true,
  data: {
    general_data: {
      file_name: string,
      supplier: string,
      month: string,
    },
    promotions: {
      products: Array<{
        code?: string,
        description?: string,
        dto?: number,
        min_qty?: number,
        combo_id?: string,
      }>,
      combos: Array<{
        code?: string,
        description?: string,
        dto?: number,
        min_qty?: number,
      }>,
    },
  },
  statistics: {
    file_name: string,
    supplier: string,
    month: string,
    total_products: number,
    total_combos: number,
    products_with_combos: number,
  },
  metadata: {
    original_filename: string,
    supplier: string,
    month: string,
  },
}
```

## File Naming Convention

For automatic supplier/month extraction:

```
SupplierName_YYYY-MM.xlsx
```

Examples:
- `Acme_2025-10.xlsx` → Supplier: "Acme", Month: "2025-10"
- `GlobalCorp_2025-11.xlsx` → Supplier: "GlobalCorp", Month: "2025-11"

## Testing

### Test Health Check
```bash
curl https://your-url.run.app/health_check
```

### Test File Processing
```bash
curl -X POST https://your-url.run.app/process_excel \
  -F "file=@test.xlsx" \
  -F "supplier=Test" \
  -F "month=2025-10"
```

### Test in Development
```bash
npm run dev
# Navigate to http://localhost:9002/dashboard
# Upload a test Excel file
```

## Common Commands

### View Cloud Run Logs
```bash
gcloud run services logs tail excel-processor --region us-central1
```

### Update Cloud Run Service
```bash
gcloud run services update excel-processor \
  --memory 1Gi \
  --timeout 300 \
  --region us-central1
```

### Deploy Cloud Run Service
```bash
gcloud run deploy excel-processor \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Troubleshooting

### Health Check Fails
1. Check `EXCEL_API_URL` is set
2. Verify Cloud Run service is running
3. Test with curl directly

### Processing Fails
1. Check file format (.xlsx, .xls, .xlsm)
2. Check file size (< 10MB recommended)
3. Check Cloud Run logs
4. Check Next.js API logs

### CORS Errors
1. Use Next.js API route (recommended)
2. Or configure CORS on Cloud Run

## File Structure

```
src/
├── services/
│   └── excelProcessorApi.ts      # API service
├── types/
│   └── cloud-run-api.ts           # TypeScript types
├── app/
│   └── api/
│       └── process/
│           └── route.ts           # API route (proxy)
└── components/
    └── health-check.tsx           # Health check component
```

## Key Files

| File | Purpose |
|------|---------|
| `src/services/excelProcessorApi.ts` | Client-side API service |
| `src/app/api/process/route.ts` | Server-side API proxy |
| `src/types/cloud-run-api.ts` | TypeScript types |
| `src/components/health-check.tsx` | Health indicator |
| `docs/CLOUD_RUN_SETUP.md` | Setup guide |
| `docs/MIGRATION_GUIDE.md` | Migration details |

## TypeScript Types

```typescript
import type {
  CloudRunApiResponse,
  CloudRunApiError,
  CloudRunHealthCheck,
  CloudRunProduct,
  CloudRunCombo,
} from '@/types/cloud-run-api';
```

## Health Check Component

```tsx
import { HealthCheck } from '@/components/health-check';

// In your layout or header
<HealthCheck />
```

Shows:
- 🟢 API Online (healthy)
- 🔴 API Offline (error)
- ⚪ Checking... (loading)

## Support

- 📖 [Full Setup Guide](./CLOUD_RUN_SETUP.md)
- 📖 [Migration Guide](./MIGRATION_GUIDE.md)
- 📖 [Main README](../README.md)
