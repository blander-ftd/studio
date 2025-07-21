"use client";

import { useState } from "react";
import { FileList } from "@/components/file-list";
import { FileUploader } from "@/components/file-uploader";
import type { UploadedFile } from "@/types";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function DashboardPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleUploadComplete = (newFile: UploadedFile) => {
    if (newFile.type === "PDF") {
        newFile.icon = <FileText className="h-6 w-6 text-red-500" />;
    } else {
        newFile.icon = <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    }
    setFiles((prevFiles) => [newFile, ...prevFiles]);
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <div className="flex items-center">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
        </div>
        <FileUploader onUploadComplete={handleUploadComplete} />
        <FileList files={files} />
      </div>
    </div>
  );
}
