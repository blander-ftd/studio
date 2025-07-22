
"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import type { UploadedFile } from "@/types";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FilesContextType {
  files: UploadedFile[];
  handleUploadComplete: (uploadedFiles: (Omit<UploadedFile, "status" | "processedData" | "file" | "icon"> & { file: File })[]) => void;
  handleRemoveFile: (fileId: string) => void;
  handleRetryProcess: (fileId: string) => void;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const FilesProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const isProcessing = useRef(false);
  const { toast } = useToast();

  const processFile = useCallback(async (fileToProcess: UploadedFile) => {
    try {
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
  }, [toast]);

  useEffect(() => {
    const processNextFile = async () => {
      if (isProcessing.current) {
        return;
      }
      
      const fileToProcess = files.find(f => f.status === "Pendiente");
      
      if (!fileToProcess) {
        return;
      }

      isProcessing.current = true;

      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileToProcess.id ? { ...f, status: "Procesando" } : f
        )
      );

      await processFile(fileToProcess);

      isProcessing.current = false;
    };
    
    // Using setTimeout to avoid rapid state changes that might cause issues.
    const timeoutId = setTimeout(processNextFile, 100);
    
    return () => clearTimeout(timeoutId);
  }, [files, processFile]);

  const handleUploadComplete = useCallback((
    uploadedFiles: (Omit<UploadedFile, "status" | "processedData" | "file" | "icon"> & { file: File })[]
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
  }, []);

  const handleRetryProcess = useCallback((fileId: string) => {
    setFiles(prevFiles => 
        prevFiles.map(f => 
            f.id === fileId ? { ...f, status: 'Pendiente' } : f
        )
    );
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
  }, []);

  const value = {
    files,
    handleUploadComplete,
    handleRemoveFile,
    handleRetryProcess,
  };

  return <FilesContext.Provider value={value}>{children}</FilesContext.Provider>;
};

export const useFiles = (): FilesContextType => {
  const context = useContext(FilesContext);
  if (context === undefined) {
    throw new Error("useFiles must be used within a FilesProvider");
  }
  return context;
};
