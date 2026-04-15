# Excel Processor Integration - Quick Start Guide

Get up and running with the Excel Processor API integration in 5 minutes.

## 🚀 Quick Setup

### 1. Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_EXCEL_API_URL=https://your-cloud-run-url
EXCEL_API_URL=https://your-cloud-run-url
```

### 2. Basic Usage

```tsx
"use client";

import { useState } from "react";
import { ExcelUploader } from "@/components/excel-uploader";
import { ProcessingResults } from "@/components/processing-results";
import { HealthCheck } from "@/components/health-check";

export default function Page() {
  const [result, setResult] = useState(null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Excel Processor</h1>
        <HealthCheck />
      </div>

      <ExcelUploader onUploadSuccess={setResult} />
      
      {result && <ProcessingResults result={result} />}
    </div>
  );
}
```

That's it! You now have a fully functional Excel processor page.

---

## 📦 What's Included

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ExcelUploader` | File upload with drag-and-drop | `src/components/excel-uploader.tsx` |
| `ProcessingResults` | Display processed data | `src/components/processing-results.tsx` |
| `HealthCheck` | API status indicator | `src/components/health-check.tsx` |

### Hooks

| Hook | Purpose | Location |
|------|---------|----------|
| `useExcelProcessor` | Upload state management | `src/hooks/useExcelProcessor.ts` |

### Services

| Function | Purpose |
|----------|---------|
| `processExcelFile()` | Upload and process file |
| `checkHealth()` | Check API status |
| `downloadJSON()` | Export as JSON |
| `downloadCSV()` | Export as CSV |

---

## 🎯 Common Use Cases

### Use Case 1: Simple Upload Page

```tsx
import { ExcelUploader } from "@/components/excel-uploader";

export default function UploadPage() {
  return (
    <div className="container">
      <ExcelUploader onUploadSuccess={(result) => {
        console.log("Uploaded:", result);
      }} />
    </div>
  );
}
```

### Use Case 2: Custom Upload Logic

```tsx
import { useExcelProcessor } from "@/hooks/useExcelProcessor";
import { Button } from "@/components/ui/button";

function CustomUpload() {
  const { uploadFile, isLoading, result } = useExcelProcessor();

  const handleUpload = async (file: File) => {
    await uploadFile(file, "Supplier", "2025-10");
  };

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }} />
      {isLoading && <p>Loading...</p>}
      {result && <p>Success! {result.statistics.total_products} products</p>}
    </div>
  );
}
```

### Use Case 3: Programmatic Processing

```tsx
import { processExcelFile } from "@/services/excelProcessorApi";

async function processFile(file: File) {
  try {
    const result = await processExcelFile(
      file,
      "Supplier Name",
      "2025-10",
      "Sheet1"
    );
    
    console.log("Products:", result.data.promotions.products);
    console.log("Combos:", result.data.promotions.combos);
    
    return result;
  } catch (error) {
    console.error("Processing failed:", error);
    throw error;
  }
}
```

---

## 🔧 Configuration Options

### ExcelUploader Props

```typescript
interface ExcelUploaderProps {
  onUploadSuccess?: (result: CloudRunApiResponse) => void;
  className?: string;
}
```

### useExcelProcessor Options

```typescript
const { uploadFile, isLoading, error, result, progress, reset } = useExcelProcessor({
  onSuccess: (data) => {
    // Called when upload succeeds
  },
  onError: (err) => {
    // Called when upload fails
  },
});
```

---

## 📊 API Response Structure

```typescript
{
  success: true,
  data: {
    general_data: {
      file_name: "example.xlsx",
      supplier: "Supplier Name",
      month: "2025-10"
    },
    promotions: {
      products: [
        {
          code: "7791909116017",
          description: "Product Name",
          dto: 0.15,  // 15% discount
          min_qty: 1,
          combo_id: "COMBO123"
        }
      ],
      combos: [
        {
          code: "COMBO123",
          description: "Combo Description",
          dto: 0.20,
          min_qty: 3
        }
      ]
    }
  },
  statistics: {
    total_products: 10,
    total_combos: 2,
    products_with_combos: 5
  }
}
```

