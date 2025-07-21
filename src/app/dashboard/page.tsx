"use client";

import { useState } from "react";
import { FileList } from "@/components/file-list";
import { FileUploader } from "@/components/file-uploader";
import type { UploadedFile } from "@/types";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function DashboardPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleUploadComplete = (newFile: Omit<UploadedFile, 'status' | 'processedData'>) => {
    setFiles((prevFiles) => {
      // Prevent adding duplicates
      if (prevFiles.some(file => file.id === newFile.id)) {
        return prevFiles;
      }
      
      const fileWithStatus: UploadedFile = {
          ...newFile,
          status: "Sin procesar",
          processedData: null,
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
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: files.filter(f => f.status === 'Sin procesar') }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Test POST request successful:', result);
        
        // On success, update the status and store processed data
        setFiles(prevFiles => 
            prevFiles.map(file => ({ 
                ...file, 
                status: "Procesado",
                processedData: result.data // Assuming the response has a 'data' field
            }))
        );
      } else {
        const errorText = await response.text();
        console.error('Test POST request failed:', errorText || response.statusText);
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
