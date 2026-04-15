# Excel Processor API - React Integration Guide

This guide provides comprehensive documentation for integrating the Cloud Run Excel Processor API into your React/Next.js application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [Components](#components)
5. [Hooks](#hooks)
6. [Services](#services)
7. [Usage Examples](#usage-examples)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Excel Processor integration provides a complete solution for uploading, processing, and displaying Excel file data through a Cloud Run API service. The integration includes:

- **Custom React Hook** for state management
- **Upload Component** with drag-and-drop support
- **Results Display** with tabbed interface
- **Health Check** component for API monitoring
- **Export Functionality** (JSON and CSV)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  ExcelUploader   │    │ ProcessingResults│              │
│  │   Component      │    │    Component     │              │
│  └────────┬─────────┘    └────────┬─────────┘              │
│           │                       │                          │
│           └───────────┬───────────┘                          │
│                       │                                      │
│           ┌───────────▼──────────┐                          │
│           │  useExcelProcessor   │                          │
│           │       Hook           │                          │
│           └───────────┬──────────┘                          │
│                       │                                      │
│           ┌───────────▼──────────┐                          │
│           │ excelProcessorApi    │                          │
│           │      Service         │                          │
│           └───────────┬──────────┘                          │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS
                        │
            ┌───────────▼──────────┐
            │   Next.js API Route  │
            │    /api/health       │
            └───────────┬──────────┘
                        │
            ┌───────────▼──────────┐
            │  Cloud Run Service   │
            │  Excel Processor API │
            └──────────────────────┘
```

---

## Setup

### 1. Environment Variables

Create or update your `.env.local` file:

```env
# Cloud Run Excel Processor API URL
NEXT_PUBLIC_EXCEL_API_URL=https://your-cloud-run-url
EXCEL_API_URL=https://your-cloud-run-url
```

### 2. Install Dependencies

All required dependencies are already included in your `package.json`:

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "next": "15.3.3",
    "@radix-ui/react-*": "latest",
    "lucide-react": "^0.475.0"
  }
}
```

### 3. TypeScript Configuration

The integration uses TypeScript types defined in:
- `src/types/cloud-run-api.ts` - API response types
- Component prop types are defined inline

---

## Components

### ExcelUploader

**Location:** `src/components/excel-uploader.tsx`

A comprehensive file upload component with form inputs for supplier, month, and sheet name.

#### Features:
- ✅ Drag-and-drop file upload
- ✅ File type validation (.xlsx, .xls, .xlsm)
- ✅ File size validation (10MB max)
- ✅ Upload progress indicator
- ✅ Form inputs for metadata (supplier, month, sheet)
- ✅ Error handling and display
- ✅ Success state with statistics
- ✅ Reset functionality

#### Props:

```typescript
interface ExcelUploaderProps {
  onUploadSuccess?: (result: CloudRunApiResponse) => void;
  className?: string;
}
```

#### Usage:

```tsx
import { ExcelUploader } from "@/components/excel-uploader";

function MyPage() {
  const handleSuccess = (result) => {
    console.log("File processed:", result);
  };

  return <ExcelUploader onUploadSuccess={handleSuccess} />;
}
```

---

### ProcessingResults

**Location:** `src/components/processing-results.tsx`

Displays processed Excel data in a tabbed interface with export functionality.

#### Features:
- ✅ Three tabs: Overview, Products, Combos
- ✅ Statistics cards
- ✅ Data tables with sorting
- ✅ Export to JSON and CSV
- ✅ Responsive design
- ✅ Empty state handling

#### Props:

```typescript
interface ProcessingResultsProps {
  result: CloudRunApiResponse;
  className?: string;
}
```

#### Usage:

```tsx
import { ProcessingResults } from "@/components/processing-results";

function MyPage() {
  const [result, setResult] = useState(null);

  return (
    <>
      {result && <ProcessingResults result={result} />}
    </>
  );
}
```

---

### HealthCheck

**Location:** `src/components/health-check.tsx`

A small badge component that monitors the API health status.

#### Features:
- ✅ Auto-refresh every 30 seconds
- ✅ Visual status indicator
- ✅ Tooltip with detailed information
- ✅ Gemini API configuration status

#### Usage:

```tsx
import { HealthCheck } from "@/components/health-check";

function Header() {
  return (
    <div className="header">
      <h1>Dashboard</h1>
      <HealthCheck />
    </div>
  );
}
```

---

## Hooks

### useExcelProcessor

**Location:** `src/hooks/useExcelProcessor.ts`

Custom hook for managing Excel file upload state and API interaction.

#### API:

```typescript
interface UseExcelProcessorReturn {
  uploadFile: (file: File, supplier?: string, month?: string, sheetName?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  result: CloudRunApiResponse | null;
  progress: number;
  reset: () => void;
}
```

#### Usage:

```tsx
import { useExcelProcessor } from "@/hooks/useExcelProcessor";

function MyComponent() {
  const { uploadFile, isLoading, error, result, progress, reset } = useExcelProcessor({
    onSuccess: (data) => {
      console.log("Success!", data);
    },
    onError: (err) => {
      console.error("Error:", err);
    },
  });

  const handleUpload = async (file: File) => {
    await uploadFile(file, "Supplier Name", "2025-10");
  };

  return (
    <div>
      {isLoading && <p>Loading... {progress}%</p>}
      {error && <p>Error: {error.message}</p>}
      {result && <p>Success! {result.statistics.total_products} products</p>}
    </div>
  );
}
```

---

## Services

### excelProcessorApi

**Location:** `src/services/excelProcessorApi.ts`

Service module for API communication.

#### Functions:

##### `processExcelFile(file, supplier?, month?, sheetName?)`

Uploads and processes an Excel file.

```typescript
const result = await processExcelFile(
  file,
  "Supplier Name",
  "2025-10",
  "Sheet1"
);
```

##### `checkHealth()`

Checks the API health status.

```typescript
const health = await checkHealth();
console.log(health.status); // "healthy" or "unhealthy"
```

##### `downloadJSON(data, filename?)`

Downloads data as a JSON file.

```typescript
downloadJSON(result, "my-data.json");
```

##### `downloadCSV(data, filename?)`

Downloads array data as a CSV file.

```typescript
downloadCSV(result.data.promotions.products, "products.csv");
```

---

## Usage Examples

### Complete Integration Example

```tsx
"use client";

import { useState } from "react";
import { ExcelUploader } from "@/components/excel-uploader";
import { ProcessingResults } from "@/components/processing-results";
import { HealthCheck } from "@/components/health-check";
import type { CloudRunApiResponse } from "@/types/cloud-run-api";

export default function ExcelProcessorPage() {
  const [result, setResult] = useState<CloudRunApiResponse | null>(null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Excel Processor</h1>
        <HealthCheck />
      </div>

      <ExcelUploader onUploadSuccess={setResult} />
      
      {result && <ProcessingResults result={result} />}
    </div>
  );
}
```

### Custom Upload Flow

```tsx
import { useExcelProcessor } from "@/hooks/useExcelProcessor";
import { Button } from "@/components/ui/button";

function CustomUploader() {
  const { uploadFile, isLoading, error, result } = useExcelProcessor();
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!file) return;
    
    await uploadFile(
      file,
      "My Supplier",
      "2025-10",
      "Promotions"
    );
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx,.xls,.xlsm"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      
      <Button onClick={handleSubmit} disabled={!file || isLoading}>
        {isLoading ? "Processing..." : "Upload"}
      </Button>

      {error && <p className="text-red-500">{error.message}</p>}
      
      {result && (
        <div>
          <h3>Success!</h3>
          <p>Products: {result.statistics.total_products}</p>
          <p>Combos: {result.statistics.total_combos}</p>
        </div>
      )}
    </div>
  );
}
```

### Batch Processing

```tsx
import { processExcelFile } from "@/services/excelProcessorApi";

async function processBatch(files: File[]) {
  const results = await Promise.allSettled(
    files.map(file => processExcelFile(file, "Supplier", "2025-10"))
  );

  const successful = results.filter(r => r.status === "fulfilled");
  const failed = results.filter(r => r.status === "rejected");

  console.log(`Processed: ${successful.length}/${files.length}`);
  console.log(`Failed: ${failed.length}`);

  return { successful, failed };
}
```

---

## API Reference

### Cloud Run Endpoints

#### Health Check

```
GET /health_check
GET /health
GET /
```

**Response:**
```json
{
  "status": "healthy",
  "service": "excel-processor",
  "gemini_enabled": true,
  "gemini_configured": true
}
```

#### Process Excel

```
POST /process_excel
Content-Type: multipart/form-data
```

**Request:**
- `file` (required): Excel file
- `supplier` (optional): Supplier name
- `month` (optional): Month (YYYY-MM)
- `sheet_name` (optional): Sheet to process

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
    "total_products": 10,
    "total_combos": 2,
    "products_with_combos": 5
  },
  "metadata": {...}
}
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem:** Browser blocks requests due to CORS policy.

**Solution:** The integration uses Next.js API routes as a proxy. Make sure `/api/health` route exists and forwards requests correctly.

#### 2. File Upload Fails

**Problem:** File upload returns 400 error.

**Possible Causes:**
- File size exceeds 10MB
- Invalid file type
- Missing required fields

**Solution:** Check file validation in the console and ensure file meets requirements.

#### 3. Health Check Shows "Offline"

**Problem:** Health check component shows API as offline.

**Possible Causes:**
- Cloud Run service is down
- Incorrect API URL in environment variables
- Network connectivity issues

**Solution:**
1. Verify `EXCEL_API_URL` in `.env.local`
2. Check Cloud Run service status in Google Cloud Console
3. Test API directly with curl or Postman

#### 4. Processing Takes Too Long

**Problem:** File processing times out or takes very long.

**Possible Causes:**
- Large Excel file
- Complex data structure
- Cloud Run cold start

**Solution:**
- Optimize Excel file (remove unnecessary sheets/data)
- Increase Cloud Run timeout (default: 300s)
- Use Cloud Run minimum instances to avoid cold starts

#### 5. TypeScript Errors

**Problem:** Type errors in components or hooks.

**Solution:** Ensure all types are imported from `@/types/cloud-run-api`:

```typescript
import type { CloudRunApiResponse } from "@/types/cloud-run-api";
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```tsx
const { uploadFile, error } = useExcelProcessor({
  onError: (err) => {
    // Log to error tracking service
    console.error("Upload failed:", err);
    
    // Show user-friendly message
    toast({
      title: "Upload Failed",
      description: err.message,
      variant: "destructive",
    });
  },
});
```

### 2. Loading States

Provide clear feedback during processing:

```tsx
{isLoading && (
  <div className="space-y-2">
    <Progress value={progress} />
    <p className="text-sm text-muted-foreground">
      Processing... {progress}%
    </p>
  </div>
)}
```

### 3. Validation

Validate files before uploading:

```tsx
const validateFile = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const validTypes = ['.xlsx', '.xls', '.xlsm'];
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  if (!validTypes.includes(ext)) {
    return "Invalid file type";
  }

  if (file.size > maxSize) {
    return "File too large (max 10MB)";
  }

  return null;
};
```

### 4. Accessibility

Ensure components are accessible:

```tsx
<Button
  onClick={handleUpload}
  disabled={isLoading}
  aria-label="Upload and process Excel file"
  aria-busy={isLoading}
>
  Upload
</Button>
```

### 5. Performance

Optimize for performance:

- Use `React.memo` for expensive components
- Debounce search/filter operations
- Virtualize large tables (use `react-virtual`)
- Lazy load results component

---

## Testing

### Unit Tests Example

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useExcelProcessor } from "@/hooks/useExcelProcessor";

describe("useExcelProcessor", () => {
  it("should upload file successfully", async () => {
    const { result } = renderHook(() => useExcelProcessor());
    const file = new File(["content"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await result.current.uploadFile(file, "Test Supplier", "2025-10");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.result).not.toBeNull();
    });
  });
});
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Radix UI Components](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## Support

For issues or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check the Cloud Run logs in Google Cloud Console
4. Contact your development team

---

**Last Updated:** October 7, 2025
**Version:** 1.0.0
