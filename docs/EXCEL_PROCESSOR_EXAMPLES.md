# Excel Processor Integration - Code Examples

Comprehensive code examples for various use cases and scenarios.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Advanced Examples](#advanced-examples)
3. [Custom Implementations](#custom-implementations)
4. [Error Handling](#error-handling)
5. [Testing Examples](#testing-examples)

---

## Basic Examples

### Example 1: Simple Upload Page

The most basic implementation - just upload and display results.

```tsx
"use client";

import { useState } from "react";
import { ExcelUploader } from "@/components/excel-uploader";
import { ProcessingResults } from "@/components/processing-results";
import type { CloudRunApiResponse } from "@/types/cloud-run-api";

export default function SimplePage() {
  const [result, setResult] = useState<CloudRunApiResponse | null>(null);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Upload Excel File</h1>
      
      <ExcelUploader onUploadSuccess={setResult} />
      
      {result && <ProcessingResults result={result} />}
    </div>
  );
}
```

### Example 2: Dashboard Integration

Add to an existing dashboard with header and sidebar.

```tsx
"use client";

import { useState } from "react";
import { ExcelUploader } from "@/components/excel-uploader";
import { ProcessingResults } from "@/components/processing-results";
import { HealthCheck } from "@/components/health-check";
import { Sidebar } from "@/components/sidebar";
import type { CloudRunApiResponse } from "@/types/cloud-run-api";

export default function DashboardPage() {
  const [result, setResult] = useState<CloudRunApiResponse | null>(null);

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <header className="border-b p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Excel Processor</h1>
          <HealthCheck />
        </header>
        
        <div className="p-6 space-y-6">
          <ExcelUploader onUploadSuccess={setResult} />
          {result && <ProcessingResults result={result} />}
        </div>
      </main>
    </div>
  );
}
```

### Example 3: Modal Upload

Upload in a modal/dialog.

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExcelUploader } from "@/components/excel-uploader";
import type { CloudRunApiResponse } from "@/types/cloud-run-api";

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CloudRunApiResponse | null>(null);

  const handleSuccess = (data: CloudRunApiResponse) => {
    setResult(data);
    setOpen(false);
    // Show success toast or redirect
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload Excel File</Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Excel File</DialogTitle>
        </DialogHeader>
        
        <ExcelUploader onUploadSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
```

---

## Advanced Examples

### Example 4: Custom Upload with useExcelProcessor Hook

Build a completely custom upload interface.

```tsx
"use client";

import { useState } from "react";
import { useExcelProcessor } from "@/hooks/useExcelProcessor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Upload } from "lucide-react";

export function CustomUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [supplier, setSupplier] = useState("");
  const [month, setMonth] = useState("2025-10");

  const { uploadFile, isLoading, error, result, progress, reset } = useExcelProcessor({
    onSuccess: (data) => {
      console.log("Upload successful:", data.statistics);
    },
  });

  const handleSubmit = async () => {
    if (!file) return;
    await uploadFile(file, supplier, month);
  };

  const handleReset = () => {
    setFile(null);
    setSupplier("");
    reset();
  };

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-2">
          Excel File
        </label>
        <input
          type="file"
          accept=".xlsx,.xls,.xlsm"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isLoading}
          className="block w-full text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Supplier
        </label>
        <Input
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Enter supplier name"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Month
        </label>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Success!</strong> Processed {result.statistics.total_products} products
            and {result.statistics.total_combos} combos.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!file || isLoading}
          className="flex-1"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? "Processing..." : "Upload"}
        </Button>
        
        {(result || error) && (
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Example 5: Batch Processing

Process multiple files at once.

```tsx
"use client";

import { useState } from "react";
import { processExcelFile } from "@/services/excelProcessorApi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface FileResult {
  file: File;
  status: "pending" | "processing" | "success" | "error";
  result?: any;
  error?: string;
}

export function BatchProcessor() {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles.map(file => ({
      file,
      status: "pending" as const,
    })));
  };

  const processAll = async () => {
    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      // Update status to processing
      setFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: "processing" as const } : f
      ));

      try {
        const result = await processExcelFile(files[i].file, "Supplier", "2025-10");
        
        // Update status to success
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: "success" as const, result } : f
        ));
      } catch (error) {
        // Update status to error
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? {
            ...f,
            status: "error" as const,
            error: error instanceof Error ? error.message : "Unknown error"
          } : f
        ));
      }
    }

    setIsProcessing(false);
  };

  const successCount = files.filter(f => f.status === "success").length;
  const errorCount = files.filter(f => f.status === "error").length;
  const progress = files.length > 0 ? ((successCount + errorCount) / files.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          accept=".xlsx,.xls,.xlsm"
          multiple
          onChange={handleFileSelect}
          disabled={isProcessing}
        />
      </div>

      {files.length > 0 && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {successCount + errorCount} / {files.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="space-y-2">
            {files.map((fileResult, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm truncate flex-1">{fileResult.file.name}</span>
                
                {fileResult.status === "pending" && (
                  <Badge variant="outline">Pending</Badge>
                )}
                {fileResult.status === "processing" && (
                  <Badge variant="secondary">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Processing
                  </Badge>
                )}
                {fileResult.status === "success" && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Success
                  </Badge>
                )}
                {fileResult.status === "error" && (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Error
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={processAll}
            disabled={isProcessing || files.length === 0}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Process All Files"}
          </Button>

          {!isProcessing && (successCount > 0 || errorCount > 0) && (
            <div className="text-sm text-center">
              <span className="text-green-600">{successCount} succeeded</span>
              {" • "}
              <span className="text-red-600">{errorCount} failed</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Example 6: File History

Track upload history with local storage.

```tsx
"use client";

import { useState, useEffect } from "react";
import { ExcelUploader } from "@/components/excel-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CloudRunApiResponse } from "@/types/cloud-run-api";
import { FileSpreadsheet, Download, Trash2 } from "lucide-react";
import { downloadJSON } from "@/services/excelProcessorApi";

interface HistoryItem {
  id: string;
  filename: string;
  supplier: string;
  month: string;
  timestamp: number;
  result: CloudRunApiResponse;
}

export function FileHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("excel-processor-history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("excel-processor-history", JSON.stringify(newHistory));
  };

  const handleUploadSuccess = (result: CloudRunApiResponse) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      filename: result.metadata.original_filename,
      supplier: result.metadata.supplier,
      month: result.metadata.month,
      timestamp: Date.now(),
      result,
    };

    saveHistory([newItem, ...history]);
  };

  const handleDelete = (id: string) => {
    saveHistory(history.filter(item => item.id !== id));
  };

  const handleDownload = (item: HistoryItem) => {
    downloadJSON(item.result, `${item.filename}_${item.timestamp}.json`);
  };

  return (
    <div className="space-y-6">
      <ExcelUploader onUploadSuccess={handleUploadSuccess} />

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.supplier} • {item.month} • {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {item.result.statistics.total_products} products
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(item)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## Custom Implementations

### Example 7: Custom Results Display

Create a custom results component with different layout.

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CloudRunApiResponse } from "@/types/cloud-run-api";
import { Package, Layers, TrendingUp } from "lucide-react";

interface CustomResultsProps {
  result: CloudRunApiResponse;
}

export function CustomResults({ result }: CustomResultsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Products Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{result.statistics.total_products}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Total products found
          </p>
          
          <div className="mt-4 space-y-2">
            {result.data.promotions.products.slice(0, 3).map((product, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium truncate">{product.description}</p>
                <p className="text-xs text-muted-foreground">{product.code}</p>
              </div>
            ))}
            {result.data.promotions.products.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{result.data.promotions.products.length - 3} more
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Combos Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            Combos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{result.statistics.total_combos}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Total combos found
          </p>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Supplier:</span>
            <Badge>{result.data.general_data.supplier}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Month:</span>
            <Badge variant="outline">{result.data.general_data.month}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">With Combos:</span>
            <Badge variant="secondary">{result.statistics.products_with_combos}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Example 8: Real-time Validation

Validate file before upload with preview.

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface FileValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  preview?: {
    sheets: string[];
    rowCount: number;
  };
}

export function ValidatedUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<FileValidation | null>(null);

  const validateFile = async (file: File): Promise<FileValidation> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit`);
    }

    // Check file type
    const validTypes = ['.xlsx', '.xls', '.xlsm'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext)) {
      errors.push(`Invalid file type: ${ext}. Only .xlsx, .xls, .xlsm are allowed`);
    }

    // Read file to check structure
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      
      const sheets = workbook.SheetNames;
      if (sheets.length === 0) {
        errors.push("No sheets found in workbook");
      }

      const firstSheet = workbook.Sheets[sheets[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);
      
      if (data.length === 0) {
        warnings.push("First sheet appears to be empty");
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        preview: {
          sheets,
          rowCount: data.length,
        },
      };
    } catch (error) {
      errors.push("Failed to read Excel file");
      return { valid: false, errors, warnings };
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const result = await validateFile(selectedFile);
    setValidation(result);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".xlsx,.xls,.xlsm"
        onChange={handleFileSelect}
      />

      {validation && (
        <div className="space-y-2">
          {validation.valid ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>File is valid!</strong>
                {validation.preview && (
                  <div className="mt-2 text-sm">
                    <p>• Sheets: {validation.preview.sheets.join(", ")}</p>
                    <p>• Rows: {validation.preview.rowCount}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Validation failed:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {validation.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warnings:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {validation.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Button disabled={!validation?.valid}>
        Upload File
      </Button>
    </div>
  );
}
```

---

## Error Handling

### Example 9: Comprehensive Error Handling

Handle all possible error scenarios.

```tsx
"use client";

import { useExcelProcessor } from "@/hooks/useExcelProcessor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorHandlingExample() {
  const { uploadFile, error, reset } = useExcelProcessor({
    onError: (err) => {
      // Log to error tracking service
      console.error("Upload error:", err);
      
      // Could send to Sentry, LogRocket, etc.
      // Sentry.captureException(err);
    },
  });

  const getErrorMessage = (error: Error): { title: string; message: string; action?: string } => {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return {
        title: "Network Error",
        message: "Unable to connect to the server. Please check your internet connection.",
        action: "Retry",
      };
    }

    if (message.includes("timeout")) {
      return {
        title: "Request Timeout",
        message: "The request took too long. The file might be too large or complex.",
        action: "Try Again",
      };
    }

    if (message.includes("file type") || message.includes("invalid")) {
      return {
        title: "Invalid File",
        message: "Please upload a valid Excel file (.xlsx, .xls, or .xlsm).",
      };
    }

    if (message.includes("size") || message.includes("large")) {
      return {
        title: "File Too Large",
        message: "The file exceeds the 10MB limit. Please reduce the file size and try again.",
      };
    }

    if (message.includes("401") || message.includes("unauthorized")) {
      return {
        title: "Authentication Error",
        message: "You are not authorized to perform this action. Please log in again.",
        action: "Log In",
      };
    }

    if (message.includes("500") || message.includes("server")) {
      return {
        title: "Server Error",
        message: "The server encountered an error. Please try again later.",
        action: "Retry",
      };
    }

    return {
      title: "Upload Failed",
      message: error.message || "An unexpected error occurred. Please try again.",
      action: "Retry",
    };
  };

  if (!error) return null;

  const errorInfo = getErrorMessage(error);

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{errorInfo.title}</AlertTitle>
      <AlertDescription>
        <p className="mb-3">{errorInfo.message}</p>
        
        {errorInfo.action && (
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {errorInfo.action}
          </Button>
        )}

        <details className="mt-3">
          <summary className="text-xs cursor-pointer">Technical Details</summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
            {error.stack || error.message}
          </pre>
        </details>
      </AlertDescription>
    </Alert>
  );
}
```

---

## Testing Examples

### Example 10: Unit Tests

```typescript
import { renderHook, act, waitFor } from "@testing-library/react";
import { useExcelProcessor } from "@/hooks/useExcelProcessor";

describe("useExcelProcessor", () => {
  it("should initialize with correct default values", () => {
    const { result } = renderHook(() => useExcelProcessor());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it("should validate file type", async () => {
    const { result } = renderHook(() => useExcelProcessor());
    
    const invalidFile = new File(["content"], "test.pdf", {
      type: "application/pdf",
    });

    await act(async () => {
      await result.current.uploadFile(invalidFile);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("Invalid file type");
  });

  it("should validate file size", async () => {
    const { result } = renderHook(() => useExcelProcessor());
    
    // Create a file larger than 10MB
    const largeContent = new Array(11 * 1024 * 1024).fill("a").join("");
    const largeFile = new File([largeContent], "large.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await act(async () => {
      await result.current.uploadFile(largeFile);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("size");
  });

  it("should call onSuccess callback", async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useExcelProcessor({ onSuccess }));

    const file = new File(["content"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await act(async () => {
      await result.current.uploadFile(file, "Test Supplier", "2025-10");
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should reset state", () => {
    const { result } = renderHook(() => useExcelProcessor());

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.progress).toBe(0);
  });
});
```

### Example 11: Component Tests

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExcelUploader } from "@/components/excel-uploader";

describe("ExcelUploader", () => {
  it("should render upload zone", () => {
    render(<ExcelUploader />);
    expect(screen.getByText(/Haz clic para cargar/i)).toBeInTheDocument();
  });

  it("should handle file selection", async () => {
    const onSuccess = jest.fn();
    render(<ExcelUploader onUploadSuccess={onSuccess} />);

    const file = new File(["content"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const input = screen.getByRole("input", { hidden: true }) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("test.xlsx")).toBeInTheDocument();
    });
  });

  it("should show error for invalid file type", async () => {
    render(<ExcelUploader />);

    const file = new File(["content"], "test.pdf", {
      type: "application/pdf",
    });

    const input = screen.getByRole("input", { hidden: true }) as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Tipo de archivo no válido/i)).toBeInTheDocument();
    });
  });

  it("should disable upload button while processing", async () => {
    render(<ExcelUploader />);

    const file = new File(["content"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const input = screen.getByRole("input", { hidden: true }) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByText(/Procesar Archivo/i);
    fireEvent.click(uploadButton);

    expect(uploadButton).toBeDisabled();
  });
});
```

---

**For more examples and documentation:**
- [Full Documentation](./EXCEL_PROCESSOR_INTEGRATION.md)
- [Quick Start Guide](./EXCEL_PROCESSOR_QUICK_START.md)
- [Main README](../EXCEL_PROCESSOR_README.md)

---

**Last Updated:** October 7, 2025
