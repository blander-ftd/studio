
"use client";

import { useFiles } from "@/context/files-context";
import { FileList } from "@/components/file-list";
import { FileUploader } from "@/components/file-uploader";
import { Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { 
    files, 
    handleUploadComplete, 
    handleRemoveFile, 
    handleRetryProcess 
  } = useFiles();

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Procesador de Archivos
          </h1>
        </div>
        <FileUploader onUploadComplete={handleUploadComplete} />
        <FileList
          files={files}
          onRemoveFile={handleRemoveFile}
          onRetryProcess={handleRetryProcess}
        />
      </div>
    </div>
  );
}
