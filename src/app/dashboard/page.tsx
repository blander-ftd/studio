"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { FileList } from "@/components/file-list";
import { FileUploader } from "@/components/file-uploader";
import type { UploadedFile } from "@/types";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleUploadComplete = async (
    newFile: Omit<UploadedFile, "status" | "processedData" | "file"> & { file: File }
  ) => {
    // Create a new file object with initial status and processedData
    const fileWithStatus: UploadedFile = {
      ...newFile,
      status: "Sin procesar",
      processedData: null,
    };

    // Assign icon based on file type
    if (fileWithStatus.type === "PDF") {
      fileWithStatus.icon = <FileText className="h-6 w-6 text-destructive" />;
    } else {
      fileWithStatus.icon = (
        <FileSpreadsheet className="h-6 w-6 text-green-500" />
      );
    }

    setFiles((prevFiles) => {
      // Prevent adding duplicates
      if (prevFiles.some((file) => file.id === newFile.id)) {
        return prevFiles;
      }
      return [fileWithStatus, ...prevFiles];
    });

    // Automatically process the newly uploaded file
    try {
      let fileData;
      let fileTypeForRequest: 'pdf' | 'excel' = 'excel';

      if (fileWithStatus.type === "PDF") {
        fileTypeForRequest = 'pdf';
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(fileWithStatus.file);
        });
      } else { // Excel
        fileTypeForRequest = 'excel';
        fileData = await convertExcelToText(fileWithStatus.file);
      }

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
        const errorText = await response.text();
        throw new Error(`Error procesando el archivo: ${errorText || response.statusText}`);
      }

      const result = await response.json();

      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileWithStatus.id
            ? { ...f, status: "Procesado", processedData: result }
            : f
        )
      );

      toast({
        title: "Archivo procesado",
        description: `${fileWithStatus.name} ha sido procesado exitosamente.`,
      });

    } catch (error) {
      console.error("Error processing file:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
      
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileWithStatus.id
            ? { ...f, status: "Error" } // You might want to add an "Error" status
            : f
        )
      );
      
      toast({
        title: "Error de procesamiento",
        description: errorMessage,
        variant: "destructive",
      });
    }
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
        />
      </div>
    </div>
  );
}

async function convertExcelToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const text = XLSX.utils.sheet_to_txt(worksheet);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
}
