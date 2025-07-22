
"use client";

import { useState, useEffect, useRef } from "react";
import { FileList } from "@/components/file-list";
import { FileUploader } from "@/components/file-uploader";
import type { UploadedFile } from "@/types";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const isProcessing = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const processNextFile = async () => {
      // If a file is already being processed, do nothing.
      if (isProcessing.current) {
        return;
      }
      
      // Find the first file that is 'Pendiente' (Pending).
      const fileToProcess = files.find(f => f.status === "Pendiente");
      
      // If no file needs processing, we're done.
      if (!fileToProcess) {
        return;
      }

      // Set the flag to indicate processing has started.
      isProcessing.current = true;

      // Update the file's status to 'Procesando' in the UI.
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileToProcess.id ? { ...f, status: "Procesando" } : f
        )
      );

      // Call the actual processing function.
      await processFile(fileToProcess);

      // Reset the flag so the next file can be processed.
      isProcessing.current = false;
    };
    
    // This effect runs whenever the `files` array changes.
    processNextFile();
  }, [files]);


  const processFile = async (fileToProcess: UploadedFile) => {
    try {
      // Convert file to base64 for the API request
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error("Failed to read file as data URL"));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(fileToProcess.file);
      });

      const fileTypeForRequest = fileToProcess.type === 'PDF' ? 'pdf' : 'excel';

      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          type: fileTypeForRequest,
          file: fileData 
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `Error del servidor: ${response.statusText}`;
        if (contentType && contentType.includes("application/json")) {
            const errorJson = await response.json();
            errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
        } else {
            const errorText = await response.text();
            // Check if the response is likely HTML, and if so, show a generic message.
            if (errorText && (errorText.trim().startsWith("<!DOCTYPE html") || errorText.trim().startsWith("<html"))) {
                errorMessage = "El servidor devolvió un error inesperado. Por favor, intente de nuevo.";
            } else if (errorText) {
                 errorMessage = errorText;
            }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileToProcess.id
            ? { ...f, status: "Procesado", processedData: result }
            : f
        )
      );

    } catch (error) {
      console.error("Error processing file:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
      
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileToProcess.id
            ? { ...f, status: "Error" }
            : f
        )
      );
      
      toast({
        title: "Error de procesamiento",
        description: `Error procesando el archivo: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };


  const handleUploadComplete = (
    uploadedFiles: (Omit<UploadedFile, "status" | "processedData" | "file"> & { file: File })[]
  ) => {
    const filesWithStatus: UploadedFile[] = uploadedFiles.map(newFile => {
       const fileType = newFile.file.type === 'application/pdf' ? 'PDF' : 'Excel';
       const icon = fileType === 'PDF' 
         ? <FileText className="h-6 w-6 text-destructive" />
         : <FileSpreadsheet className="h-6 w-6 text-green-500" />;
       
       return {
          ...newFile,
          type: fileType,
          status: "Pendiente",
          processedData: null,
          icon: icon,
       }
    });
    
    setFiles(prevFiles => {
        const existingIds = new Set(prevFiles.map(f => f.id));
        const newUniqueFiles = filesWithStatus.filter(f => !existingIds.has(f.id));
        return [...newUniqueFiles, ...prevFiles];
    });
  };

  const handleRetryProcess = (fileId: string) => {
    setFiles(prevFiles => 
        prevFiles.map(f => 
            f.id === fileId ? { ...f, status: 'Pendiente' } : f
        )
    );
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Inicio
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