---

## ⚡ Features

### ExcelUploader Features

- ✅ Drag-and-drop upload
- ✅ File type validation (.xlsx, .xls, .xlsm)
- ✅ File size validation (10MB max)
- ✅ Supplier and month inputs
- ✅ Optional sheet name selection
- ✅ Upload progress indicator
- ✅ Error handling
- ✅ Success state display

### ProcessingResults Features

- ✅ Tabbed interface (Overview, Products, Combos)
- ✅ Statistics cards
- ✅ Data tables
- ✅ Export to JSON
- ✅ Export to CSV
- ✅ Responsive design
- ✅ Empty state handling

### HealthCheck Features

- ✅ Auto-refresh every 30 seconds
- ✅ Visual status indicator
- ✅ Tooltip with details
- ✅ Gemini API status

---

## 🐛 Troubleshooting

### Issue: "API Offline"

**Solution:**
1. Check `EXCEL_API_URL` in `.env.local`
2. Verify Cloud Run service is running
3. Test endpoint: `curl https://your-cloud-run-url/health_check`

### Issue: File Upload Fails

**Solution:**
1. Check file size (max 10MB)
2. Verify file type (.xlsx, .xls, .xlsm)
3. Check browser console for errors

### Issue: CORS Error

**Solution:**
The integration uses Next.js API routes as a proxy. Ensure `/api/health` route exists:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const response = await fetch(`${process.env.EXCEL_API_URL}/health_check`);
  return Response.json(await response.json());
}
```

---

## 📝 File Validation

The integration validates files before upload:

| Validation | Limit | Error Message |
|------------|-------|---------------|
| File Type | .xlsx, .xls, .xlsm | "Invalid file type" |
| File Size | 10MB | "File too large" |
| File Required | Must select file | "No file selected" |

---

## 🎨 Customization

### Change Theme

The components use Tailwind CSS and shadcn/ui. Customize in `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
      },
    },
  },
};
```

### Custom Styling

All components accept a `className` prop:

```tsx
<ExcelUploader 
  className="max-w-2xl mx-auto"
  onUploadSuccess={handleSuccess}
/>
```

---

## 🔐 Security Notes

1. **File Validation:** Always validate files on both client and server
2. **Size Limits:** Enforce maximum file size (10MB default)
3. **Type Checking:** Only accept Excel files
4. **Error Handling:** Never expose sensitive error details to users
5. **API Keys:** Never expose API keys in client-side code

---

## 📚 Next Steps

1. ✅ **Read Full Documentation:** [EXCEL_PROCESSOR_INTEGRATION.md](./EXCEL_PROCESSOR_INTEGRATION.md)
2. ✅ **Explore Examples:** Check `/src/app/dashboard/excel-processor/page.tsx`
3. ✅ **Test Integration:** Upload a sample Excel file
4. ✅ **Customize UI:** Modify components to match your design
5. ✅ **Add Tests:** Write unit and integration tests

---

## 🆘 Need Help?

- 📖 Full Documentation: `docs/EXCEL_PROCESSOR_INTEGRATION.md`
- 🔍 Troubleshooting: See "Troubleshooting" section above
- 💻 Example Code: `src/app/dashboard/excel-processor/page.tsx`
- 🐛 Check Logs: Google Cloud Console → Cloud Run → Logs

---

**Quick Links:**
- [Full Documentation](./EXCEL_PROCESSOR_INTEGRATION.md)
- [API Types](../src/types/cloud-run-api.ts)
- [Example Page](../src/app/dashboard/excel-processor/page.tsx)

---

**Version:** 1.0.0  
**Last Updated:** October 7, 2025
