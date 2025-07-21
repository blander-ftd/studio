"use client";

import { useState } from "react";
import { FileList } from "@/components/file-list";
import { FileUploader } from "@/components/file-uploader";
import type { UploadedFile } from "@/types";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function DashboardPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleUploadComplete = (newFile: Omit<UploadedFile, 'status'>) => {
    setFiles((prevFiles) => {
      // Prevent adding duplicates
      if (prevFiles.some(file => file.id === newFile.id)) {
        return prevFiles;
      }
      
      const fileWithStatus: UploadedFile = {
          ...newFile,
          status: "Sin procesar"
      }

      if (fileWithStatus.type === "PDF") {
        fileWithStatus.icon = <FileText className="h-6 w-6 text-destructive" />;
      } else {
        fileWithStatus.icon = <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      }
      return [fileWithStatus, ...prevFiles];
    });
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
  };

  const handleProcessFiles = async () => {
    // Make a test POST request
    try {
      const response = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: files.map(f => f.name) }),
      });

      if (response.ok) {
        console.log('Test POST request successful:', await response.json());
        // On success, update the status
        setFiles(prevFiles => 
            prevFiles.map(file => ({ ...file, status: "Procesado" }))
        );
      } else {
        console.error('Test POST request failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error during test POST request:', error);
    }
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <div className="flex items-center">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Inicio</h1>
        </div>
        <FileUploader onUploadComplete={handleUploadComplete} />
        <FileList 
          files={files} 
          onRemoveFile={handleRemoveFile} 
          onProcessFiles={handleProcessFiles} 
        />
      </div>
    </div>
  );
}
