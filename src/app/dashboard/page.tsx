
"use client";

import { useState, useEffect, useRef } from "react";
import { FileList } from "@/components/file-list";
import { FileUploader } from "@/components/file-uploader";
import type { UploadedFile } from "@/types";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processingQueue, setProcessingQueue] = useState<UploadedFile[]>([]);
  const isProcessing = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const processNextInQueue = async () => {
      if (isProcessing.current || processingQueue.length === 0) {
        return;
      }

      isProcessing.current = true;
      const fileToProcess = processingQueue[0];

      // Set status to 'Procesando' as soon as it's picked from the queue
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileToProcess.id
            ? { ...f, status: "Procesando" }
            : f
        )
      );
      
      await processFile(fileToProcess);
      
      // Remove the processed file from the queue and allow the next one to start
      setProcessingQueue(prev => prev.slice(1));
      isProcessing.current = false;
    };
    
    processNextInQueue();
  }, [processingQueue, files]);


  const processFile = async (fileToProcess: UploadedFile) => {
    try {
      const fileData = await new Promise<string | ArrayBuffer | null>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result);
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
            if (errorText && !errorText.trim().startsWith("<!DOCTYPE html") && !errorText.trim().startsWith("<html")) {
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

      toast({
        title: "Archivo procesado",
        description: `${fileToProcess.name} ha sido procesado exitosamente.`,
      });

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
    newFiles: (Omit<UploadedFile, "status" | "processedData" | "file"> & { file: File })[]
  ) => {
    const filesWithStatus: UploadedFile[] = newFiles.map(newFile => {
       const fileType = newFile.file.type === 'application/pdf' ? 'PDF' : 'Excel';
       const icon = fileType === 'PDF' 
         ? <FileText className="h-6 w-6 text-destructive" />
         : <FileSpreadsheet className="h-6 w-6 text-green-500" />;
       
       return {
          ...newFile,
          type: fileType,
          status: "Procesando", // Will be queued, but this is the initial visible state
          processedData: null,
          icon: icon,
       }
    });
    
    // Add to main file list first
    setFiles(prevFiles => [...filesWithStatus, ...prevFiles]);
    // Then add to processing queue
    setProcessingQueue(prev => [...prev, ...filesWithStatus]);
  };

  const handleRetryProcess = (fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId);
    if (fileToRetry) {
      // Add to the end of the queue
      setProcessingQueue(prev => [...prev, fileToRetry]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    setProcessingQueue((prevQueue) => prevQueue.filter((f) => f.id !== fileId));
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
